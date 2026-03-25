import { z } from 'zod';


export const BookingScalarFieldEnumSchema = z.enum(['id','trainerId','clientRosterId','locationId','date','startTime','endTime','durationMin','clientAddress','clientPostcode','clientLatitude','clientLongitude','status','cancellationReason','cancelledAt','reminderSentAt','notes','createdAt','updatedAt']);

export default BookingScalarFieldEnumSchema;
