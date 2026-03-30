import { z } from 'zod';

export const ReferralScalarFieldEnumSchema = z.enum(['id','referrerId','referredUserId','status','referrerRewardApplied','referredDiscountApplied','activatedAt','expiresAt','createdAt','updatedAt']);

export default ReferralScalarFieldEnumSchema;
