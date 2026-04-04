export const routes = {
  home: '/',

  // Auth
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // Trainers
  trainers: '/trainers',
  // Public trainer profile (e.g., fitnassist.co/trainers/john-smith)
  trainerPublicProfile: (handle: string) => `/trainers/${handle}`,

  // Trainer Profile Setup
  trainerProfileCreate: '/trainer/profile/create',
  trainerProfileEdit: '/trainer/profile/edit',

  // Trainee Profile
  traineeProfileCreate: '/trainee/profile/create',
  traineeProfileEdit: '/trainee/profile/edit',
  traineeProfileView: (userId: string) => `/trainee/profile/${userId}`,
  // Public trainee profile (e.g., fitnassist.co/users/jane-doe)
  traineePublicProfile: (handle: string) => `/users/${handle}`,

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
  dashboardWorkout: (planId: string) => `/dashboard/workout/${planId}`,
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
  dashboardReviews: '/dashboard/reviews',
  dashboardBookings: '/dashboard/bookings',
  dashboardBookingDetail: (id: string) => `/dashboard/bookings/${id}`,
  dashboardBookingCall: (id: string) => `/dashboard/bookings/${id}/call`,
  dashboardBookingsBook: (trainerId: string) => `/dashboard/bookings/book/${trainerId}`,
  dashboardBookingsBookClient: '/dashboard/bookings/book-client',
  dashboardBookingsBookClientWithId: (clientRosterId: string) =>
    `/dashboard/bookings/book-client/${clientRosterId}`,
  dashboardFeed: '/dashboard/feed',
  dashboardFriends: '/dashboard/friends',
  dashboardLeaderboards: '/dashboard/leaderboards',
  dashboardAchievements: '/dashboard/achievements',
  dashboardPurchases: '/dashboard/purchases',
  dashboardSettings: '/dashboard/settings',
  dashboardWebsite: '/dashboard/website',
  dashboardStorefront: '/dashboard/storefront',
  dashboardReferrals: '/dashboard/referrals',

  // Pricing
  pricing: '/pricing',

  // Legal & Support
  privacy: '/privacy',
  terms: '/terms',
  support: '/support',
  help: '/help',
} as const;
