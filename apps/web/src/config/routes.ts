export const routes = {
  home: '/',

  // Auth
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // Trainers
  trainers: '/trainers',
  // Public trainer profile (e.g., fitnassist.com/trainers/john-smith)
  trainerPublicProfile: (handle: string) => `/trainers/${handle}`,

  // Trainer Profile Setup
  trainerProfileCreate: '/trainer/profile/create',
  trainerProfileEdit: '/trainer/profile/edit',

  // Trainee Profile
  traineeProfileCreate: '/trainee/profile/create',
  traineeProfileEdit: '/trainee/profile/edit',
  traineeProfileView: (userId: string) => `/trainee/profile/${userId}`,

  // Dashboard
  dashboard: '/dashboard',
  dashboardProfile: '/dashboard/profile',
  dashboardContacts: '/dashboard/contacts',
  dashboardRequests: '/dashboard/requests',
  dashboardMessages: '/dashboard/messages',
  dashboardMessageThread: (connectionId: string) => `/dashboard/messages/${connectionId}`,
  dashboardClients: '/dashboard/clients',
  dashboardClientDetail: (id: string) => `/dashboard/clients/${id}`,
  dashboardDiary: '/dashboard/diary',
  dashboardGoals: '/dashboard/goals',
  dashboardMyPlans: '/dashboard/my-plans',
  dashboardResources: '/dashboard/resources',
  dashboardExerciseCreate: '/dashboard/resources/exercises/new',
  dashboardExerciseEdit: (id: string) => `/dashboard/resources/exercises/${id}/edit`,
  dashboardRecipeCreate: '/dashboard/resources/recipes/new',
  dashboardRecipeEdit: (id: string) => `/dashboard/resources/recipes/${id}/edit`,
  dashboardWorkoutPlanCreate: '/dashboard/resources/workout-plans/new',
  dashboardWorkoutPlanEdit: (id: string) => `/dashboard/resources/workout-plans/${id}/edit`,
  dashboardMealPlanCreate: '/dashboard/resources/meal-plans/new',
  dashboardMealPlanEdit: (id: string) => `/dashboard/resources/meal-plans/${id}/edit`,
  dashboardOnboarding: '/dashboard/onboarding',
  dashboardOnboardingTemplateCreate: '/dashboard/onboarding/templates/new',
  dashboardOnboardingTemplateEdit: (id: string) => `/dashboard/onboarding/templates/${id}/edit`,
  dashboardOnboardingComplete: (responseId: string) => `/dashboard/onboarding/${responseId}`,
  dashboardAnalytics: '/dashboard/analytics',
  dashboardBookings: '/dashboard/bookings',
  dashboardBookingsBook: (trainerId: string) => `/dashboard/bookings/book/${trainerId}`,
  dashboardSettings: '/dashboard/settings',

  // Pricing
  pricing: '/pricing',

  // Legal & Support
  privacy: '/privacy',
  terms: '/terms',
  support: '/support',
} as const;
