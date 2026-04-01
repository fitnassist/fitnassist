const FRIEND_VISIBLE_LEVELS = ['PT_AND_FRIENDS', 'EVERYONE'];

/**
 * Check if a trainee profile has any content visible to friends.
 * Returns false if the profile doesn't exist or all section-level
 * privacy settings are more restrictive than PT_AND_FRIENDS.
 */
export const hasVisibleFriendProfile = (
  traineeProfile:
    | {
        handle?: string | null;
        privacyBio?: string | null;
        privacyLocation?: string | null;
        privacyBodyMetrics?: string | null;
        privacyGoals?: string | null;
        privacyPersonalBests?: string | null;
        privacyProgressPhotos?: string | null;
        privacyStats?: string | null;
      }
    | null
    | undefined,
): boolean => {
  if (!traineeProfile) return false;

  const settings = [
    traineeProfile.privacyBio,
    traineeProfile.privacyLocation,
    traineeProfile.privacyBodyMetrics,
    traineeProfile.privacyGoals,
    traineeProfile.privacyPersonalBests,
    traineeProfile.privacyProgressPhotos,
    traineeProfile.privacyStats,
  ];

  return settings.some((s) => s && FRIEND_VISIBLE_LEVELS.includes(s));
};
