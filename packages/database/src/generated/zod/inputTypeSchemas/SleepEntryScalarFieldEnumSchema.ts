import { z } from 'zod';

export const SleepEntryScalarFieldEnumSchema = z.enum(['id','diaryEntryId','hoursSlept','quality','source']);

export default SleepEntryScalarFieldEnumSchema;
