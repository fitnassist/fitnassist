import { z } from 'zod';
import { BookingSuggestionStatusSchema } from '../inputTypeSchemas/BookingSuggestionStatusSchema'

/////////////////////////////////////////
// BOOKING SUGGESTION SCHEMA
/////////////////////////////////////////

export const BookingSuggestionSchema = z.object({
  status: BookingSuggestionStatusSchema,
  id: z.string().cuid(),
  bookingId: z.string(),
  suggestedBy: z.string(),
  date: z.coerce.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  createdAt: z.coerce.date(),
})

export type BookingSuggestion = z.infer<typeof BookingSuggestionSchema>

/////////////////////////////////////////
// BOOKING SUGGESTION OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const BookingSuggestionOptionalDefaultsSchema = BookingSuggestionSchema.merge(z.object({
  status: BookingSuggestionStatusSchema.optional(),
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type BookingSuggestionOptionalDefaults = z.infer<typeof BookingSuggestionOptionalDefaultsSchema>

export default BookingSuggestionSchema;
