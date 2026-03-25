

export const BookingStatusSchema = z.enum(['CONFIRMED','CANCELLED_BY_TRAINER','CANCELLED_BY_CLIENT','COMPLETED','NO_SHOW']);

export type BookingStatusType = `${z.infer<typeof BookingStatusSchema>}`

export default BookingStatusSchema;
