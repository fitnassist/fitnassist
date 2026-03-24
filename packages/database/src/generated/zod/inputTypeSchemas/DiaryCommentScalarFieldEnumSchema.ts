import { z } from 'zod';


export const DiaryCommentScalarFieldEnumSchema = z.enum(['id','diaryEntryId','userId','content','createdAt']);

export default DiaryCommentScalarFieldEnumSchema;
