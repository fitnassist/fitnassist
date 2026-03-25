import { z } from 'zod';


export const StepsEntryScalarFieldEnumSchema = z.enum(['id','diaryEntryId','totalSteps']);

export default StepsEntryScalarFieldEnumSchema;
