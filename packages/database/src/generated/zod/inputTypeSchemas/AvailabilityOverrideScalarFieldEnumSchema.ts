import { z } from 'zod';

export const AvailabilityOverrideScalarFieldEnumSchema = z.enum(['id','trainerId','date','isBlocked','startTime','endTime','reason','createdAt']);

export default AvailabilityOverrideScalarFieldEnumSchema;
