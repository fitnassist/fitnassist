// =============================================================================
// PRIVACY / VISIBILITY CONSTANTS
// =============================================================================

export const VISIBILITY_OPTIONS = [
  { value: 'ONLY_ME', label: 'Only Me' },
  { value: 'MY_PT', label: 'My PT' },
  { value: 'PT_AND_FRIENDS', label: 'PT & Friends' },
  { value: 'EVERYONE', label: 'Everyone' },
] as const;

export type VisibilityOption = (typeof VISIBILITY_OPTIONS)[number];

/** Ordered from most restrictive to least restrictive */
export const VISIBILITY_HIERARCHY = ['ONLY_ME', 'MY_PT', 'PT_AND_FRIENDS', 'EVERYONE'] as const;

export type ViewerRelationship = 'SELF' | 'PT' | 'FRIEND' | 'PUBLIC';

/**
 * Maps a viewer relationship to the minimum visibility level they can see.
 * e.g. a PT can see anything set to MY_PT or less restrictive (PT_AND_FRIENDS, EVERYONE).
 */
export const VIEWER_VISIBILITY_THRESHOLD: Record<ViewerRelationship, (typeof VISIBILITY_HIERARCHY)[number]> = {
  SELF: 'ONLY_ME',
  PT: 'MY_PT',
  FRIEND: 'PT_AND_FRIENDS',
  PUBLIC: 'EVERYONE',
};

/**
 * Check if a viewer with a given relationship can see content with a given visibility level.
 */
export const canView = (
  viewerRelationship: ViewerRelationship,
  contentVisibility: (typeof VISIBILITY_HIERARCHY)[number],
): boolean => {
  const threshold = VISIBILITY_HIERARCHY.indexOf(VIEWER_VISIBILITY_THRESHOLD[viewerRelationship]);
  const contentLevel = VISIBILITY_HIERARCHY.indexOf(contentVisibility);
  return contentLevel >= threshold;
};

/** Privacy setting definitions for the settings UI */
export const PRIVACY_SETTINGS = [
  { key: 'privacyBio', label: 'Bio & About', description: 'Your bio, experience level, and activity level' },
  { key: 'privacyLocation', label: 'Location', description: 'Your city and general area' },
  { key: 'privacyFitnessGoals', label: 'Fitness Goals', description: 'Your fitness goals and notes' },
  { key: 'privacyDiaryActivity', label: 'Diary Activity', description: 'Your workout logs, activity, and diary entries' },
  { key: 'privacyProgressPhotos', label: 'Progress Photos', description: 'Your progress photos from diary entries' },
  { key: 'privacyWeight', label: 'Weight', description: 'Your weight entries and history' },
  { key: 'privacyMeasurements', label: 'Measurements', description: 'Your body measurements' },
  { key: 'privacyGoals', label: 'Goals & Personal Bests', description: 'Your goals and personal best records' },
  { key: 'privacyPersonalBests', label: 'Personal Bests', description: 'Your personal best achievements' },
  { key: 'privacyStats', label: 'Stats & Summaries', description: 'Your weekly stats, trends, and summaries' },
  { key: 'privacyNutrition', label: 'Nutrition', description: 'Your food diary and calorie tracking' },
] as const;

export type PrivacySettingKey = (typeof PRIVACY_SETTINGS)[number]['key'];
