import { z } from 'zod';

export const PostScalarFieldEnumSchema = z.enum(['id','userId','content','imageUrl','type','visibility','createdAt','updatedAt']);

export default PostScalarFieldEnumSchema;
