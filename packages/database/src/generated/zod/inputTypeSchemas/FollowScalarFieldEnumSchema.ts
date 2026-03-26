import { z } from 'zod';

export const FollowScalarFieldEnumSchema = z.enum(['id','followerId','followingId','createdAt']);

export default FollowScalarFieldEnumSchema;
