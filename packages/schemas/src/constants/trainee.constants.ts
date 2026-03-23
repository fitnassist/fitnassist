// =============================================================================
// TRAINEE PROFILE CONSTANTS
// =============================================================================

export const FITNESS_GOALS = [
  { value: 'weight-loss', label: 'Weight Loss' },
  { value: 'muscle-gain', label: 'Muscle Gain' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'general-fitness', label: 'General Fitness' },
  { value: 'sports-performance', label: 'Sports Performance' },
  { value: 'rehabilitation', label: 'Rehabilitation' },
  { value: 'stress-relief', label: 'Stress Relief' },
  { value: 'body-recomposition', label: 'Body Recomposition' },
] as const;

export type FitnessGoal = (typeof FITNESS_GOALS)[number];
export type FitnessGoalValue = FitnessGoal['value'];

export const FITNESS_GOAL_VALUES = FITNESS_GOALS.map((g) => g.value);

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const;

export type GenderOption = (typeof GENDER_OPTIONS)[number];

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
] as const;

export type ExperienceLevelOption = (typeof EXPERIENCE_LEVEL_OPTIONS)[number];

export const ACTIVITY_LEVEL_OPTIONS = [
  { value: 'SEDENTARY', label: 'Sedentary' },
  { value: 'LIGHTLY_ACTIVE', label: 'Lightly Active' },
  { value: 'MODERATELY_ACTIVE', label: 'Moderately Active' },
  { value: 'VERY_ACTIVE', label: 'Very Active' },
  { value: 'EXTREMELY_ACTIVE', label: 'Extremely Active' },
] as const;

export type ActivityLevelOption = (typeof ACTIVITY_LEVEL_OPTIONS)[number];

export const WEEKLY_WEIGHT_GOAL_OPTIONS = [
  { value: -1.0, label: 'Lose 1 kg per week' },
  { value: -0.75, label: 'Lose 0.75 kg per week' },
  { value: -0.5, label: 'Lose 0.5 kg per week' },
  { value: -0.25, label: 'Lose 0.25 kg per week' },
  { value: 0, label: 'Maintain weight' },
  { value: 0.25, label: 'Gain 0.25 kg per week' },
  { value: 0.5, label: 'Gain 0.5 kg per week' },
] as const;

export type WeeklyWeightGoalOption = (typeof WEEKLY_WEIGHT_GOAL_OPTIONS)[number];
