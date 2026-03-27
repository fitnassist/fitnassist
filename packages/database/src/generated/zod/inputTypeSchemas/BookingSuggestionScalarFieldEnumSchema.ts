import { z } from 'zod';

export const BookingSuggestionScalarFieldEnumSchema = z.enum(['id','bookingId','suggestedBy','date','startTime','endTime','status','createdAt']);

export default BookingSuggestionScalarFieldEnumSchema;
