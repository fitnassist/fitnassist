import { z } from 'zod';

export const WebsiteSectionScalarFieldEnumSchema = z.enum(['id','websiteId','type','title','subtitle','content','settings','sortOrder','isVisible','createdAt','updatedAt']);

export default WebsiteSectionScalarFieldEnumSchema;
