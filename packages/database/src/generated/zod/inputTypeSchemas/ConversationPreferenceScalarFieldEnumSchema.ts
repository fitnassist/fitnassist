import { z } from 'zod';

export const ConversationPreferenceScalarFieldEnumSchema = z.enum(['id','connectionId','userId','isArchived','deletedAt']);

export default ConversationPreferenceScalarFieldEnumSchema;
