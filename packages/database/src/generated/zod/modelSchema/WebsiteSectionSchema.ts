import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { SectionTypeSchema } from '../inputTypeSchemas/SectionTypeSchema'

/////////////////////////////////////////
// WEBSITE SECTION SCHEMA
/////////////////////////////////////////

export const WebsiteSectionSchema = z.object({
  type: SectionTypeSchema,
  id: z.string().cuid(),
  websiteId: z.string(),
  title: z.string().max(100, { message: "Title must be at most 100 characters" }).nullable(),
  subtitle: z.string().max(500, { message: "Subtitle must be at most 500 characters" }).nullable(),
  content: JsonValueSchema.nullable(),
  settings: JsonValueSchema.nullable(),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type WebsiteSection = z.infer<typeof WebsiteSectionSchema>

/////////////////////////////////////////
// WEBSITE SECTION OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const WebsiteSectionOptionalDefaultsSchema = WebsiteSectionSchema.merge(z.object({
  id: z.string().cuid().optional(),
  sortOrder: z.number().int().optional(),
  isVisible: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type WebsiteSectionOptionalDefaults = z.infer<typeof WebsiteSectionOptionalDefaultsSchema>

export default WebsiteSectionSchema;
