import { TRPCError } from '@trpc/server';
import { traineeRepository } from '../repositories/trainee.repository';
import { contactRepository } from '../repositories/contact.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import { goalRepository } from '../repositories/goal.repository';
import { personalBestRepository } from '../repositories/personal-best.repository';
import { diaryRepository } from '../repositories/diary.repository';
import type { CreateTraineeProfileInput, UpdateTraineeProfileInput, UpdatePrivacySettingsInput } from '@fitnassist/schemas';
import { canView } from '@fitnassist/schemas';
import type { ViewerRelationship } from '@fitnassist/schemas';
import type { Visibility, TraineeProfile, User } from '@fitnassist/database';

type TraineeProfileWithUser = TraineeProfile & { user: User };

// Reserved handles that can't be claimed
const RESERVED_HANDLES = new Set([
  'admin', 'support', 'help', 'settings', 'dashboard', 'profile',
  'login', 'register', 'api', 'trainers', 'users', 'about',
  'privacy', 'terms', 'contact', 'pricing', 'home', 'feed',
  'friends', 'leaderboards', 'achievements', 'search', 'explore',
]);

export const traineeService = {
  async hasProfile(userId: string): Promise<boolean> {
    const profile = await traineeRepository.findByUserId(userId);
    return !!profile;
  },

  async getByUserId(userId: string) {
    return traineeRepository.findByUserId(userId);
  },

  async create(userId: string, data: CreateTraineeProfileInput) {
    const existing = await traineeRepository.findByUserId(userId);
    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Trainee profile already exists',
      });
    }

    // Validate handle if provided
    if (data.handle) {
      await this.validateHandle(data.handle);
    }

    // Convert dateOfBirth string to Date if provided
    const { dateOfBirth, ...rest } = data;

    return traineeRepository.create(userId, {
      ...rest,
      handle: rest.handle || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      // Clean empty strings to null
      avatarUrl: rest.avatarUrl || undefined,
      bio: rest.bio || undefined,
      fitnessGoalNotes: rest.fitnessGoalNotes || undefined,
      medicalNotes: rest.medicalNotes || undefined,
      location: rest.location || undefined,
      addressLine1: rest.addressLine1 || undefined,
      addressLine2: rest.addressLine2 || undefined,
      city: rest.city || undefined,
      county: rest.county || undefined,
      postcode: rest.postcode || undefined,
      country: rest.country || undefined,
      placeId: rest.placeId || undefined,
    });
  },

  async getProfileForTrainer(traineeUserId: string, trainerUserId: string) {
    const profile = await traineeRepository.findByUserId(traineeUserId);
    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainee profile not found',
      });
    }

    // Determine if the trainer is connected
    const trainerProfile = await trainerRepository.findByUserId(trainerUserId);
    if (!trainerProfile) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only connected trainers can view this profile',
      });
    }

    const connection = await contactRepository.findConnectionByTraineeAndTrainer(
      traineeUserId,
      trainerProfile.id,
    );

    const isConnected = connection?.status === 'ACCEPTED';

    // Connected trainers can see everything at MY_PT level and above
    // Non-connected trainers can only see EVERYONE level fields
    const viewerRelationship: ViewerRelationship = isConnected ? 'PT' : 'PUBLIC';

    return filterProfileByPrivacy(profile, viewerRelationship);
  },

  async getByHandle(handle: string, viewerUserId?: string) {
    const profile = await traineeRepository.findByHandle(handle);
    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Profile not found',
      });
    }

    // Determine viewer relationship
    const viewerRelationship = await determineViewerRelationship(
      profile.userId,
      viewerUserId,
    );

    return {
      ...filterProfileByPrivacy(profile, viewerRelationship),
      viewerRelationship,
    };
  },

  async setHandle(userId: string, handle: string) {
    const profile = await traineeRepository.findByUserId(userId);
    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainee profile not found',
      });
    }

    await this.validateHandle(handle, userId);

    return traineeRepository.update(profile.id, { handle });
  },

  async checkHandleAvailability(handle: string, excludeUserId?: string) {
    if (RESERVED_HANDLES.has(handle.toLowerCase())) {
      return { available: false, reason: 'This handle is reserved' };
    }

    const isAvailable = await traineeRepository.isHandleAvailable(handle, excludeUserId);
    return {
      available: isAvailable,
      reason: isAvailable ? undefined : 'This handle is already taken',
    };
  },

  async validateHandle(handle: string, excludeUserId?: string) {
    if (RESERVED_HANDLES.has(handle.toLowerCase())) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This handle is reserved',
      });
    }

    const isAvailable = await traineeRepository.isHandleAvailable(handle, excludeUserId);
    if (!isAvailable) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This handle is already taken',
      });
    }
  },

  async getPrivacySettings(userId: string) {
    const profile = await traineeRepository.findByUserId(userId);
    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainee profile not found',
      });
    }

    return {
      privacyBio: profile.privacyBio,
      privacyLocation: profile.privacyLocation,
      privacyFitnessGoals: profile.privacyFitnessGoals,
      privacyDiaryActivity: profile.privacyDiaryActivity,
      privacyProgressPhotos: profile.privacyProgressPhotos,
      privacyWeight: profile.privacyWeight,
      privacyMeasurements: profile.privacyMeasurements,
      privacyGoals: profile.privacyGoals,
      privacyPersonalBests: profile.privacyPersonalBests,
      privacyStats: profile.privacyStats,
      privacyNutrition: profile.privacyNutrition,
    };
  },

  async updatePrivacySettings(userId: string, settings: UpdatePrivacySettingsInput) {
    const profile = await traineeRepository.findByUserId(userId);
    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainee profile not found',
      });
    }

    return traineeRepository.updatePrivacySettings(userId, settings);
  },

  /**
   * Get public profile data (goals, PBs, recent activity, etc.) for a handle.
   * Each section is gated by the profile's privacy settings relative to the viewer.
   */
  async getPublicProfileData(handle: string, viewerUserId?: string) {
    const profile = await traineeRepository.findByHandle(handle);
    if (!profile) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
    }

    const viewerRelationship = await determineViewerRelationship(profile.userId, viewerUserId);
    const check = (setting: Visibility) => canView(viewerRelationship, setting);

    // Date range for diary/trends (90 days to support 7d/30d/90d selector)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    // Fetch all data in parallel, then filter by privacy
    const canSeeDiary = check(profile.privacyDiaryActivity);
    const canSeeWeight = check(profile.privacyWeight);
    const needsDiaryFetch = canSeeDiary || canSeeWeight;

    const [goals, personalBests, allDiaryEntries, progressPhotos] = await Promise.all([
      check(profile.privacyGoals)
        ? goalRepository.findByUserId(profile.userId)
        : Promise.resolve([]),
      check(profile.privacyPersonalBests)
        ? personalBestRepository.findByUser(profile.userId)
        : Promise.resolve([]),
      needsDiaryFetch
        ? diaryRepository.findEntriesByDateRange(profile.userId, startDate, endDate)
        : Promise.resolve([]),
      check(profile.privacyProgressPhotos)
        ? diaryRepository.findProgressPhotosByUserId(profile.userId, 12)
        : Promise.resolve([]),
    ]);

    // Filter diary entries: include weight if privacyWeight allows, rest if privacyDiaryActivity allows
    const diaryEntries = allDiaryEntries.filter((e) => {
      if (e.type === 'WEIGHT') return canSeeWeight;
      return canSeeDiary;
    });

    // Build stats summary if permitted
    const stats = check(profile.privacyStats) ? {
      totalGoals: goals.length,
      completedGoals: goals.filter((g) => g.status === 'COMPLETED').length,
      activeGoals: goals.filter((g) => g.status === 'ACTIVE').length,
      totalPBs: personalBests.length,
    } : null;

    // Strip comments from diary entries (private conversations) and map to safe shape
    const safeDiaryEntries = needsDiaryFetch ? diaryEntries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      date: entry.date,
      createdAt: entry.createdAt,
      weightEntry: entry.weightEntry,
      waterEntry: entry.waterEntry,
      measurementEntry: entry.measurementEntry,
      moodEntry: entry.moodEntry ? { level: entry.moodEntry.level } : null,
      sleepEntry: entry.sleepEntry ? { hoursSlept: entry.sleepEntry.hoursSlept, quality: entry.sleepEntry.quality } : null,
      foodEntries: (entry.foodEntries ?? []).map((f) => ({
        name: f.name,
        calories: f.calories,
        proteinG: f.proteinG,
        carbsG: f.carbsG,
        fatG: f.fatG,
      })),
      workoutLogEntry: entry.workoutLogEntry ? {
        durationMinutes: entry.workoutLogEntry.durationMinutes,
        caloriesBurned: entry.workoutLogEntry.caloriesBurned,
        workoutPlanName: entry.workoutLogEntry.workoutPlan?.name ?? null,
      } : null,
      stepsEntry: entry.stepsEntry,
      activityEntry: entry.activityEntry ? {
        activityType: entry.activityEntry.activityType,
        activityName: entry.activityEntry.activityName,
        distanceKm: entry.activityEntry.distanceKm,
        durationSeconds: entry.activityEntry.durationSeconds,
        avgPaceSecPerKm: entry.activityEntry.avgPaceSecPerKm,
        caloriesBurned: entry.activityEntry.caloriesBurned,
      } : null,
      progressPhotos: (entry.progressPhotos ?? []).map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        category: p.category,
      })),
    })) : null;

    return {
      goals: check(profile.privacyGoals) ? goals : null,
      personalBests: check(profile.privacyPersonalBests) ? personalBests : null,
      diaryEntries: safeDiaryEntries,
      progressPhotos: check(profile.privacyProgressPhotos) ? progressPhotos.flatMap((entry) =>
        (entry.progressPhotos || []).map((photo) => ({
          id: photo.id,
          imageUrl: photo.imageUrl,
          category: photo.category,
          date: entry.date,
        })),
      ) : null,
      stats,
      viewerRelationship,
    };
  },

  async update(userId: string, data: UpdateTraineeProfileInput) {
    const profile = await traineeRepository.findByUserId(userId);
    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainee profile not found',
      });
    }

    // Validate handle if being changed
    if (data.handle !== undefined && data.handle !== '' && data.handle !== profile.handle) {
      await this.validateHandle(data.handle, userId);
    }

    // Convert dateOfBirth string to Date if provided
    const { dateOfBirth, ...rest } = data;

    return traineeRepository.update(profile.id, {
      ...rest,
      // Clean empty handle to null
      handle: rest.handle === '' ? null : rest.handle,
      ...(dateOfBirth !== undefined && {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      }),
    });
  },
};

/**
 * Determine the relationship between a viewer and a profile owner.
 */
const determineViewerRelationship = async (
  profileUserId: string,
  viewerUserId?: string,
): Promise<ViewerRelationship> => {
  if (!viewerUserId) return 'PUBLIC';
  if (viewerUserId === profileUserId) return 'SELF';

  // Check if viewer is a connected trainer
  const trainerProfile = await trainerRepository.findByUserId(viewerUserId);
  if (trainerProfile) {
    const connection = await contactRepository.findConnectionByTraineeAndTrainer(
      profileUserId,
      trainerProfile.id,
    );
    if (connection?.status === 'ACCEPTED') return 'PT';
  }

  // TODO: Phase 5.2 — check friendship status here
  // const areFriends = await friendshipRepository.areFriends(viewerUserId, profileUserId);
  // if (areFriends) return 'FRIEND';

  return 'PUBLIC';
};

/**
 * Filter a trainee profile based on viewer relationship and privacy settings.
 * Returns the profile with restricted fields set to null.
 */
const filterProfileByPrivacy = (
  profile: TraineeProfileWithUser,
  viewerRelationship: ViewerRelationship,
) => {
  const check = (setting: Visibility) => canView(viewerRelationship, setting);

  return {
    // Always visible
    id: profile.id,
    userId: profile.userId,
    handle: profile.handle,
    avatarUrl: profile.avatarUrl,
    userName: profile.user.name,
    unitPreference: profile.unitPreference,
    createdAt: profile.createdAt,

    // Privacy-gated fields — bio level
    bio: check(profile.privacyBio) ? profile.bio : null,
    experienceLevel: check(profile.privacyBio) ? profile.experienceLevel : null,
    activityLevel: check(profile.privacyBio) ? profile.activityLevel : null,
    gender: check(profile.privacyBio) ? profile.gender : null,
    dateOfBirth: check(profile.privacyBio) ? profile.dateOfBirth : null,

    // Location
    city: check(profile.privacyLocation) ? profile.city : null,
    postcode: check(profile.privacyLocation) ? profile.postcode : null,
    location: check(profile.privacyLocation) ? profile.location : null,

    // Fitness goals
    fitnessGoals: check(profile.privacyFitnessGoals) ? profile.fitnessGoals : [],
    fitnessGoalNotes: check(profile.privacyFitnessGoals) ? profile.fitnessGoalNotes : null,

    // Weight / body metrics
    heightCm: check(profile.privacyWeight) ? profile.heightCm : null,
    startWeightKg: check(profile.privacyWeight) ? profile.startWeightKg : null,
    goalWeightKg: check(profile.privacyWeight) ? profile.goalWeightKg : null,

    // Medical notes (gated at weight level — sensitive data)
    medicalNotes: check(profile.privacyWeight) ? profile.medicalNotes : null,

    // Privacy setting values (so the viewer knows what's hidden)
    privacyBio: profile.privacyBio,
    privacyLocation: profile.privacyLocation,
    privacyFitnessGoals: profile.privacyFitnessGoals,
    privacyDiaryActivity: profile.privacyDiaryActivity,
    privacyProgressPhotos: profile.privacyProgressPhotos,
    privacyWeight: profile.privacyWeight,
    privacyMeasurements: profile.privacyMeasurements,
    privacyGoals: profile.privacyGoals,
    privacyPersonalBests: profile.privacyPersonalBests,
    privacyStats: profile.privacyStats,
    privacyNutrition: profile.privacyNutrition,
  };
};
