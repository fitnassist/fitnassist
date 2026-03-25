import { z } from 'zod';

export const ActivityTypeSchema = z.enum(['RUN','WALK','CYCLE','SWIM','HIKE','OTHER']);

export type ActivityTypeType = `${z.infer<typeof ActivityTypeSchema>}`

export default ActivityTypeSchema;
