import { z } from 'zod';

export const DiaryEntryScalarFieldEnumSchema = z.enum(['id','userId','type','date','createdAt','updatedAt']);

export default DiaryEntryScalarFieldEnumSchema;
