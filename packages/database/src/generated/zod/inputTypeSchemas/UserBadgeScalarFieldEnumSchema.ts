import { z } from 'zod';

export const UserBadgeScalarFieldEnumSchema = z.enum(['id','userId','badgeId','earnedAt']);

export default UserBadgeScalarFieldEnumSchema;
