# Phase 9.3: PT Website Builder

## Context

PTs need a branded online presence beyond their Fitnassist profile. The website builder lets them create micro-sites at `handle.fitnassist.co` with customisable themes, sections, and blog posts. This lays the foundation for Phase 9.2 (Product Storefront) which will add a "Shop" section using the same theme/branding system.

## What Already Exists

- PT public profiles at `/trainers/:handle` with gallery, video, specialisations, reviews
- Profile gallery with image upload (Cloudflare R2)
- Video introduction upload
- Subscription tiers: FREE, PRO, ELITE with feature gating (`useFeatureAccess` hook, `requireTier` middleware)
- Trainer handles are unique slugs
- CSS variable-based theming in `globals.css` (HSL pattern used by shadcn/ui)
- Existing review/ratings system for testimonials data
- `TrainerProfile` model with all PT data

## Key Design Decisions

1. **Section-based editor** — not a full drag-and-drop page builder. Sections are easier to implement, render consistently across themes, and keep scope manageable. Each section type has a defined content schema.
2. **Theme as CSS variables** — same pattern as existing `globals.css`. Override HSL values per-site so all Tailwind utilities (`bg-primary`, `text-foreground`) work automatically. Directly reusable by the storefront.
3. **JSON content fields** — each section stores its content as JSON, validated by Zod. Avoids complex polymorphic table structures.
4. **Client-side rendering** — public sites render in the same SPA with code splitting. SEO handled by `react-helmet-async` for meta tags. SSR/edge rendering can be added later if needed.
5. **Same SPA, subdomain detection** — subdomain visitors get the site renderer; main domain visitors get the normal app. Avoids code duplication.
6. **TipTap for rich text** — headless, React-native, extensible. Outputs HTML directly.
7. **ELITE tier feature** — website builder gated behind ELITE subscription.

---

## Schema Changes

**File: `packages/database/prisma/schema.prisma`**

New enums:
```prisma
enum WebsiteStatus {
  DRAFT
  PUBLISHED
  MAINTENANCE
}

enum SectionType {
  HERO
  ABOUT
  SERVICES
  GALLERY
  TESTIMONIALS
  BLOG
  CONTACT
  CUSTOM_TEXT
  VIDEO
  PRICING
  FAQ
  CTA
  SOCIAL_LINKS
  SHOP
}

enum BlogPostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

New models:
```prisma
model Website {
  id                String         @id @default(cuid())
  trainerId         String         @unique
  subdomain         String         @unique
  status            WebsiteStatus  @default(DRAFT)
  themeId           String         @default("default")
  customColors      Json?
  customFonts       Json?
  logoUrl           String?
  faviconUrl        String?
  seoTitle          String?
  seoDescription    String?
  ogImageUrl        String?
  googleAnalyticsId String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  trainer           TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  sections          WebsiteSection[]
  blogPosts         BlogPost[]

  @@index([subdomain])
  @@map("websites")
}

model WebsiteSection {
  id          String      @id @default(cuid())
  websiteId   String
  type        SectionType
  title       String?
  subtitle    String?
  content     Json?
  settings    Json?
  sortOrder   Int         @default(0)
  isVisible   Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  website     Website     @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  @@index([websiteId, sortOrder])
  @@map("website_sections")
}

model BlogPost {
  id             String         @id @default(cuid())
  websiteId      String
  title          String
  slug           String
  excerpt        String?
  content        String         @db.Text
  coverImageUrl  String?
  status         BlogPostStatus @default(DRAFT)
  publishedAt    DateTime?
  seoTitle       String?
  seoDescription String?
  tags           String[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  website        Website        @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  @@unique([websiteId, slug])
  @@index([websiteId, status, publishedAt])
  @@map("blog_posts")
}
```

Add relation on `TrainerProfile`:
```prisma
website Website?
```

---

## Theme System

Themes are defined as TypeScript configs (not DB records). Each theme provides:
- **Color palette** — CSS variables mapped to HSL values
- **Font pairings** — heading + body from Google Fonts
- **Layout variant** — section spacing, border radius, hero style

Preset themes:
| Theme | Description |
|-------|-------------|
| `default` | Clean, minimal (matches Fitnassist palette) |
| `bold` | Dark background, bright accents |
| `elegant` | Serif fonts, muted tones |
| `sporty` | High contrast, geometric |
| `natural` | Earth tones, rounded |
| `modern` | Gradient accents, sans-serif |

PTs can override individual colors via `customColors` on the `Website` model. The renderer applies these as inline CSS variables on the root element.

---

## Content Block Types

| Type | Content Schema | Description |
|------|---------------|-------------|
| `HERO` | `{ headline, subheadline, ctaText, ctaLink, backgroundImageUrl, overlayOpacity }` | Full-width hero banner |
| `ABOUT` | `{ richText, imageUrl, imagePosition }` | About me with text + optional image |
| `SERVICES` | `{ items: [{ title, description, icon, price? }] }` | Grid of services offered |
| `GALLERY` | `{ sourceType: 'profile' | 'custom', images: [{ url, caption }] }` | Photo gallery (can pull from profile) |
| `TESTIMONIALS` | `{ sourceType: 'reviews' | 'custom', items: [{ quote, author, rating }] }` | Testimonial carousel (can pull from reviews) |
| `BLOG` | `{ postsToShow, layout: 'grid' | 'list' }` | Latest blog posts |
| `CONTACT` | `{ showForm, showEmail, showPhone, showSocial, showMap, showBookingLink }` | Contact section |
| `CUSTOM_TEXT` | `{ richText }` | Free-form rich text block |
| `VIDEO` | `{ videoUrl, caption }` | Video embed |
| `PRICING` | `{ items: [{ name, price, description, features, ctaText }] }` | Pricing cards |
| `FAQ` | `{ items: [{ question, answer }] }` | Accordion FAQ |
| `CTA` | `{ headline, subheadline, ctaText, ctaLink, style }` | Call-to-action banner |
| `SOCIAL_LINKS` | `{ links: [{ platform, url }] }` | Social media links |
| `SHOP` | `{}` | Reserved for Phase 9.2 storefront |

---

## Subdomain Routing Strategy

### Approach: Vercel Wildcard Domain + Client-Side Detection

1. Add `*.fitnassist.co` as wildcard domain in Vercel dashboard
2. All subdomain requests hit the same SPA (`index.html`)
3. Client-side detection in `main.tsx`:

```typescript
const hostname = window.location.hostname;
const isSubdomain = hostname.endsWith('.fitnassist.co')
  && hostname !== 'fitnassist.co'
  && hostname !== 'www.fitnassist.co';
const siteHandle = isSubdomain ? hostname.split('.')[0] : null;

if (siteHandle) {
  render(<SiteRenderer handle={siteHandle} />);
} else {
  render(<App />);
}
```

4. API CORS updated to accept `*.fitnassist.co`
5. Dev fallback: `localhost:3000?site=buffbill` renders as subdomain

---

## Implementation Chunks

### Chunk 1: Database Schema + Backend Foundation

**Schema**: Add enums, `Website`, `WebsiteSection`, `BlogPost` models. Add `website` relation to `TrainerProfile`. Run `db:generate` + migrate.

**New files:**
- `apps/api/src/repositories/website.repository.ts` — `findByTrainerId`, `findBySubdomain`, `create`, `update`, `subdomainExists`
- `apps/api/src/repositories/website-section.repository.ts` — `findByWebsiteId`, `create`, `update`, `delete`, `reorder`, `toggleVisibility`
- `apps/api/src/repositories/blog-post.repository.ts` — `findByWebsiteId`, `findBySlug`, `create`, `update`, `delete`, `publish`, `unpublish`, `slugExists`
- `apps/api/src/services/website.service.ts` — `getMyWebsite`, `getPublicWebsite`, `updateSettings`, `publish`, `unpublish`, `updateSubdomain`
- `apps/api/src/services/website-section.service.ts` — `addSection`, `updateSection`, `removeSection`, `reorderSections`, `toggleSectionVisibility`
- `apps/api/src/services/blog.service.ts` — `createPost`, `updatePost`, `deletePost`, `publishPost`, `unpublishPost`, `getMyPosts`, `getPublicPosts`, `getPublicPost`
- `apps/api/src/routers/website.router.ts` — tRPC router (mutations ELITE-gated, public procedures for subdomain lookup)
- `apps/api/src/routers/blog.router.ts` — tRPC router (mutations ELITE-gated, public procedures for published posts)
- `packages/schemas/src/forms/website.schema.ts` — Zod schemas for all CRUD operations

**Modified files:**
- `packages/database/prisma/schema.prisma`
- `packages/schemas/src/constants/subscription.constants.ts` — Add `websiteBuilder` feature to ELITE
- `apps/api/src/config/features.ts` — Add `websiteBuilder: 'ELITE'`
- `apps/api/src/routers/_app.ts` — Register website + blog routers
- `packages/schemas/src/index.ts` — Export new schemas

### Chunk 2: Site Builder Dashboard — Core + Theme

**New files:**
- `apps/web/src/pages/dashboard/website/index.tsx` — Main builder page with tabs (Sections, Theme, Blog, Settings)
- `apps/web/src/pages/dashboard/website/website.types.ts` — Builder types
- `apps/web/src/pages/dashboard/website/website.constants.ts` — Theme presets, section type configs
- `apps/web/src/api/website/index.ts` — Barrel export
- `apps/web/src/api/website/useWebsite.ts` — `useMyWebsite`, `usePublicWebsite`
- `apps/web/src/api/website/useWebsiteMutations.ts` — `useUpdateWebsite`, `usePublishWebsite`, etc.
- `apps/web/src/api/website/useSections.ts` — Section mutation hooks
- `apps/web/src/api/website/useBlogPosts.ts` — Blog post hooks
- `apps/web/src/pages/dashboard/website/components/SiteSettings/index.tsx` — Subdomain, SEO, publish/unpublish
- `apps/web/src/pages/dashboard/website/components/ThemePicker/index.tsx` — Theme selection grid
- `apps/web/src/pages/dashboard/website/components/ThemePicker/ThemePreviewCard.tsx`
- `apps/web/src/pages/dashboard/website/components/ThemePicker/ColorCustomizer.tsx`
- `apps/web/src/pages/dashboard/website/components/ThemePicker/FontPicker.tsx`

**Modified files:**
- `apps/web/src/config/routes.ts` — Add website builder routes
- `apps/web/src/App.tsx` — Add website builder route
- `apps/web/src/components/layouts/DashboardLayout/hooks/useNavItems.tsx` — Add "Website" nav item (ELITE gated)

### Chunk 3: Section Editor

**New deps:** `@dnd-kit/core`, `@dnd-kit/sortable`

**New files:**
- `apps/web/src/pages/dashboard/website/components/SectionEditor/index.tsx` — Section list with drag-and-drop reorder
- `apps/web/src/pages/dashboard/website/components/SectionEditor/SectionCard.tsx` — Expand/collapse, edit, delete, visibility toggle
- `apps/web/src/pages/dashboard/website/components/SectionEditor/SectionForm.tsx` — Dynamic form routing by section type
- `apps/web/src/pages/dashboard/website/components/SectionEditor/AddSectionDialog.tsx` — Section type picker
- `apps/web/src/pages/dashboard/website/components/SectionForms/` — One form per section type (HeroForm, AboutForm, ServicesForm, GalleryForm, TestimonialsForm, BlogForm, ContactForm, CustomTextForm, VideoForm, PricingForm, FaqForm, CtaForm, SocialLinksForm)

### Chunk 4: Blog Manager

**New deps:** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`

**New files:**
- `apps/web/src/pages/dashboard/website/components/BlogManager/index.tsx` — Blog post list + CRUD
- `apps/web/src/pages/dashboard/website/components/BlogManager/BlogPostForm.tsx` — Create/edit with TipTap editor
- `apps/web/src/pages/dashboard/website/components/BlogManager/BlogPostList.tsx` — List with status badges
- `apps/web/src/components/ui/rich-text-editor.tsx` — Reusable TipTap editor component

### Chunk 5: Public Site Renderer

**New deps:** `react-helmet-async`

**New files:**
- `apps/web/src/pages/site/index.tsx` — Site renderer entry point with internal routing
- `apps/web/src/pages/site/site.types.ts`
- `apps/web/src/pages/site/components/SiteLayout/index.tsx` — Nav + footer + theme
- `apps/web/src/pages/site/components/SiteLayout/SiteHeader.tsx`
- `apps/web/src/pages/site/components/SiteLayout/SiteFooter.tsx`
- `apps/web/src/pages/site/components/ThemeProvider/index.tsx` — Applies CSS variables from website config
- `apps/web/src/pages/site/components/sections/` — 13 section renderer components (HeroSection, AboutSection, ServicesSection, GallerySection, TestimonialsSection, BlogSection, ContactSection, CustomTextSection, VideoSection, PricingSection, FaqSection, CtaSection, SocialLinksSection)
- `apps/web/src/pages/site/components/blog/BlogListPage.tsx`
- `apps/web/src/pages/site/components/blog/BlogPostPage.tsx`
- `apps/web/src/pages/site/components/blog/BlogCard.tsx`

**Modified files:**
- `apps/web/src/main.tsx` — Subdomain detection and conditional rendering
- `apps/api/src/app.ts` — Update CORS for wildcard subdomains

### Chunk 6: Preview + Polish

- Build preview panel in site builder (reuses renderer components)
- "View my site" button linking to subdomain
- Empty state / onboarding for first-time setup
- Default sections on first create (Hero, About, Services, Contact)
- Gallery section pulls from existing profile gallery
- Testimonials section pulls from existing reviews

### Chunk 7: Vercel Configuration + Deployment

- Configure wildcard domain `*.fitnassist.co` in Vercel dashboard
- Add `VITE_SITE_DOMAIN` env var in Vercel
- Add `SITE_DOMAIN` env var on Railway
- Test subdomain routing end-to-end
- Verify CORS works correctly

---

## New Dependencies

| Package | Purpose |
|---------|---------|
| `@dnd-kit/core` | Drag and drop for section reordering |
| `@dnd-kit/sortable` | Sortable presets for dnd-kit |
| `@tiptap/react` | Rich text editor (React wrapper) |
| `@tiptap/starter-kit` | Core TipTap extensions bundle |
| `@tiptap/extension-image` | Image support in rich text |
| `@tiptap/extension-link` | Link support in rich text |
| `@tiptap/extension-placeholder` | Placeholder text |
| `react-helmet-async` | Dynamic meta tag management for SEO |

---

## Environment Variables

```
SITE_DOMAIN=fitnassist.co           # Base domain for subdomains
VITE_SITE_DOMAIN=fitnassist.co      # Frontend equivalent
```

---

## Verification

1. ELITE trainer can access Website Builder from dashboard sidebar
2. Create website with subdomain → subdomain is validated unique
3. Select theme → preview updates with new colors/fonts
4. Override individual colors → custom palette applied
5. Add/reorder/remove sections via drag-and-drop
6. Edit Hero section → headline, CTA, background image
7. Edit Gallery section → pulls from existing profile gallery
8. Edit Testimonials → pulls from existing reviews
9. Create blog post with rich text (headings, images, links)
10. Publish blog post → visible on public site at `/blog/slug`
11. Publish website → accessible at `handle.fitnassist.co`
12. Public site renders with correct theme, sections in order
13. Blog list and individual posts render correctly
14. SEO meta tags set correctly (check with social share previews)
15. Non-ELITE trainers see upgrade prompt
16. Unpublish website → subdomain returns appropriate message
17. Typecheck passes, existing tests still pass
