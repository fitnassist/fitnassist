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

// =============================================================================
// PRIVACY SETTING DEFINITIONS (for settings UI)
// =============================================================================

export type PrivacySettingDef = {
  key: string;
  label: string;
  description: string;
};

/** Per-section privacy settings */
export const SECTION_PRIVACY_SETTINGS: PrivacySettingDef[] = [
  { key: 'privacyBio', label: 'Bio & About', description: 'Your bio, fitness goals, experience level, and activity level' },
  { key: 'privacyLocation', label: 'Location', description: 'Your city and general area' },
  { key: 'privacyBodyMetrics', label: 'Body Metrics', description: 'Your height, start weight, and goal weight' },
  { key: 'privacyGoals', label: 'Goals', description: 'Your active and completed goals' },
  { key: 'privacyPersonalBests', label: 'Personal Bests', description: 'Your personal best achievements' },
  { key: 'privacyProgressPhotos', label: 'Progress Photos', description: 'Your progress photos' },
  { key: 'privacyStats', label: 'Stats', description: 'Your goal and personal best counts' },
  { key: 'privacyBadges', label: 'Badges', description: 'Your showcase badges on your profile' },
  { key: 'privacyFriendCount', label: 'Friend Count', description: 'Whether others can see your friend count' },
];

/** Granular trend chart privacy settings */
export const TREND_PRIVACY_SETTINGS: PrivacySettingDef[] = [
  { key: 'privacyTrendWeight', label: 'Weight', description: 'Weight trend chart' },
  { key: 'privacyTrendMeasurements', label: 'Measurements', description: 'Body measurement trends' },
  { key: 'privacyTrendNutrition', label: 'Nutrition', description: 'Calorie and macro trends' },
  { key: 'privacyTrendWater', label: 'Water', description: 'Water intake trends' },
  { key: 'privacyTrendMood', label: 'Mood', description: 'Mood tracking trends' },
  { key: 'privacyTrendSleep', label: 'Sleep', description: 'Sleep quality and duration trends' },
  { key: 'privacyTrendActivity', label: 'Activity', description: 'Activity and exercise trends' },
  { key: 'privacyTrendSteps', label: 'Steps', description: 'Daily step count trends' },
];

/** All privacy settings combined */
export const ALL_PRIVACY_SETTINGS: PrivacySettingDef[] = [
  ...SECTION_PRIVACY_SETTINGS,
  ...TREND_PRIVACY_SETTINGS,
];

export type PrivacySettingKey = typeof ALL_PRIVACY_SETTINGS[number]['key'];
