# Profile Gallery & Video Intro Implementation Plan

## Overview

Add multiple profile photos (gallery) and a video introduction to trainer profiles. The infrastructure (Cloudinary, signed uploads, video configs) is already in place — this extends it.

## Current State

- **Schema**: `profileImageUrl` and `coverImageUrl` (single strings)
- **Cloudinary**: Fully configured with image + video support, signed uploads
- **Upload router**: Generic, already supports `profile`, `cover`, `exercise-video` types
- **ImageUpload component**: Single-file only, supports drag-drop, preview, delete
- **ImagesTab**: Profile edit tab with two `ImageUpload` components

## Changes Required

### 1. Database Schema

Add a `GalleryImage` model and a `videoIntroUrl` field to `TrainerProfile`:

```prisma
model TrainerProfile {
  // ... existing fields ...
  videoIntroUrl    String?          // Cloudinary video URL
  galleryImages    GalleryImage[]   // Multiple photos
}

model GalleryImage {
  id        String         @id @default(cuid())
  trainerId String
  trainer   TrainerProfile @relation(fields: [trainerId], references: [id], onDelete: Cascade)
  url       String
  caption   String?
  sortOrder Int            @default(0)
  createdAt DateTime       @default(now())

  @@index([trainerId])
}
```

**Why a separate model vs JSON array**: Proper sorting, individual CRUD, avoids large JSON blobs, easier to extend (captions, alt text).

### 2. Upload Types

Add new Cloudinary upload configs:
- `gallery` — folder: `fitnassist/gallery`, max 10MB, transform to max 1200px wide
- `video-intro` — folder: `fitnassist/intros`, max 50MB, video type

### 3. Backend

**Repository**: `gallery.repository.ts`
- `addImage(trainerId, url, caption?, sortOrder?)`
- `removeImage(id)`
- `reorderImages(trainerId, imageIds[])`
- `getByTrainerId(trainerId)`

**Router**: Add to `trainer.router.ts` or create `gallery.router.ts`
- `gallery.add` — upload a gallery image
- `gallery.remove` — delete a gallery image (+ Cloudinary cleanup)
- `gallery.reorder` — update sort order
- `gallery.list` — get gallery for a trainer

**Trainer service**: Update to handle `videoIntroUrl` saves/deletes

### 4. Frontend

**New component**: `GalleryUpload` in `src/components/ui/`
- Grid of uploaded images with add button
- Drag-to-reorder
- Click to delete individual images
- Max image count (e.g., 6 for free, more for paid tiers later)
- Caption editing (optional)

**New component**: `VideoUpload` in `src/components/ui/`
- Similar to ImageUpload but for video
- Preview with video player
- Max duration/size validation

**Update ImagesTab**: Add gallery and video sections below existing profile/cover uploads

**Update public profile page**: Display gallery and video on trainer's public profile

### 5. File Summary

#### New Files
| File | Purpose |
|------|---------|
| `apps/api/src/repositories/gallery.repository.ts` | Gallery CRUD |
| `apps/api/src/routers/gallery.router.ts` | Gallery tRPC router |
| `apps/web/src/components/ui/gallery-upload.tsx` | Multi-image upload component |
| `apps/web/src/components/ui/video-upload.tsx` | Video upload component |

#### Modified Files
| File | Changes |
|------|---------|
| `packages/database/prisma/schema.prisma` | Add GalleryImage model, videoIntroUrl field |
| `apps/api/src/lib/cloudinary.ts` | Add gallery + video-intro upload configs |
| `apps/api/src/routers/_app.ts` | Register gallery router |
| `apps/api/src/routers/upload.router.ts` | Add gallery + video-intro types |
| `apps/web/src/pages/trainer/profile/edit/components/tabs/ImagesTab.tsx` | Add gallery + video sections |
| `apps/web/src/pages/trainer/public/` | Display gallery + video on public profile |
| `apps/web/src/components/ui/index.ts` | Export new components |
