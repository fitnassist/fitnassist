import { z } from 'zod';


export const WeightEntryScalarFieldEnumSchema = z.enum(['id','diaryEntryId','weightKg']);

export default WeightEntryScalarFieldEnumSchema;
