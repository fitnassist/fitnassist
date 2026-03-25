

export const MoodLevelSchema = z.enum(['TERRIBLE','BAD','OKAY','GOOD','GREAT']);

export type MoodLevelType = `${z.infer<typeof MoodLevelSchema>}`

export default MoodLevelSchema;
