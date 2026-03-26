import { z } from 'zod';

export const FriendshipScalarFieldEnumSchema = z.enum(['id','requesterId','addresseeId','status','createdAt','updatedAt']);

export default FriendshipScalarFieldEnumSchema;
