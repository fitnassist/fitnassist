import { z } from "zod";

// =============================================================================
// SUBSCRIPTION FORM SCHEMAS
// =============================================================================

export const createCheckoutSessionSchema = z.object({
  tier: z.enum(["PRO", "ELITE"]),
  billingPeriod: z.enum(["MONTHLY", "ANNUAL"]),
});

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>;

export const createPortalSessionSchema = z.object({
  returnUrl: z.string().optional(),
});

export type CreatePortalSessionInput = z.infer<
  typeof createPortalSessionSchema
>;
