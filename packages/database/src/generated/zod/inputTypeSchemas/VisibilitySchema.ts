import { z } from 'zod';

export const VisibilitySchema = z.enum(['ONLY_ME','MY_PT','PT_AND_FRIENDS','EVERYONE']);

export type VisibilityType = `${z.infer<typeof VisibilitySchema>}`

export default VisibilitySchema;
