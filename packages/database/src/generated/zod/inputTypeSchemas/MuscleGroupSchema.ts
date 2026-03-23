import { z } from 'zod';

export const MuscleGroupSchema = z.enum(['CHEST','BACK','SHOULDERS','BICEPS','TRICEPS','FOREARMS','ABS','OBLIQUES','QUADS','HAMSTRINGS','GLUTES','CALVES','FULL_BODY','CARDIO']);

export type MuscleGroupType = `${z.infer<typeof MuscleGroupSchema>}`

export default MuscleGroupSchema;
