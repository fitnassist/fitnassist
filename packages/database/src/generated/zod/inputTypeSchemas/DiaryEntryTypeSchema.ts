import { z } from 'zod';


export const DiaryEntryTypeSchema = z.enum(['WEIGHT','WATER','MEASUREMENT','MOOD','SLEEP','FOOD','WORKOUT_LOG','PROGRESS_PHOTO','STEPS']);

export type DiaryEntryTypeType = `${z.infer<typeof DiaryEntryTypeSchema>}`

export default DiaryEntryTypeSchema;
