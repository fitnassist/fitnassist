import { z } from 'zod';

export const MoodEntryScalarFieldEnumSchema = z.enum(['id','diaryEntryId','level','notes']);

export default MoodEntryScalarFieldEnumSchema;
