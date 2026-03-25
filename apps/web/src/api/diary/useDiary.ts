import { trpc } from '@/lib/trpc';

// =============================================================================
// QUERIES
// =============================================================================

export const useDiaryEntries = (date: string) => {
  return trpc.diary.getEntries.useQuery(
    { date },
    { enabled: !!date }
  );
};

export const useDiaryRange = (startDate: string, endDate: string, type?: string) => {
  return trpc.diary.getRange.useQuery(
    { startDate, endDate, ...(type ? { type: type as 'WEIGHT' | 'WATER' | 'MEASUREMENT' | 'MOOD' | 'SLEEP' } : {}) },
    { enabled: !!startDate && !!endDate }
  );
};

export const useRecentClientActivity = () => {
  return trpc.diary.getRecentClientActivity.useQuery(
    { limit: 20 },
  );
};

// =============================================================================
// MUTATIONS
// =============================================================================

export const useLogWeight = () => {
  const utils = trpc.useUtils();
  return trpc.diary.logWeight.useMutation({
    onSuccess: (_data, variables) => {
      utils.diary.getEntries.invalidate({ date: variables.date });
      utils.diary.getRange.invalidate();
      utils.diary.getPersonalBests.invalidate();
    },
  });
};

export const useLogWater = () => {
  const utils = trpc.useUtils();
  return trpc.diary.logWater.useMutation({
    onSuccess: (_data, variables) => {
      utils.diary.getEntries.invalidate({ date: variables.date });
      utils.diary.getRange.invalidate();
    },
  });
};

export const useLogMeasurements = () => {
  const utils = trpc.useUtils();
  return trpc.diary.logMeasurements.useMutation({
    onSuccess: (_data, variables) => {
      utils.diary.getEntries.invalidate({ date: variables.date });
      utils.diary.getRange.invalidate();
    },
  });
};

export const useLogMood = () => {
  const utils = trpc.useUtils();
  return trpc.diary.logMood.useMutation({
    onSuccess: (_data, variables) => {
      utils.diary.getEntries.invalidate({ date: variables.date });
      utils.diary.getRange.invalidate();
    },
  });
};

export const useLogSleep = () => {
  const utils = trpc.useUtils();
  return trpc.diary.logSleep.useMutation({
    onSuccess: (_data, variables) => {
      utils.diary.getEntries.invalidate({ date: variables.date });
      utils.diary.getRange.invalidate();
    },
  });
};

// =============================================================================
// FOOD
// =============================================================================

export const useSearchFood = (query: string) => {
  return trpc.diary.searchFood.useQuery(
    { query },
    { enabled: query.length >= 2 }
  );
};

export const useMyRecipes = () => {
  return trpc.diary.getMyRecipes.useQuery();
};

export const useLogFood = () => {
  const utils = trpc.useUtils();
  return trpc.diary.logFood.useMutation({
    onSuccess: (_data, variables) => {
      utils.diary.getEntries.invalidate({ date: variables.date });
      utils.diary.getDailyNutrition.invalidate({ date: variables.date });
      utils.diary.getRange.invalidate();
    },
  });
};

export const useUpdateFoodEntry = () => {
  const utils = trpc.useUtils();
  return trpc.diary.updateFoodEntry.useMutation({
    onSuccess: () => {
      utils.diary.getEntries.invalidate();
      utils.diary.getDailyNutrition.invalidate();
      utils.diary.getRange.invalidate();
    },
  });
};

export const useDeleteFoodEntry = () => {
  const utils = trpc.useUtils();
  return trpc.diary.deleteFoodEntry.useMutation({
    onSuccess: () => {
      utils.diary.getEntries.invalidate();
      utils.diary.getDailyNutrition.invalidate();
      utils.diary.getRange.invalidate();
    },
  });
};

export const useDailyNutrition = (date: string) => {
  return trpc.diary.getDailyNutrition.useQuery(
    { date },
    { enabled: !!date }
  );
};

// =============================================================================
// WORKOUT LOG
// =============================================================================

export const useLogWorkout = () => {
  const utils = trpc.useUtils();
  return trpc.diary.logWorkout.useMutation({
    onSuccess: (_data, variables) => {
      utils.diary.getEntries.invalidate({ date: variables.date });
      utils.diary.getDailyNutrition.invalidate({ date: variables.date });
      utils.diary.getRange.invalidate();
      utils.diary.getPersonalBests.invalidate();
    },
  });
};

export const useMyWorkoutPlans = () => {
  return trpc.diary.getMyWorkoutPlans.useQuery();
};

// =============================================================================
// ACTIVITY
// =============================================================================

export const useLogActivity = () => {
  const utils = trpc.useUtils();
  return trpc.diary.logActivity.useMutation({
    onSuccess: (_data, variables) => {
      utils.diary.getEntries.invalidate({ date: variables.date });
      utils.diary.getRange.invalidate();
      utils.diary.getPersonalBests.invalidate();
    },
  });
};

// =============================================================================
// PERSONAL BESTS
// =============================================================================

export const usePersonalBests = (userId?: string) => {
  return trpc.diary.getPersonalBests.useQuery(
    { userId },
    { enabled: true }
  );
};

// =============================================================================
// STEPS
// =============================================================================

export const useLogSteps = () => {
  const utils = trpc.useUtils();
  return trpc.diary.logSteps.useMutation({
    onSuccess: (_data, variables) => {
      utils.diary.getEntries.invalidate({ date: variables.date });
      utils.diary.getRange.invalidate();
      utils.diary.getPersonalBests.invalidate();
    },
  });
};

// =============================================================================
// PROGRESS PHOTOS
// =============================================================================

export const useLogProgressPhotos = () => {
  const utils = trpc.useUtils();
  return trpc.diary.logProgressPhotos.useMutation({
    onSuccess: (_data, variables) => {
      utils.diary.getEntries.invalidate({ date: variables.date });
      utils.diary.getRange.invalidate();
    },
  });
};

export const useDeleteProgressPhoto = () => {
  const utils = trpc.useUtils();
  return trpc.diary.deleteProgressPhoto.useMutation({
    onSuccess: () => {
      utils.diary.getEntries.invalidate();
      utils.diary.getRange.invalidate();
      utils.diary.getProgressPhotos.invalidate();
    },
  });
};

export const useProgressPhotos = (startDate?: string, endDate?: string) => {
  return trpc.diary.getProgressPhotos.useQuery(
    { startDate, endDate },
    { enabled: true }
  );
};

// =============================================================================
// COMMENTS
// =============================================================================

export const useAddDiaryComment = () => {
  const utils = trpc.useUtils();
  return trpc.diary.addComment.useMutation({
    onSuccess: (_data, variables) => {
      utils.diary.getComments.invalidate({ diaryEntryId: variables.diaryEntryId });
      utils.diary.getEntries.invalidate();
    },
  });
};

export const useDiaryComments = (diaryEntryId: string) => {
  return trpc.diary.getComments.useQuery(
    { diaryEntryId },
    { enabled: !!diaryEntryId }
  );
};

export const useDeleteDiaryComment = () => {
  const utils = trpc.useUtils();
  return trpc.diary.deleteComment.useMutation({
    onSuccess: () => {
      utils.diary.getComments.invalidate();
      utils.diary.getEntries.invalidate();
    },
  });
};

// =============================================================================
// DELETE
// =============================================================================

export const useDeleteDiaryEntry = () => {
  const utils = trpc.useUtils();
  return trpc.diary.deleteEntry.useMutation({
    onSuccess: () => {
      utils.diary.getEntries.invalidate();
      utils.diary.getRange.invalidate();
    },
  });
};
