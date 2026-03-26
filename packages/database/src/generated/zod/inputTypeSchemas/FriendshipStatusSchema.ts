import { z } from 'zod';

export const FriendshipStatusSchema = z.enum(['PENDING','ACCEPTED','DECLINED','BLOCKED']);

export type FriendshipStatusType = `${z.infer<typeof FriendshipStatusSchema>}`

export default FriendshipStatusSchema;
