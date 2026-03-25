import { z } from 'zod';

export const ProfileViewScalarFieldEnumSchema = z.enum(['id','trainerId','viewerId','viewedAt']);

export default ProfileViewScalarFieldEnumSchema;
