import { Router } from 'express';
import { stripeService } from '../services/stripe.service';
import { subscriptionService } from '../services/subscription.service';
import { inAppNotificationService } from '../services/in-app-notification.service';
import { sessionPaymentRepository } from '../repositories/session-payment.repository';
import { bookingNotificationService } from '../services/booking-notification.service';
import { productPaymentService } from '../services/product-payment.service';
import { prisma } from '../lib/prisma';
import type Stripe from 'stripe';

export const stripeWebhookRouter = Router();

stripeWebhookRouter.post(
  '/',
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripeService.constructWebhookEvent(req.body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const item = subscription.items.data[0];
          const priceId = item?.price?.id ?? null;
          const periodStart = item?.current_period_start ?? null;
          const periodEnd = item?.current_period_end ?? null;
          await subscriptionService.handleSubscriptionUpdate(
            subscription.id,
            subscription.customer as string,
            subscription.status,
            priceId,
            periodStart,
            periodEnd,
            subscription.cancel_at_period_end,
            subscription.canceled_at ?? null
          );
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await subscriptionService.handleSubscriptionUpdate(
            subscription.id,
            subscription.customer as string,
            'canceled',
            null,
            null,
            null,
            false,
            subscription.canceled_at ?? null
          );
          break;
        }

        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode === 'subscription' && session.subscription && session.customer) {
            await subscriptionService.handleCheckoutCompleted(
              session.customer as string,
              session.subscription as string
            );
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.customer) {
            await subscriptionService.handlePaymentFailed(invoice.customer as string);

            // In-app notification for the trainer
            const sub = await prisma.subscription.findUnique({
              where: { stripeCustomerId: invoice.customer as string },
              select: { trainer: { select: { userId: true } } },
            });
            if (sub?.trainer?.userId) {
              inAppNotificationService.notify({
                userId: sub.trainer.userId,
                type: 'PAYMENT_FAILED',
                title: 'Payment failed — please update your billing details',
                link: '/dashboard/settings?tab=subscription',
              }).catch(console.error);
            }
          }
          break;
        }

        case 'invoice.paid': {
          // Subscription update event will handle tier syncing
          break;
        }

        case 'customer.subscription.trial_will_end': {
          const subscription = event.data.object as Stripe.Subscription;
          const sub = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id },
            select: { trainer: { select: { userId: true } } },
          });
          if (sub?.trainer?.userId) {
            inAppNotificationService.notify({
              userId: sub.trainer.userId,
              type: 'TRIAL_EXPIRING',
              title: 'Your trial expires in 3 days — upgrade to keep your features',
              link: '/pricing',
            }).catch(console.error);
          }
          break;
        }

        // ── Session payment events ──

        case 'payment_intent.succeeded': {
          const pi = event.data.object as Stripe.PaymentIntent;
          if (pi.metadata?.platform !== 'fitnassist') break;

          // Product order payment
          if (pi.metadata?.type === 'product_order') {
            await productPaymentService.confirmOrder(pi.id);
            break;
          }

          // Session payment
          const payment = await sessionPaymentRepository.findByPaymentIntentId(pi.id);
          if (payment && payment.status === 'PENDING') {
            await sessionPaymentRepository.update(payment.id, {
              status: 'SUCCEEDED',
              paidAt: new Date(),
            });

            // Notify client + trainer
            bookingNotificationService.sendPaymentReceived(payment.bookingId).catch(console.error);
          }
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          const piId = typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;
          if (!piId) break;

          const payment = await sessionPaymentRepository.findByPaymentIntentId(piId);
          if (!payment) break;

          // Refund details are already written by our service methods,
          // but sync status from Stripe in case of manual refunds via dashboard
          const totalRefunded = charge.amount_refunded;
          const isFullRefund = totalRefunded >= payment.amount;

          await sessionPaymentRepository.update(payment.id, {
            status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            refundAmount: totalRefunded,
            refundedAt: new Date(),
          });

          bookingNotificationService.sendRefundProcessed(payment.bookingId, totalRefunded, payment.currency).catch(console.error);
          break;
        }

        case 'account.updated': {
          const account = event.data.object as Stripe.Account;
          // Sync Connect onboarding status
          const trainer = await prisma.trainerProfile.findFirst({
            where: { stripeConnectedAccountId: account.id },
          });
          if (trainer) {
            const isComplete = account.charges_enabled && account.payouts_enabled;
            if (trainer.stripeOnboardingComplete !== isComplete) {
              await prisma.trainerProfile.update({
                where: { id: trainer.id },
                data: { stripeOnboardingComplete: isComplete },
              });
            }
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const pi = event.data.object as Stripe.PaymentIntent;
          if (pi.metadata?.platform !== 'fitnassist') break;

          const payment = await sessionPaymentRepository.findByPaymentIntentId(pi.id);
          if (payment && payment.status === 'PENDING') {
            await sessionPaymentRepository.update(payment.id, {
              status: 'FAILED',
            });

            bookingNotificationService.sendPaymentFailed(payment.bookingId).catch(console.error);
          }
          break;
        }

        default:
          // Unhandled event type — ignore
          break;
      }
    } catch (err) {
      console.error(`Error processing webhook event ${event.type}:`, err);
      res.status(500).json({ error: 'Webhook processing failed' });
      return;
    }

    res.json({ received: true });
  }
);
