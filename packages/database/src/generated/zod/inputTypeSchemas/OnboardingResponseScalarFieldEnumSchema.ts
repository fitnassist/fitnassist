import { z } from 'zod';

export const OnboardingResponseScalarFieldEnumSchema = z.enum(['id','templateId','clientRosterId','answers','waiverSigned','waiverSignedAt','waiverSignedName','status','completedAt','reviewedAt','reviewNotes','createdAt','updatedAt']);

export default OnboardingResponseScalarFieldEnumSchema;
