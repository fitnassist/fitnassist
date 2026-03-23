import { z } from 'zod';

/////////////////////////////////////////
// GALLERY IMAGE SCHEMA
/////////////////////////////////////////

export const GalleryImageSchema = z.object({
  id: z.string().cuid(),
  trainerId: z.string(),
  url: z.string().url({ message: "Must be a valid URL" }),
  sortOrder: z.number().int(),
  createdAt: z.coerce.date(),
})

export type GalleryImage = z.infer<typeof GalleryImageSchema>

/////////////////////////////////////////
// GALLERY IMAGE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const GalleryImageOptionalDefaultsSchema = GalleryImageSchema.merge(z.object({
  id: z.string().cuid().optional(),
  sortOrder: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type GalleryImageOptionalDefaults = z.infer<typeof GalleryImageOptionalDefaultsSchema>

export default GalleryImageSchema;
