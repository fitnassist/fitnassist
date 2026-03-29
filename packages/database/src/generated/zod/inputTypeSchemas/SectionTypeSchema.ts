import { z } from 'zod';

export const SectionTypeSchema = z.enum(['HERO','ABOUT','SERVICES','GALLERY','TESTIMONIALS','BLOG','CONTACT','CUSTOM_TEXT','VIDEO','PRICING','FAQ','CTA','SOCIAL_LINKS','SHOP']);

export type SectionTypeType = `${z.infer<typeof SectionTypeSchema>}`

export default SectionTypeSchema;
