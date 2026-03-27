import { z } from 'zod';

export const SessionTypeSchema = z.enum(['IN_PERSON','VIDEO_CALL']);

export type SessionTypeType = `${z.infer<typeof SessionTypeSchema>}`

export default SessionTypeSchema;
