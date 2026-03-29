# Phase 9.2: Product Storefront

## Context

ELITE trainers need a way to sell digital products (workout programs, meal plans, guides, templates) and physical products directly through Fitnassist. This leverages the existing Stripe Connect infrastructure (destination charges, connected accounts) already built for session payments. Trainers can also create coupon/discount codes via Stripe to incentivise purchases.

## What Already Exists

- **Stripe Connect**: Standard connected accounts, destination charges, refund handling
- **SessionPayment model**: Pattern for payment intents, status tracking, refunds (flat £0.50 fee)
- **Resource models**: Exercise, Recipe, WorkoutPlan, MealPlan (free assignables, not products)
- **Upload infrastructure**: Cloudinary signed uploads (images, videos) — needs PDF/document support
- **Website builder**: `SHOP` section type already in SectionType enum
- **Feature gating**: `ELITE` tier with `hasFeatureAccess()` helper
- **ELITE tier features list**: Already includes "Product storefront" in marketing copy

## Key Design Decisions

1. **We manage products, Stripe manages payments + coupons** — products need rich descriptions, image galleries, digital file hosting, SEO, and themed shop pages that Stripe can't provide. But Stripe's coupon/promotion code system and payment processing are best-in-class, so we lean on those.
2. **Stripe Elements, not Stripe Checkout** — checkout stays inline on the trainer's branded site rather than redirecting to a generic Stripe page. Preserves the website builder UX.
3. **Stripe Promotion Codes for coupons** — trainers create coupons via our UI, we create them in Stripe via the API (`stripe.coupons.create` + `stripe.promotionCodes.create`). Stripe handles validation, usage tracking, expiry, and applies discounts to the PaymentIntent automatically.
4. **Platform fee: 3%** — percentage-based, not flat. On a £20 product: we take 60p, Stripe takes ~50p (1.5% + 20p), trainer keeps £18.90. Competitive with Teachable (5%), well below Gumroad (10%). Session payments keep their existing flat £0.50 fee.
5. **Digital + physical products** — digital products deliver via secure download links (time-limited signed Cloudinary URLs). Physical products track order status (processing → shipped → delivered).
6. **No product variants in v1** — one price per product. Can add size/colour variants later.
7. **Inventory tracking** — optional stock count for physical products. Digital products are unlimited.
8. **Dedicated Product model** — not repurposing existing resource models. Products have pricing, delivery, stock. Resources remain free assignables to clients.

---

## Schema Changes

**File: `packages/database/prisma/schema.prisma`**

### New Enums

```prisma
enum ProductType {
  DIGITAL
  PHYSICAL
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  REFUNDED
  CANCELLED
}
```

### New Models

```prisma
model Product {
  id                  String        @id @default(cuid())
  trainerId           String
  type                ProductType
  status              ProductStatus @default(DRAFT)
  name                String
  slug                String
  description         String?       @db.Text
  shortDescription    String?
  pricePence          Int           // Price in pence
  currency            String        @default("gbp")
  compareAtPricePence Int?          // Original price for "was £X" display
  imageUrl            String?
  galleryUrls         String[]      // Additional product images
  // Digital product fields
  digitalFileUrl      String?       // Cloudinary/R2 URL for downloadable file
  digitalFileName     String?       // Original filename for display
  // Physical product fields
  stockCount          Int?          // null = unlimited (digital), 0+ = tracked (physical)
  // SEO
  seoTitle            String?
  seoDescription      String?
  // Metadata
  sortOrder           Int           @default(0)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  trainer             TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  orderItems          OrderItem[]

  @@unique([trainerId, slug])
  @@index([trainerId, status])
  @@map("products")
}

model Coupon {
  id                    String    @id @default(cuid())
  trainerId             String
  code                  String    // e.g. "SUMMER20"
  stripeCouponId        String    // Stripe coupon ID on trainer's connected account
  stripePromotionCodeId String?   // Stripe promotion code ID
  description           String?   // Internal note for trainer
  percentOff            Float?    // e.g. 20.0 for 20% off
  amountOffPence        Int?      // Fixed discount in pence
  minOrderPence         Int?      // Minimum order for coupon to apply
  maxRedemptions        Int?      // null = unlimited
  currentRedemptions    Int       @default(0)
  isActive              Boolean   @default(true)
  expiresAt             DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  trainer               TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  orders                ProductOrder[]

  @@unique([trainerId, code])
  @@index([trainerId, isActive])
  @@map("coupons")
}

model ProductOrder {
  id                    String      @id @default(cuid())
  buyerUserId           String
  trainerId             String
  stripePaymentIntentId String?     @unique
  stripeChargeId        String?
  status                OrderStatus @default(PENDING_PAYMENT)
  subtotalPence         Int         // Before discount
  discountPence         Int         @default(0)
  totalPence            Int         // After discount
  platformFeePence      Int         // 3% of totalPence
  currency              String      @default("gbp")
  couponId              String?
  couponCode            String?     // Snapshot of code used
  // Shipping (physical only)
  shippingName          String?
  shippingAddress       String?     @db.Text
  // Refund
  refundAmount          Int?
  refundReason          String?
  refundedAt            DateTime?
  // Timestamps
  paidAt                DateTime?
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  buyer                 User           @relation(fields: [buyerUserId], references: [id])
  trainer               TrainerProfile @relation(fields: [trainerId], references: [id])
  coupon                Coupon?        @relation(fields: [couponId], references: [id], onDelete: SetNull)
  items                 OrderItem[]

  @@index([buyerUserId])
  @@index([trainerId])
  @@map("product_orders")
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  productId   String
  productName String  // Snapshot at time of purchase
  pricePence  Int     // Snapshot at time of purchase
  quantity    Int     @default(1)

  order       ProductOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product      @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@map("order_items")
}
```

### Relations to add

On `TrainerProfile`:
```prisma
  products        Product[]
  coupons         Coupon[]
  productOrders   ProductOrder[]
```

On `User`:
```prisma
  productOrders   ProductOrder[]
```

---

## Implementation Chunks

### Chunk 1: Schema, Repository, Feature Flag

**Schema**: Add all new enums and models. Run `db:generate` + migrate.

**New files:**
- `apps/api/src/repositories/product.repository.ts` — CRUD: `findByTrainerId`, `findBySlug`, `findById`, `create`, `update`, `delete`, `updateStock`, `findPublicByTrainerId`
- `apps/api/src/repositories/coupon.repository.ts` — CRUD: `findByTrainerId`, `findByCode(trainerId, code)`, `findById`, `create`, `update`, `delete`, `incrementRedemptions`
- `apps/api/src/repositories/product-order.repository.ts` — `create`, `findById`, `findByBuyer(userId, cursor, limit)`, `findByTrainer(trainerId, cursor, limit)`, `updateStatus`, `findByPaymentIntentId`
- `packages/schemas/src/forms/product.schema.ts` — Zod schemas for create/update product, create/update coupon, create order, validate coupon

**Modified files:**
- `packages/database/prisma/schema.prisma` — All new models + relations
- `packages/schemas/src/constants/subscription.constants.ts` — Add `"productStorefront"` to Feature type and FEATURE_TIER_MAP as ELITE
- `packages/schemas/src/index.ts` — Export product schemas

### Chunk 2: Product Service + Router

**New files:**
- `apps/api/src/services/product.service.ts`:
  - `getProducts(trainerId)` — all products for management UI
  - `getProduct(trainerId, productId)` — single product
  - `createProduct(trainerId, data)` — create with auto-generated slug
  - `updateProduct(trainerId, productId, data)` — update fields
  - `deleteProduct(trainerId, productId)` — soft delete → ARCHIVED, or hard delete if no orders
  - `publishProduct(trainerId, productId)` — DRAFT → ACTIVE
  - `archiveProduct(trainerId, productId)` — ACTIVE → ARCHIVED
  - `getPublicProducts(trainerId)` — ACTIVE products for public browsing
  - `getPublicProduct(trainerId, slug)` — single product by slug for product detail page
- `apps/api/src/routers/product.router.ts` — Protected CRUD (ELITE-gated via `requireTier('ELITE')`), public browse endpoints

**Modified files:**
- `apps/api/src/routers/_app.ts` — Register `product` router
- `apps/api/src/routers/upload.router.ts` — Add `'product-image'` and `'product-file'` upload types
- `apps/api/src/lib/cloudinary.ts` — Add product upload configs (images + raw file upload for PDFs/documents via `resource_type: 'raw'`)

### Chunk 3: Coupon Service + Router (Stripe-backed)

Coupons are created in our DB and mirrored to Stripe on the trainer's connected account. This gives us a local record for display while Stripe handles validation and redemption at payment time.

**New files:**
- `apps/api/src/services/coupon.service.ts`:
  - `getCoupons(trainerId)` — list trainer's coupons with redemption counts
  - `createCoupon(trainerId, data)`:
    1. Create Stripe coupon on trainer's connected account (`stripe.coupons.create({...}, { stripeAccount })`)
    2. Create Stripe promotion code (`stripe.promotionCodes.create({coupon, code, ...}, { stripeAccount })`)
    3. Store in our DB with Stripe IDs
  - `updateCoupon(trainerId, couponId, data)` — update local fields + deactivate/reactivate Stripe promotion code
  - `deleteCoupon(trainerId, couponId)` — deactivate Stripe promotion code, soft-delete locally (set `isActive: false`)
  - `validateCoupon(trainerId, code)` — check our DB for quick validation (active, not expired, redemption limits), return discount preview
- `apps/api/src/routers/coupon.router.ts` — Protected CRUD (ELITE-gated), public `validate` endpoint for checkout preview

**Modified files:**
- `apps/api/src/routers/_app.ts` — Register `coupon` router

### Chunk 4: Order & Payment Service

**New files:**
- `apps/api/src/services/product-payment.service.ts`:
  - `createOrder(buyerUserId, trainerId, items, couponCode?)`:
    1. Validate products are ACTIVE and in stock
    2. Calculate subtotal from current product prices
    3. If couponCode, look up the Stripe promotion code ID
    4. Calculate platform fee: `Math.round(totalPence * 0.03)` (3%)
    5. Create Stripe PaymentIntent on trainer's connected account:
       ```typescript
       stripe.paymentIntents.create({
         amount: totalPence,
         currency: 'gbp',
         application_fee_amount: platformFeePence,
         transfer_data: { destination: trainer.stripeConnectedAccountId },
         metadata: { type: 'product_order', orderId, trainerId, buyerUserId },
         // Apply Stripe promotion code if provided
         ...(stripePromotionCodeId ? { promotion_code: stripePromotionCodeId } : {}),
       })
       ```
    6. Create ProductOrder + OrderItems in DB
    7. Return client secret for Stripe Elements
  - `confirmOrder(paymentIntentId)` — webhook handler:
    1. Mark order PAID
    2. Decrement stock for physical products
    3. Increment coupon redemption count
    4. Send confirmation notification + email
    5. For digital products, mark as DELIVERED immediately
  - `refundOrder(orderId, trainerId, reason?)` — create Stripe refund, update order status
  - `getDownloadUrl(orderId, itemId, userId)` — verify buyer owns order, generate time-limited signed Cloudinary URL for digital file

**Modified files:**
- `apps/api/src/routes/webhooks.ts` — Handle `payment_intent.succeeded` for product orders (check `metadata.type === 'product_order'`)
- `apps/api/src/services/notification.service.ts` — Add `NEW_ORDER` and `ORDER_CONFIRMED` notification types

### Chunk 5: Trainer Product Management UI

**New files:**
- `apps/web/src/pages/dashboard/storefront/index.tsx` — Main storefront management page with tabs: Products, Coupons, Orders
- `apps/web/src/pages/dashboard/storefront/components/ProductList/index.tsx` — Grid of trainer's products with status badges (Draft/Active/Archived), edit/delete/publish actions
- `apps/web/src/pages/dashboard/storefront/components/ProductForm/index.tsx` — Create/edit product form: type toggle (digital/physical), name, description (rich text), pricing (price + compare-at price), image upload + gallery, file upload (digital), stock count (physical), SEO fields
- `apps/web/src/pages/dashboard/storefront/components/CouponList/index.tsx` — Table: code, discount display, redemptions/limit, expiry, active toggle, delete
- `apps/web/src/pages/dashboard/storefront/components/CouponForm/index.tsx` — Create/edit coupon: code, discount type (% or fixed), value, min order, max redemptions, expiry date
- `apps/web/src/pages/dashboard/storefront/components/OrderList/index.tsx` — Table: order #, buyer name, items, total, status, date, actions (view, refund, update status)
- `apps/web/src/pages/dashboard/storefront/components/OrderDetail/index.tsx` — Dialog: line items, payment info, shipping (physical), download link (digital), refund button, status update (physical: processing → shipped → delivered)
- `apps/web/src/pages/dashboard/storefront/storefront.constants.ts` — Status labels, badge colours, product type labels
- `apps/web/src/pages/dashboard/storefront/storefront.types.ts` — TypeScript types
- `apps/web/src/api/product/useProduct.ts` — `useProducts()`, `useCreateProduct()`, `useUpdateProduct()`, `useDeleteProduct()`, `usePublishProduct()`, `useArchiveProduct()`
- `apps/web/src/api/product/index.ts` — Barrel export
- `apps/web/src/api/coupon/useCoupon.ts` — `useCoupons()`, `useCreateCoupon()`, `useUpdateCoupon()`, `useDeleteCoupon()`
- `apps/web/src/api/coupon/index.ts` — Barrel export
- `apps/web/src/api/order/useOrder.ts` — `useTrainerOrders()`, `useBuyerOrders()`, `useRefundOrder()`, `useUpdateOrderStatus()`
- `apps/web/src/api/order/index.ts` — Barrel export

**Modified files:**
- `apps/web/src/components/layouts/DashboardLayout/hooks/useNavItems.tsx` — Add "Storefront" nav item with `requiredFeature: 'productStorefront'`
- `apps/web/src/App.tsx` — Add `/dashboard/storefront` route
- `apps/web/src/config/routes.ts` — Add `dashboardStorefront` route

### Chunk 6: Public Store — Trainer Profile + Website

**New files:**
- `apps/web/src/pages/trainer/public/components/ProfileStore/index.tsx` — Up to 6 product cards on trainer profile, "View all" links to website shop
- `apps/web/src/pages/site/components/sections/ShopSection.tsx` — Website builder shop section: product grid (up to 6), "Browse all" button → `/shop`
- `apps/web/src/pages/site/components/shop/ShopPage.tsx` — Full shop at `/shop`: product grid, search by name, price sort
- `apps/web/src/pages/site/components/shop/ProductDetailPage.tsx` — `/shop/:slug`: image gallery, rich description, price (with compare-at), buy now button → checkout
- `apps/web/src/pages/site/components/shop/index.ts` — Barrel export

**Modified files:**
- `apps/web/src/pages/site/index.tsx` — Add `shop` and `shop-product` to SiteView, add `/shop` and `/shop/:slug` path parsing, add navigation handlers, query for product count (like blog posts for nav)
- `apps/web/src/pages/site/components/SiteLayout/SiteHeader.tsx` — Add "Shop" nav item when products exist (same pattern as blog)
- `apps/web/src/pages/site/components/SiteLayout/index.tsx` — Pass `hasProducts` and shop navigation props
- `apps/web/src/pages/site/components/sections/SectionRenderer.tsx` — Add `SHOP` case
- `apps/web/src/pages/trainer/public/index.tsx` — Add ProfileStore component (only when trainer has published website + active products)
- `apps/web/src/pages/trainer/public/components/index.ts` — Export ProfileStore
- `apps/api/src/repositories/trainer.repository.ts` — Include product count in public profile query

### Chunk 7: Checkout Flow

**New files:**
- `apps/web/src/pages/site/components/shop/CheckoutDialog.tsx` — Modal dialog:
  1. Product summary (image, name, price)
  2. Quantity selector
  3. Coupon code input with live validation
  4. Price breakdown (subtotal, discount, total)
  5. Shipping address form (physical products only)
  6. Stripe Elements payment form (CardElement)
  7. Pay button with loading state
  8. Error handling
- `apps/web/src/pages/site/components/shop/OrderConfirmation.tsx` — Success screen: order number, download button (digital) or "your order is being processed" (physical)
- `apps/web/src/pages/site/components/shop/CouponInput.tsx` — Code input + "Apply" button, shows discount preview or error message

**Modified files:**
- Stripe Elements already available via `@stripe/react-stripe-js` (used for session payments)

### Chunk 8: Buyer Order History

**New files:**
- `apps/web/src/pages/dashboard/purchases/index.tsx` — Purchase history page
- `apps/web/src/pages/dashboard/purchases/components/PurchaseList/index.tsx` — Order cards: product image, name, trainer, date, status, price, download button (digital)
- `apps/web/src/pages/dashboard/purchases/components/PurchaseDetail/index.tsx` — Full order detail with re-download option for digital products

**Modified files:**
- `apps/web/src/components/layouts/DashboardLayout/hooks/useNavItems.tsx` — Add "Purchases" nav item for all users (only visible when they have orders)
- `apps/web/src/App.tsx` — Add `/dashboard/purchases` route
- `apps/web/src/config/routes.ts` — Add `dashboardPurchases` route

### Chunk 9: Notifications & Emails

**Modified files:**
- `apps/api/src/services/notification.service.ts` — Add notification types: `NEW_ORDER`, `ORDER_CONFIRMED`, `ORDER_SHIPPED`, `ORDER_REFUNDED`
- `apps/api/src/lib/email-templates/` — New templates:
  - Order confirmation (buyer): items, total, download links (digital)
  - New order received (trainer): buyer info, items, revenue
  - Order shipped (buyer): tracking info if provided
  - Refund processed (buyer): amount refunded
- `apps/api/src/services/sse.service.ts` — Broadcast `NEW_ORDER` event to trainer dashboard for real-time order alerts

### Chunk 10: Revenue Analytics Extension

**Modified files:**
- `apps/web/src/pages/dashboard/analytics/` — Add product revenue alongside session revenue in existing revenue tab: product sales count, product revenue total, top-selling products chart
- `apps/api/src/services/analytics.service.ts` — Include product order revenue in analytics queries
- `apps/api/src/repositories/product-order.repository.ts` — Add `getRevenueStats(trainerId, dateRange)`, `getTopProducts(trainerId, limit)`

---

## Platform Fee Summary

| Transaction Type | Platform Fee | Example (£20 product) |
|-----------------|-------------|----------------------|
| Session payment | £0.50 flat | Trainer receives £19.50 minus Stripe fees |
| Product sale | 3% | £0.60 to us + ~£0.50 to Stripe = trainer receives ~£18.90 |

---

## Stripe Integration Details

### Product Payments (destination charges)
```typescript
// Same pattern as session payments but with % fee
stripe.paymentIntents.create({
  amount: totalPence,
  currency: 'gbp',
  application_fee_amount: Math.round(totalPence * 0.03), // 3%
  transfer_data: { destination: trainer.stripeConnectedAccountId },
  metadata: { type: 'product_order', orderId },
});
```

### Coupon Creation (on trainer's connected account)
```typescript
// 1. Create coupon
const coupon = await stripe.coupons.create({
  percent_off: 20, // or amount_off: 500 for £5
  currency: 'gbp',
  max_redemptions: 100,
  redeem_by: Math.floor(expiresAt.getTime() / 1000),
}, { stripeAccount: trainer.stripeConnectedAccountId });

// 2. Create promotion code (the human-readable code)
const promoCode = await stripe.promotionCodes.create({
  coupon: coupon.id,
  code: 'SUMMER20',
  max_redemptions: 100,
}, { stripeAccount: trainer.stripeConnectedAccountId });
```

### Coupon Application at Checkout
```typescript
// When buyer enters coupon code, we validate locally first (quick check),
// then pass the promotion code to Stripe which handles the actual discount
stripe.paymentIntents.create({
  amount: totalPence,
  currency: 'gbp',
  application_fee_amount: platformFeePence, // 3% of discounted total
  transfer_data: { destination: trainer.stripeConnectedAccountId },
  // Stripe applies the discount automatically
  discounts: [{ promotion_code: stripePromotionCodeId }],
  metadata: { type: 'product_order', orderId, couponCode },
});
```

Note: `discounts` on PaymentIntent requires Stripe API version 2023-08-16+. If using an older version, apply discount manually by reducing the `amount` and tracking the discount in our DB.

---

## Environment Variables

No new env vars needed — reuses existing Stripe keys and Cloudinary config.

---

## Implementation Order

1. Chunk 1: Schema + repositories + feature flag
2. Chunk 2: Product service + router
3. Chunk 3: Coupon service + router (Stripe-backed)
4. Chunk 4: Order & payment service
5. Chunk 5: Trainer product management UI
6. Chunk 6: Public store (profile + website)
7. Chunk 7: Checkout flow
8. Chunk 8: Buyer order history
9. Chunk 9: Notifications & emails
10. Chunk 10: Revenue analytics

## Verification

1. Create a digital product → appears in storefront management with DRAFT status
2. Publish product → visible on trainer's website shop and profile
3. Create coupon "SUMMER20" for 20% off → created in Stripe + stored locally, shows in coupon list
4. Buyer views shop → sees products with prices and images
5. Buyer enters coupon at checkout → Stripe validates, discount shown, total updated
6. Buyer completes payment → order created, 3% platform fee taken, trainer notified via SSE, stock decremented
7. Digital product → buyer sees download link immediately after payment
8. Physical product → trainer sees new order, can update status to shipped/delivered
9. Trainer refunds order → buyer notified, payment refunded via Stripe
10. Coupon with max 10 redemptions → 11th attempt rejected by Stripe
11. Expired coupon → Stripe rejects, we show "expired" error
12. Trainer analytics → product revenue appears alongside session revenue
13. Typecheck passes, all existing tests still pass
