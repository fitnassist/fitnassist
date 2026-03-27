import { z } from 'zod';

export const BookingStatusSchema = z.enum(['PENDING','CONFIRMED','DECLINED','RESCHEDULED','CANCELLED_BY_TRAINER','CANCELLED_BY_CLIENT','COMPLETED','NO_SHOW']);

export type BookingStatusType = `${z.infer<typeof BookingStatusSchema>}`

export default BookingStatusSchema;
