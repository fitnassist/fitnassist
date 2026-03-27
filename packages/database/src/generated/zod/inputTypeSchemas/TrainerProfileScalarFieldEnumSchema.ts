import { z } from 'zod';

export const TrainerProfileScalarFieldEnumSchema = z.enum(['id','userId','handle','displayName','bio','qualifications','services','profileImageUrl','coverImageUrl','videoIntroUrl','addressLine1','addressLine2','city','county','postcode','country','placeId','latitude','longitude','contactEmail','phoneNumber','socialLinks','hourlyRateMin','hourlyRateMax','travelOption','subscriptionTier','acceptingClients','isPublished','travelBufferMin','smartTravelEnabled','offersVideoSessions','paymentsEnabled','stripeConnectedAccountId','stripeOnboardingComplete','firstSessionFree','createdAt','updatedAt']);

export default TrainerProfileScalarFieldEnumSchema;
