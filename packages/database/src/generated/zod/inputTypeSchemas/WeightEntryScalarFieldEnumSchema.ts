import { z } from 'zod';

export const WeightEntryScalarFieldEnumSchema = z.enum(['id','diaryEntryId','weightKg','source']);

export default WeightEntryScalarFieldEnumSchema;
