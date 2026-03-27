import { z } from 'zod';

export const BookingSuggestionStatusSchema = z.enum(['PENDING','ACCEPTED','DECLINED']);

export type BookingSuggestionStatusType = `${z.infer<typeof BookingSuggestionStatusSchema>}`

export default BookingSuggestionStatusSchema;
