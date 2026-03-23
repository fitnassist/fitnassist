// =============================================================================
// RE-EXPORT GENERATED SCHEMAS FROM PRISMA
// =============================================================================
// These are auto-generated from the Prisma schema with zod-prisma-types.
// Run `npm run db:generate` to regenerate after schema changes.

export {
  // Model schemas
  UserSchema,
  TrainerProfileSchema,
  TraineeProfileSchema,
  ContactRequestSchema,
  MessageSchema,
  NewsletterSubscriptionSchema,
  ProfileViewSchema,
  SessionSchema,
  AccountSchema,
  VerificationSchema,
  ClientNoteSchema,
  ConversationPreferenceSchema,
  // Optional default values schemas (for creating new records)
  UserOptionalDefaultsSchema,
  TrainerProfileOptionalDefaultsSchema,
  TraineeProfileOptionalDefaultsSchema,
  ContactRequestOptionalDefaultsSchema,
  MessageOptionalDefaultsSchema,
  NewsletterSubscriptionOptionalDefaultsSchema,
  ProfileViewOptionalDefaultsSchema,
  ClientNoteOptionalDefaultsSchema,
  ConversationPreferenceOptionalDefaultsSchema,
  // Enum schemas
  UserRoleSchema,
  SubscriptionTierSchema,
  TravelOptionSchema,
  ContactRequestTypeSchema,
  ContactRequestStatusSchema,
  GenderSchema,
  UnitPreferenceSchema,
  ExperienceLevelSchema,
  ActivityLevelSchema,
  ClientStatusSchema,
  OnboardingStatusSchema,
  MuscleGroupSchema,
  MealTypeSchema,
  DiaryEntryTypeSchema,
  MoodLevelSchema,
  GoalTypeSchema,
  GoalStatusSchema,
  GoalSchema,
  GoalOptionalDefaultsSchema,
  DiaryEntrySchema,
  DiaryEntryOptionalDefaultsSchema,
  WeightEntrySchema,
  WeightEntryOptionalDefaultsSchema,
  WaterEntrySchema,
  WaterEntryOptionalDefaultsSchema,
  MeasurementEntrySchema,
  MeasurementEntryOptionalDefaultsSchema,
  MoodEntrySchema,
  MoodEntryOptionalDefaultsSchema,
  SleepEntrySchema,
  SleepEntryOptionalDefaultsSchema,
  ExerciseSchema,
  ExerciseOptionalDefaultsSchema,
  OnboardingTemplateSchema,
  OnboardingTemplateOptionalDefaultsSchema,
  OnboardingResponseSchema,
  OnboardingResponseOptionalDefaultsSchema,
  WorkoutLogEntrySchema,
  WorkoutLogEntryOptionalDefaultsSchema,
  StepsEntrySchema,
  StepsEntryOptionalDefaultsSchema,
  ProgressPhotoSchema,
  ProgressPhotoOptionalDefaultsSchema,
  DiaryCommentSchema,
  DiaryCommentOptionalDefaultsSchema,
} from '@fitnassist/database';

// =============================================================================
// FORM & API INPUT SCHEMAS
// =============================================================================
// These are schemas for forms and API inputs that don't map directly to
// database models (e.g., login form needs password, search has pagination)

export * from './forms/auth.schema';
export * from './forms/search.schema';
export * from './forms/trainer.schema';
export * from './forms/contact.schema';
export * from './forms/newsletter.schema';
export * from './forms/settings.schema';
export * from './forms/support.schema';
export * from './forms/trainee.schema';
export * from './forms/client-roster.schema';
export * from './forms/exercise.schema';
export * from './forms/recipe.schema';
export * from './forms/workout-plan.schema';
export * from './forms/meal-plan.schema';
export * from './forms/onboarding.schema';
export * from './forms/conversation.schema';
export * from './forms/diary.schema';
export * from './forms/goal.schema';

// =============================================================================
// CONSTANTS
// =============================================================================
// Predefined options for trainer profiles (services, qualifications)

export * from './constants';
