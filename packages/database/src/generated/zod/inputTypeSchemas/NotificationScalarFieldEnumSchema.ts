import { z } from 'zod';


export const NotificationScalarFieldEnumSchema = z.enum(['id','userId','type','title','body','data','link','isRead','readAt','isDismissed','createdAt']);

export default NotificationScalarFieldEnumSchema;
