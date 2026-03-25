import { z } from 'zod';

export const GalleryImageScalarFieldEnumSchema = z.enum(['id','trainerId','url','sortOrder','createdAt']);

export default GalleryImageScalarFieldEnumSchema;
