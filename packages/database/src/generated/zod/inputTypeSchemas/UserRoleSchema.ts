import { z } from 'zod';

export const UserRoleSchema = z.enum(['TRAINEE','TRAINER','GYM','ADMIN']);

export type UserRoleType = `${z.infer<typeof UserRoleSchema>}`

export default UserRoleSchema;
