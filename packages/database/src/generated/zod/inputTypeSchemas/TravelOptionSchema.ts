

export const TravelOptionSchema = z.enum(['CLIENT_TRAVELS','TRAINER_TRAVELS','BOTH']);

export type TravelOptionType = `${z.infer<typeof TravelOptionSchema>}`

export default TravelOptionSchema;
