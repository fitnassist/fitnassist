import { z } from 'zod';

/////////////////////////////////////////
// SESSION PRICE SCHEMA
/////////////////////////////////////////

export const SessionPriceSchema = z.object({
  id: z.string().cuid(),
  trainerId: z.string(),
  amount: z.number().int().min(100).max(100000),
  currency: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type SessionPrice = z.infer<typeof SessionPriceSchema>

/////////////////////////////////////////
// SESSION PRICE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const SessionPriceOptionalDefaultsSchema = SessionPriceSchema.merge(z.object({
  id: z.string().cuid().optional(),
  currency: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type SessionPriceOptionalDefaults = z.infer<typeof SessionPriceOptionalDefaultsSchema>

export default SessionPriceSchema;
