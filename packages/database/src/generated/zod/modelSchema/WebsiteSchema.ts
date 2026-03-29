import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { WebsiteStatusSchema } from '../inputTypeSchemas/WebsiteStatusSchema'

/////////////////////////////////////////
// WEBSITE SCHEMA
/////////////////////////////////////////

export const WebsiteSchema = z.object({
  status: WebsiteStatusSchema,
  id: z.string().cuid(),
  trainerId: z.string(),
  subdomain: z.string().min(3, { message: "Subdomain must be at least 3 characters" }).max(30, { message: "Subdomain must be at most 30 characters" }).regex(/^[a-z0-9-]+$/, { message: "Subdomain can only contain lowercase letters, numbers, and hyphens" }),
  themeId: z.string(),
  customColors: JsonValueSchema.nullable(),
  customFonts: JsonValueSchema.nullable(),
  logoUrl: z.string().url({ message: "Must be a valid URL" }).nullable(),
  faviconUrl: z.string().url({ message: "Must be a valid URL" }).nullable(),
  seoTitle: z.string().max(60, { message: "SEO title must be at most 60 characters" }).nullable(),
  seoDescription: z.string().max(160, { message: "SEO description must be at most 160 characters" }).nullable(),
  ogImageUrl: z.string().url({ message: "Must be a valid URL" }).nullable(),
  googleAnalyticsId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Website = z.infer<typeof WebsiteSchema>

/////////////////////////////////////////
// WEBSITE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const WebsiteOptionalDefaultsSchema = WebsiteSchema.merge(z.object({
  status: WebsiteStatusSchema.optional(),
  id: z.string().cuid().optional(),
  themeId: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type WebsiteOptionalDefaults = z.infer<typeof WebsiteOptionalDefaultsSchema>

export default WebsiteSchema;
