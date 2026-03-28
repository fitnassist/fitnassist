import { z } from 'zod';

export const BookingScalarFieldEnumSchema = z.enum(['id','trainerId','clientRosterId','locationId','date','startTime','endTime','durationMin','clientAddress','clientPostcode','clientLatitude','clientLongitude','sessionType','dailyRoomUrl','dailyRoomName','status','initiatedBy','cancellationReason','cancelledAt','declineReason','declinedAt','holdExpiresAt','rescheduledFromId','reminderSentAt','notes','isFreeSession','createdAt','updatedAt']);

export default BookingScalarFieldEnumSchema;
