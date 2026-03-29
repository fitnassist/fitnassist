# Phase 9.2: Product Storefront

## Context

ELITE trainers need a way to sell digital products (workout programs, meal plans, guides, templates) and physical products directly through Fitnassist. This leverages the existing Stripe Connect infrastructure (destination charges, platform fee, connected accounts) already built for session payments. Trainers can also create coupon/discount codes to incentivise purchases.

## What Already Exists

- **Stripe Connect**: Standard connected accounts, destination charges, £0.50 platform fee, refund handling
- **SessionPayment model**: Pattern for payment intents, status tracking, refunds
- **Resource models**: Exercise, Recipe, WorkoutPlan, MealPlan (potential sellable content)
- **Upload infrastructure**: Cloudinary signed uploads (images, videos) — needs PDF/document support
- **Website builder**: `SHOP` section type already in SectionType enum
- **Feature gating**: `ELITE` tier with `hasFeatureAccess()` helper
- **ELITE tier features list**: Already includes "Product storefront" in marketing copy

## Key Design Decisions

1. **Dedicated `Product` model** — not repurposing existing resource models. Products have pricing, descriptions, delivery, stock management. Resources remain free assignables.
2. **Digital + physical products** — digital products deliver via secure download links (time-limited signed URLs). Physical products just track order status.
3. **Coupon codes on Fitnassist, not Stripe** — store coupons in our DB for flexibility (percentage or fixed amount, expiry, usage limits, per-product or store-wide). Apply discount before creating Stripe payment intent.
4. **Platform fee**: Same £0.50 per transaction as session payments.
5. **Product variants** — keep it simple: no variants in v1. One price per product. Can add variants later.
6. **Inventory tracking** — optional stock count for physical products. Digital products are unlimited by default.
7. **Order model** — separate from SessionPayment. `ProductOrder` with line items, discount applied, delivery status.

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

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}
```

### New Models

```prisma
model Product {
  id                String        @id @default(cuid())
  trainerId         String
  type              ProductType
  status            ProductStatus @default(DRAFT)
  name              String
  slug              String
  description       String?       @db.Text
  shortDescription  String?
  pricePence        Int           // Price in pence
  currency          String        @default("gbp")
  compareAtPricePence Int?        // Original price for "was £X" display
  imageUrl          String?
  galleryUrls       String[]      // Additional product images
  // Digital product fields
  digitalFileUrl    String?       // Cloudinary/R2 URL for downloadable file
  digitalFileName   String?       // Original filename for display
  // Physical product fields
  stockCount        Int?          // null = unlimited (digital), 0+ = tracked (physical)
  // SEO
  seoTitle          String?
  seoDescription    String?
  // Metadata
  sortOrder         Int           @default(0)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  trainer           TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  orderItems        OrderItem[]
  couponProducts    CouponProduct[]

  @@unique([trainerId, slug])
  @@index([trainerId, status])
  @@map("products")
}

model Coupon {
  id              String        @id @default(cuid())
  trainerId       String
  code            String        // e.g. "SUMMER20"
  discountType    DiscountType
  discountValue   Int           // Percentage (e.g. 20 for 20%) or fixed amount in pence
  minOrderPence   Int?          // Minimum order value to apply
  maxUsageCount   Int?          // null = unlimited
  currentUsageCount Int         @default(0)
  maxUsagePerUser Int?          // null = unlimited per user
  appliesToAll    Boolean       @default(true) // true = all products, false = specific products
  isActive        Boolean       @default(true)
  expiresAt       DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  trainer         TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  couponProducts  CouponProduct[]
  orderCoupons    ProductOrder[]

  @@unique([trainerId, code])
  @@index([trainerId, isActive])
  @@map("coupons")
}

model CouponProduct {
  couponId  String
  productId String

  coupon    Coupon  @relation(fields: [couponId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@id([couponId, productId])
  @@map("coupon_products")
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
  platformFee           Int         @default(50) // £0.50
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

  buyer                 User        @relation(fields: [buyerUserId], references: [id])
  trainer               TrainerProfile @relation(fields: [trainerId], references: [id])
  coupon                Coupon?     @relation(fields: [couponId], references: [id], onDelete: SetNull)
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
  productOrders   ProductOrder[]   @relation("TrainerOrders")
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
- `apps/api/src/repositories/product.repository.ts` — CRUD: `findByTrainerId`, `findBySlug`, `findById`, `create`, `update`, `delete`, `updateStock`
- `apps/api/src/repositories/coupon.repository.ts` — CRUD: `findByTrainerId`, `findByCode(trainerId, code)`, `create`, `update`, `delete`, `incrementUsage`
- `apps/api/src/repositories/product-order.repository.ts` — `create`, `findById`, `findByBuyer(userId)`, `findByTrainer(trainerId)`, `updateStatus`, `findByPaymentIntentId`
- `packages/schemas/src/forms/product.schema.ts` — Zod schemas for create/update product, create/update coupon, create order, apply coupon

**Modified files:**
- `packages/database/prisma/schema.prisma` — All new models + relations
- `packages/schemas/src/constants/subscription.constants.ts` — Add `"productStorefront"` to Feature type and FEATURE_TIER_MAP as ELITE
- `packages/schemas/src/index.ts` — Export product schemas

### Chunk 2: Product Service + Router

**New files:**
- `apps/api/src/services/product.service.ts` — `getProducts(trainerId)`, `getProduct(trainerId, productId)`, `createProduct()`, `updateProduct()`, `deleteProduct()`, `publishProduct()`, `archiveProduct()`, `getPublicProducts(trainerId)`, `getPublicProduct(trainerId, slug)`
- `apps/api/src/routers/product.router.ts` — Protected CRUD (ELITE-gated), public browse endpoints

**Modified files:**
- `apps/api/src/routers/_app.ts` — Register `product` router
- `apps/api/src/routers/upload.router.ts` — Add `'product-image'` and `'product-file'` upload types
- `apps/api/src/lib/cloudinary.ts` — Add product upload configs (images + raw file upload for PDFs/documents)

### Chunk 3: Coupon Service + Router

**New files:**
- `apps/api/src/services/coupon.service.ts` — `getCoupons(trainerId)`, `createCoupon()`, `updateCoupon()`, `deleteCoupon()`, `validateCoupon(trainerId, code, orderItems)` (checks active, not expired, usage limits, product eligibility, min order), `calculateDiscount(coupon, subtotal)`
- `apps/api/src/routers/coupon.router.ts` — Protected CRUD (ELITE-gated), public `validateCoupon` endpoint for checkout

**Modified files:**
- `apps/api/src/routers/_app.ts` — Register `coupon` router

### Chunk 4: Order & Payment Service

**New files:**
- `apps/api/src/services/product-payment.service.ts` — `createOrder(buyerUserId, trainerId, items, couponCode?)`:
  1. Validate products are active
  2. Validate and apply coupon if provided
  3. Calculate total (subtotal - discount)
  4. Create Stripe PaymentIntent (destination charge to trainer, application_fee)
  5. Create ProductOrder + OrderItems in DB
  6. Return client secret for Stripe Elements
- `confirmOrder(paymentIntentId)` — On webhook: mark PAID, decrement stock, increment coupon usage, send confirmation email, generate download links for digital products
- `refundOrder(orderId, trainerId)` — Full or partial refund
- `getDownloadLink(orderId, userId)` — Generate time-limited signed URL for digital product file

**Modified files:**
- `apps/api/src/routes/webhooks.ts` or webhook handler — Handle `payment_intent.succeeded` for product orders (differentiate from session payments via metadata)
- `apps/api/src/services/notification.service.ts` — Add order confirmation and new order received notifications

### Chunk 5: Trainer Product Management UI

**New files:**
- `apps/web/src/pages/dashboard/storefront/index.tsx` — Main storefront management page with tabs (Products, Coupons, Orders)
- `apps/web/src/pages/dashboard/storefront/components/ProductList/index.tsx` — Grid/list of trainer's products with status badges, edit/delete actions
- `apps/web/src/pages/dashboard/storefront/components/ProductForm/index.tsx` — Create/edit product form (type toggle, pricing, description, image upload, file upload for digital, stock for physical)
- `apps/web/src/pages/dashboard/storefront/components/CouponList/index.tsx` — Coupon table with code, discount, usage/limits, status, actions
- `apps/web/src/pages/dashboard/storefront/components/CouponForm/index.tsx` — Create/edit coupon form (code, type, value, expiry, product selection, usage limits)
- `apps/web/src/pages/dashboard/storefront/components/OrderList/index.tsx` — Order history table with status, buyer, amount, date, actions (refund)
- `apps/web/src/pages/dashboard/storefront/components/OrderDetail/index.tsx` — Order detail dialog/page with line items, payment info, shipping info, refund button
- `apps/web/src/pages/dashboard/storefront/storefront.constants.ts` — Status labels, status colours
- `apps/web/src/pages/dashboard/storefront/storefront.types.ts` — TypeScript types
- `apps/web/src/api/product/useProduct.ts` — tRPC wrapper hooks
- `apps/web/src/api/product/index.ts` — Barrel export
- `apps/web/src/api/coupon/useCoupon.ts` — tRPC wrapper hooks
- `apps/web/src/api/coupon/index.ts` — Barrel export
- `apps/web/src/api/order/useOrder.ts` — tRPC wrapper hooks (trainer + buyer hooks)
- `apps/web/src/api/order/index.ts` — Barrel export

**Modified files:**
- `apps/web/src/components/layouts/DashboardLayout/hooks/useNavItems.tsx` — Add "Storefront" nav item (ELITE-gated)
- `apps/web/src/App.tsx` — Add `/dashboard/storefront` route
- `apps/web/src/config/routes.ts` — Add storefront routes

### Chunk 6: Public Store — Trainer Profile + Website

**New files:**
- `apps/web/src/pages/trainer/public/components/ProfileStore/index.tsx` — Product grid on trainer profile (up to 6 products, "View all" link to website store)
- `apps/web/src/pages/site/components/sections/ShopSection.tsx` — Website builder shop section showing product cards
- `apps/web/src/pages/site/components/shop/ShopPage.tsx` — Full shop page at `/shop` on subdomain site (grid, search, category filter)
- `apps/web/src/pages/site/components/shop/ProductDetailPage.tsx` — Individual product page at `/shop/:slug` with images, description, add to cart/buy now
- `apps/web/src/pages/site/components/shop/index.ts` — Barrel export

**Modified files:**
- `apps/web/src/pages/site/index.tsx` — Add `/shop` and `/shop/:slug` to SiteView routing
- `apps/web/src/pages/site/components/SiteLayout/SiteHeader.tsx` — Add "Shop" nav item when products exist
- `apps/web/src/pages/site/components/SiteLayout/index.tsx` — Pass shop-related props
- `apps/web/src/pages/site/components/sections/SectionRenderer.tsx` — Add SHOP case
- `apps/web/src/pages/trainer/public/index.tsx` — Add ProfileStore component
- `apps/web/src/pages/trainer/public/components/index.ts` — Export ProfileStore
- `apps/api/src/repositories/trainer.repository.ts` — Include products in public profile query

### Chunk 7: Checkout Flow

**New files:**
- `apps/web/src/pages/site/components/shop/CheckoutDialog.tsx` — Modal checkout: product summary, coupon code input, Stripe Elements payment form, shipping address (physical only), order confirmation
- `apps/web/src/pages/site/components/shop/OrderConfirmation.tsx` — Success screen with download links (digital) or "order being processed" (physical)
- `apps/web/src/pages/site/components/shop/CouponInput.tsx` — Coupon code input with validation feedback (valid/invalid/expired/applied discount)

**Modified files:**
- `apps/web/src/pages/site/index.tsx` — Handle checkout state
- Stripe Elements already available via `@stripe/react-stripe-js` (used for session payments)

### Chunk 8: Buyer Order History

**New files:**
- `apps/web/src/pages/dashboard/purchases/index.tsx` — Trainee's purchase history page
- `apps/web/src/pages/dashboard/purchases/components/PurchaseList/index.tsx` — Order list with status, download links for digital products
- `apps/web/src/pages/dashboard/purchases/components/PurchaseDetail/index.tsx` — Order detail with re-download option

**Modified files:**
- `apps/web/src/components/layouts/DashboardLayout/hooks/useNavItems.tsx` — Add "Purchases" nav item for trainees (only show if they have orders)
- `apps/web/src/App.tsx` — Add `/dashboard/purchases` route
- `apps/web/src/config/routes.ts` — Add purchases route

### Chunk 9: Notifications & Emails

**Modified files:**
- `apps/api/src/services/notification.service.ts` — Add notification types: `NEW_ORDER`, `ORDER_CONFIRMED`, `ORDER_SHIPPED`, `ORDER_REFUNDED`
- `apps/api/src/lib/email-templates/` — Add order confirmation email, new order notification email, refund email, digital product delivery email with download link
- `apps/api/src/services/sse.service.ts` — Broadcast order events to trainer dashboard

### Chunk 10: Revenue Analytics Extension

**Modified files:**
- `apps/web/src/pages/dashboard/analytics/` — Add product revenue to existing revenue analytics tab (alongside session revenue)
- `apps/api/src/services/analytics.service.ts` — Include product order revenue in analytics queries
- `apps/api/src/repositories/product-order.repository.ts` — Add `getRevenueStats(trainerId, dateRange)`, `getTopProducts(trainerId)`

---

## Environment Variables

No new env vars needed — reuses existing Stripe keys and Cloudinary config.

---

## Implementation Order

1. Chunk 1: Schema + repositories + feature flag
2. Chunk 2: Product service + router
3. Chunk 3: Coupon service + router
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
3. Create coupon "SUMMER20" for 20% off → shows in coupon list
4. Buyer views shop → sees products with prices and images
5. Buyer enters coupon at checkout → discount applied, total updated
6. Buyer completes payment → order created, trainer notified via SSE, stock decremented
7. Digital product → buyer sees download link immediately after payment
8. Physical product → trainer sees new order, can update status to shipped/delivered
9. Trainer refunds order → buyer notified, payment refunded via Stripe
10. Coupon with usage limit of 10 → 11th attempt rejected
11. Expired coupon → validation returns "expired" error
12. Product-specific coupon → only applies to designated products
13. Trainer analytics → product revenue appears in revenue tab
14. Typecheck passes, all existing tests still pass
