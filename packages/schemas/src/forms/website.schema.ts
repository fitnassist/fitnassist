import { z } from 'zod';

// Website settings
export const updateWebsiteSettingsSchema = z.object({
  themeId: z.string().optional(),
  customColors: z.record(z.string()).nullable().optional(),
  customFonts: z.record(z.string()).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
  seoTitle: z.string().max(60).nullable().optional(),
  seoDescription: z.string().max(160).nullable().optional(),
  ogImageUrl: z.string().url().nullable().optional(),
  googleAnalyticsId: z.string().nullable().optional(),
});
export type UpdateWebsiteSettingsInput = z.infer<typeof updateWebsiteSettingsSchema>;

export const updateSubdomainSchema = z.object({
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(30, 'Subdomain must be at most 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
});
export type UpdateSubdomainInput = z.infer<typeof updateSubdomainSchema>;

// Sections
export const addSectionSchema = z.object({
  type: z.enum([
    'HERO', 'ABOUT', 'SERVICES', 'GALLERY', 'TESTIMONIALS', 'BLOG',
    'CONTACT', 'CUSTOM_TEXT', 'VIDEO', 'PRICING', 'FAQ', 'CTA', 'SOCIAL_LINKS',
  ]),
  title: z.string().max(100).nullable().optional(),
  subtitle: z.string().max(500).nullable().optional(),
  content: z.any().optional(),
  settings: z.any().optional(),
});
export type AddSectionInput = z.infer<typeof addSectionSchema>;

export const updateSectionSchema = z.object({
  sectionId: z.string(),
  title: z.string().max(100).nullable().optional(),
  subtitle: z.string().max(500).nullable().optional(),
  content: z.any().optional(),
  settings: z.any().optional(),
});
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

export const reorderSectionsSchema = z.object({
  sectionIds: z.array(z.string()),
});
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;

export const toggleSectionVisibilitySchema = z.object({
  sectionId: z.string(),
});
export type ToggleSectionVisibilityInput = z.infer<typeof toggleSectionVisibilitySchema>;

export const removeSectionSchema = z.object({
  sectionId: z.string(),
});
export type RemoveSectionInput = z.infer<typeof removeSectionSchema>;

// Blog posts
export const createBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  excerpt: z.string().max(300).nullable().optional(),
  content: z.string().min(1, 'Content is required'),
  coverImageUrl: z.string().url().nullable().optional(),
  seoTitle: z.string().max(60).nullable().optional(),
  seoDescription: z.string().max(160).nullable().optional(),
  tags: z.array(z.string()).optional(),
});
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;

export const updateBlogPostSchema = z.object({
  postId: z.string(),
  title: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  excerpt: z.string().max(300).nullable().optional(),
  content: z.string().min(1).optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  seoTitle: z.string().max(60).nullable().optional(),
  seoDescription: z.string().max(160).nullable().optional(),
  tags: z.array(z.string()).optional(),
});
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

export const blogPostIdSchema = z.object({
  postId: z.string(),
});
export type BlogPostIdInput = z.infer<typeof blogPostIdSchema>;

// Public queries
export const getWebsiteBySubdomainSchema = z.object({
  subdomain: z.string(),
});
export type GetWebsiteBySubdomainInput = z.infer<typeof getWebsiteBySubdomainSchema>;

export const getPublicBlogPostsSchema = z.object({
  subdomain: z.string(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});
export type GetPublicBlogPostsInput = z.infer<typeof getPublicBlogPostsSchema>;

export const getPublicBlogPostSchema = z.object({
  subdomain: z.string(),
  slug: z.string(),
});
export type GetPublicBlogPostInput = z.infer<typeof getPublicBlogPostSchema>;
