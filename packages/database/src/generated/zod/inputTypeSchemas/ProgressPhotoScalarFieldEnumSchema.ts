import { z } from 'zod';

export const ProgressPhotoScalarFieldEnumSchema = z.enum(['id','diaryEntryId','imageUrl','category','notes','sortOrder']);

export default ProgressPhotoScalarFieldEnumSchema;
