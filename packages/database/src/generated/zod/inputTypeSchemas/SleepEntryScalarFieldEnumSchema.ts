import { z } from 'zod';


export const SleepEntryScalarFieldEnumSchema = z.enum(['id','diaryEntryId','hoursSlept','quality']);

export default SleepEntryScalarFieldEnumSchema;
