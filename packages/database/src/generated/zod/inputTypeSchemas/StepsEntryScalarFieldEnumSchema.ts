import { z } from 'zod';

export const StepsEntryScalarFieldEnumSchema = z.enum(['id','diaryEntryId','totalSteps','source']);

export default StepsEntryScalarFieldEnumSchema;
