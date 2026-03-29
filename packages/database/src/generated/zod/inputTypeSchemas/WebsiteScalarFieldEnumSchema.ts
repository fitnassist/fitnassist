import { z } from 'zod';

export const WebsiteScalarFieldEnumSchema = z.enum(['id','trainerId','subdomain','status','themeId','customColors','customFonts','logoUrl','faviconUrl','seoTitle','seoDescription','ogImageUrl','googleAnalyticsId','createdAt','updatedAt']);

export default WebsiteScalarFieldEnumSchema;
