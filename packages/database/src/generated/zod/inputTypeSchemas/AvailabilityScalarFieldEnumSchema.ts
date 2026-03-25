import { z } from 'zod';

export const AvailabilityScalarFieldEnumSchema = z.enum(['id','trainerId','dayOfWeek','startTime','endTime','sessionDurationMin','createdAt','updatedAt']);

export default AvailabilityScalarFieldEnumSchema;
