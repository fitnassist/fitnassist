import { z } from 'zod';

export const WaterEntryScalarFieldEnumSchema = z.enum(['id','diaryEntryId','totalMl','source']);

export default WaterEntryScalarFieldEnumSchema;
