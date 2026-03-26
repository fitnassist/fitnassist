import { z } from 'zod';

export const DiaryEntryLikeScalarFieldEnumSchema = z.enum(['id','diaryEntryId','userId','createdAt']);

export default DiaryEntryLikeScalarFieldEnumSchema;
