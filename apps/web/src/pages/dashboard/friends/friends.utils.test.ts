import { hasVisibleFriendProfile } from './friends.utils';

describe('hasVisibleFriendProfile', () => {
  it('returns false for null profile', () => {
    expect(hasVisibleFriendProfile(null)).toBe(false);
  });

  it('returns false for undefined profile', () => {
    expect(hasVisibleFriendProfile(undefined)).toBe(false);
  });

  it('returns false when all settings are null', () => {
    expect(
      hasVisibleFriendProfile({
        privacyBio: null,
        privacyLocation: null,
        privacyBodyMetrics: null,
        privacyGoals: null,
        privacyPersonalBests: null,
        privacyProgressPhotos: null,
        privacyStats: null,
      }),
    ).toBe(false);
  });

  it('returns false when all settings are PT_ONLY', () => {
    expect(
      hasVisibleFriendProfile({
        privacyBio: 'PT_ONLY',
        privacyLocation: 'PT_ONLY',
        privacyBodyMetrics: 'PT_ONLY',
        privacyGoals: 'PT_ONLY',
        privacyPersonalBests: 'PT_ONLY',
        privacyProgressPhotos: 'PT_ONLY',
        privacyStats: 'PT_ONLY',
      }),
    ).toBe(false);
  });

  it('returns true when one setting is PT_AND_FRIENDS', () => {
    expect(
      hasVisibleFriendProfile({
        privacyBio: 'PT_ONLY',
        privacyLocation: 'PT_AND_FRIENDS',
        privacyBodyMetrics: 'PT_ONLY',
        privacyGoals: null,
        privacyPersonalBests: null,
        privacyProgressPhotos: null,
        privacyStats: null,
      }),
    ).toBe(true);
  });

  it('returns true when one setting is EVERYONE', () => {
    expect(
      hasVisibleFriendProfile({
        privacyBio: null,
        privacyLocation: null,
        privacyBodyMetrics: null,
        privacyGoals: 'EVERYONE',
        privacyPersonalBests: null,
        privacyProgressPhotos: null,
        privacyStats: null,
      }),
    ).toBe(true);
  });

  it('returns true with mixed settings including a visible one', () => {
    expect(
      hasVisibleFriendProfile({
        privacyBio: 'PT_ONLY',
        privacyLocation: null,
        privacyBodyMetrics: 'EVERYONE',
        privacyGoals: 'PT_ONLY',
        privacyPersonalBests: 'PT_AND_FRIENDS',
        privacyProgressPhotos: null,
        privacyStats: 'PT_ONLY',
      }),
    ).toBe(true);
  });
});
