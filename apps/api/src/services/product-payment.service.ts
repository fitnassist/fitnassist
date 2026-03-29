import { TRPCError } from '@trpc/server';
import { getStripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { productRepository } from '../repositories/product.repository';
import { productOrderRepository } from '../repositories/product-order.repository';
import { couponRepository } from '../repositories/coupon.repository';
import { couponService } from './coupon.service';
import { inAppNotificationService } from './in-app-notification.service';
import { sendEmail } from '../lib/email';
import { emailTemplates } from '../lib/email-templates';

const PLATFORM_FEE_PERCENT = 0.03; // 3%

const getTrainerStripeAccount = async (trainerId: string) => {
  const trainer = await prisma.trainerProfile.findUnique({
    where: { id: trainerId },
    select: {
      stripeConnectedAccountId: true,
      stripeOnboardingComplete: true,
      paymentsEnabled: true,
      userId: true,
    },
  });
  if (!trainer?.paymentsEnabled || !trainer.stripeConnectedAccountId || !trainer.stripeOnboardingComplete) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Trainer has not enabled payments' });
  }
  return trainer;
};

export const productPaymentService = {
  async createOrder(
    buyerUserId: string,
    trainerId: string,
    items: Array<{ productId: string; quantity: number }>,
    couponCode?: string,
    shippingName?: string,
    shippingAddress?: string,
  ) {
    const stripe = getStripe();
    const trainer = await getTrainerStripeAccount(trainerId);

    // Validate products and build line items
    const lineItems: Array<{
      productId: string;
      productName: string;
      pricePence: number;
      quantity: number;
    }> = [];
    let subtotalPence = 0;

    for (const item of items) {
      const product = await productRepository.findById(item.productId);
      if (!product || product.trainerId !== trainerId || product.status !== 'ACTIVE') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Product not available: ${item.productId}` });
      }
      if (product.stockCount !== null && product.stockCount < item.quantity) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Insufficient stock for ${product.name}` });
      }

      const lineTotal = product.pricePence * item.quantity;
      subtotalPence += lineTotal;
      lineItems.push({
        productId: product.id,
        productName: product.name,
        pricePence: product.pricePence,
        quantity: item.quantity,
      });
    }

    // Apply coupon if provided
    let discountPence = 0;
    let couponId: string | undefined;
    if (couponCode) {
      const validation = await couponService.validateCoupon(trainerId, couponCode, subtotalPence);
      discountPence = validation.discountPence;
      couponId = validation.couponId;
    }

    const totalPence = subtotalPence - discountPence;
    if (totalPence < 1) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Order total must be at least 1p' });
    }

    const platformFeePence = Math.round(totalPence * PLATFORM_FEE_PERCENT);

    // Create order in DB first to get the ID for metadata
    const order = await productOrderRepository.create({
      buyerUserId,
      trainerId,
      subtotalPence,
      discountPence,
      totalPence,
      platformFeePence,
      couponId,
      couponCode: couponCode?.toUpperCase(),
      shippingName,
      shippingAddress,
      items: lineItems,
    });

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPence,
      currency: 'gbp',
      application_fee_amount: platformFeePence,
      transfer_data: {
        destination: trainer.stripeConnectedAccountId!,
      },
      metadata: {
        type: 'product_order',
        orderId: order.id,
        trainerId,
        buyerUserId,
        platform: 'fitnassist',
      },
    });

    // Store the payment intent ID
    await productOrderRepository.updateStatus(order.id, 'PENDING_PAYMENT', {
      stripeChargeId: undefined,
    });
    await prisma.productOrder.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      orderId: order.id,
      totalPence,
      discountPence,
    };
  },

  async confirmOrder(paymentIntentId: string) {
    const order = await productOrderRepository.findByPaymentIntentId(paymentIntentId);
    if (!order || order.status !== 'PENDING_PAYMENT') return;

    // Mark as PAID
    await productOrderRepository.updateStatus(order.id, 'PAID', {
      paidAt: new Date(),
    });

    // Decrement stock for physical products
    for (const item of order.items) {
      if (item.product.stockCount !== null) {
        await productRepository.updateStock(item.productId, item.quantity);
      }
    }

    // Increment coupon redemptions
    if (order.couponId) {
      await couponRepository.incrementRedemptions(order.couponId);
    }

    // Check if all items are digital — if so, mark as DELIVERED
    const allDigital = order.items.every((item) => item.product.type === 'DIGITAL');
    if (allDigital) {
      await productOrderRepository.updateStatus(order.id, 'DELIVERED');
    }

    // Build shared item data for notifications
    const itemData = order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      pricePence: item.pricePence,
    }));
    const hasPhysical = order.items.some((item) => item.product.type === 'PHYSICAL');

    // Notify trainer about new order
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: order.trainerId },
      select: { userId: true, displayName: true, user: { select: { email: true } } },
    });
    if (trainer) {
      inAppNotificationService.notify({
        userId: trainer.userId,
        type: 'NEW_ORDER',
        title: `New order from ${order.buyer.name ?? 'a customer'}`,
        body: `${order.items.length} item${order.items.length > 1 ? 's' : ''} — £${(order.totalPence / 100).toFixed(2)}`,
        link: '/dashboard/storefront?tab=orders',
      }).catch(console.error);

      sendEmail({
        to: trainer.user.email,
        subject: `New order — £${(order.totalPence / 100).toFixed(2)}`,
        html: emailTemplates.newOrderTrainer({
          trainerName: trainer.displayName,
          orderId: order.id,
          buyerName: order.buyer.name ?? 'Customer',
          buyerEmail: order.buyer.email,
          items: itemData,
          totalPence: order.totalPence,
          hasPhysical,
        }),
      }).catch(console.error);
    }

    // Notify buyer
    inAppNotificationService.notify({
      userId: order.buyerUserId,
      type: 'ORDER_CONFIRMED',
      title: 'Order confirmed',
      body: `Your order of £${(order.totalPence / 100).toFixed(2)} has been confirmed`,
      link: '/dashboard/purchases',
    }).catch(console.error);

    sendEmail({
      to: order.buyer.email,
      subject: 'Order confirmed',
      html: emailTemplates.orderConfirmationBuyer({
        buyerName: order.buyer.name ?? 'there',
        orderId: order.id,
        trainerName: trainer?.displayName ?? 'your trainer',
        items: itemData,
        subtotalPence: order.subtotalPence,
        discountPence: order.discountPence,
        totalPence: order.totalPence,
        isAllDigital: allDigital,
      }),
    }).catch(console.error);
  },

  async refundOrder(orderId: string, trainerId: string, reason?: string) {
    const order = await productOrderRepository.findById(orderId);
    if (!order || order.trainerId !== trainerId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
    }
    if (order.status === 'REFUNDED' || order.status === 'CANCELLED') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Order already refunded or cancelled' });
    }
    if (!order.stripePaymentIntentId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'No payment to refund' });
    }

    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      reason: 'requested_by_customer',
    });

    await productOrderRepository.updateStatus(orderId, 'REFUNDED', {
      refundAmount: order.totalPence,
      refundReason: reason ?? 'Refunded by trainer',
      refundedAt: new Date(),
    });

    // Restore stock for physical products
    for (const item of order.items) {
      if (item.product.stockCount !== null) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockCount: { increment: item.quantity } },
        });
      }
    }

    // Notify buyer
    inAppNotificationService.notify({
      userId: order.buyerUserId,
      type: 'ORDER_REFUNDED',
      title: 'Order refunded',
      body: `Your order of £${(order.totalPence / 100).toFixed(2)} has been refunded`,
      link: '/dashboard/purchases',
    }).catch(console.error);

    sendEmail({
      to: order.buyer.email,
      subject: 'Order refunded',
      html: emailTemplates.orderRefunded({
        buyerName: order.buyer.name ?? 'there',
        orderId: order.id,
        amount: `£${(order.totalPence / 100).toFixed(2)}`,
        reason,
      }),
    }).catch(console.error);

    return { success: true };
  },

  async updateOrderStatus(orderId: string, trainerId: string, status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED') {
    const order = await productOrderRepository.findById(orderId);
    if (!order || order.trainerId !== trainerId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
    }
    if (order.status === 'REFUNDED' || order.status === 'CANCELLED') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot update a refunded or cancelled order' });
    }

    await productOrderRepository.updateStatus(orderId, status);

    // Notify buyer of status change
    const statusLabels: Record<string, string> = {
      PROCESSING: 'being processed',
      SHIPPED: 'shipped',
      DELIVERED: 'delivered',
    };
    const notifType = status === 'SHIPPED' ? 'ORDER_SHIPPED' as const
      : status === 'DELIVERED' ? 'ORDER_DELIVERED' as const
      : 'ORDER_CONFIRMED' as const;
    inAppNotificationService.notify({
      userId: order.buyerUserId,
      type: notifType,
      title: `Order ${statusLabels[status]}`,
      body: `Your order is now ${statusLabels[status]}`,
      link: '/dashboard/purchases',
    }).catch(console.error);

    // Send email for shipped and delivered
    if (status === 'SHIPPED' || status === 'DELIVERED') {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { id: order.trainerId },
        select: { displayName: true },
      });
      const template = status === 'SHIPPED' ? emailTemplates.orderShipped : emailTemplates.orderDelivered;
      sendEmail({
        to: order.buyer.email,
        subject: status === 'SHIPPED' ? 'Order shipped' : 'Order delivered',
        html: template({
          buyerName: order.buyer.name ?? 'there',
          orderId: order.id,
          trainerName: trainer?.displayName ?? 'your trainer',
        }),
      }).catch(console.error);
    }

    return { success: true };
  },

  async getDownloadUrl(orderId: string, productId: string, userId: string) {
    const order = await productOrderRepository.findById(orderId);
    if (!order || order.buyerUserId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
    }
    if (order.status !== 'PAID' && order.status !== 'DELIVERED') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Order is not paid' });
    }

    const item = order.items.find((i) => i.productId === productId);
    if (!item) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not in this order' });
    }

    const product = await productRepository.findById(productId);
    if (!product || product.type !== 'DIGITAL' || !product.digitalFileUrl) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'No digital file available' });
    }

    // Return the file URL directly — Cloudinary raw URLs are accessible
    // For enhanced security, we could generate time-limited signed URLs here
    return { url: product.digitalFileUrl, fileName: product.digitalFileName ?? 'download' };
  },

  async getTrainerOrders(trainerId: string, cursor?: string, limit?: number) {
    const orders = await productOrderRepository.findByTrainer(trainerId, { cursor, limit });
    const hasMore = orders.length > (limit ?? 20);
    if (hasMore) orders.pop();
    return {
      orders,
      nextCursor: hasMore ? orders[orders.length - 1]?.id : undefined,
    };
  },

  async getBuyerOrders(userId: string, cursor?: string, limit?: number) {
    const orders = await productOrderRepository.findByBuyer(userId, { cursor, limit });
    const hasMore = orders.length > (limit ?? 20);
    if (hasMore) orders.pop();
    return {
      orders,
      nextCursor: hasMore ? orders[orders.length - 1]?.id : undefined,
    };
  },
};
