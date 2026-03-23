import { z } from 'zod';

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','emailVerified','image','role','lastActiveAt','createdAt','updatedAt','emailNotifyConnectionRequests','emailNotifyMessages','emailNotifyMarketing','smsNotifyConnectionRequests','smsNotifyMessages','pushNotifyConnectionRequests','pushNotifyMessages']);

export default UserScalarFieldEnumSchema;
