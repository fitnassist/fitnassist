import { z } from 'zod';

export const GenderSchema = z.enum(['MALE','FEMALE','NON_BINARY','PREFER_NOT_TO_SAY']);

export type GenderType = `${z.infer<typeof GenderSchema>}`

export default GenderSchema;
