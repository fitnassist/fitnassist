

/////////////////////////////////////////
// PROGRESS PHOTO SCHEMA
/////////////////////////////////////////

export const ProgressPhotoSchema = z.object({
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  imageUrl: z.string().url(),
  category: z.string().nullable(),
  notes: z.string().max(500).nullable(),
  sortOrder: z.number().int(),
})

export type ProgressPhoto = z.infer<typeof ProgressPhotoSchema>

/////////////////////////////////////////
// PROGRESS PHOTO OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ProgressPhotoOptionalDefaultsSchema = ProgressPhotoSchema.merge(z.object({
  id: z.string().cuid().optional(),
  sortOrder: z.number().int().optional(),
}))

export type ProgressPhotoOptionalDefaults = z.infer<typeof ProgressPhotoOptionalDefaultsSchema>

export default ProgressPhotoSchema;
