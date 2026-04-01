import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTRPCClient } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';
import { routes } from '@/config/routes';
import {
  MainLayout,
  AuthLayout,
  DashboardLayout,
  TrainerOnboardingGuard,
  RoleGuard,
} from '@/components/layouts';
import { HomePage } from '@/pages/home';
import { RegisterPage } from '@/pages/auth/register';
import { LoginPage } from '@/pages/auth/login';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password';
import { ResetPasswordPage } from '@/pages/auth/reset-password';
import { SelectRolePage } from '@/pages/auth/select-role';
import { DashboardPage } from '@/pages/dashboard/index';
import { RequestsPage } from '@/pages/dashboard/requests';
import { MessagesPage } from '@/pages/dashboard/messages';
import { ContactsPage } from '@/pages/dashboard/contacts';
import { ProfileCreatePage } from '@/pages/trainer/profile/create';
import { ProfileEditPage } from '@/pages/trainer/profile/edit';
import { TraineeProfileCreatePage } from '@/pages/trainee/profile/create';
import { TraineeProfileEditPage } from '@/pages/trainee/profile/edit';
import { TraineeProfileViewPage } from '@/pages/trainee/profile/view';
import { TrainerPublicProfilePage } from '@/pages/trainer/public';
import { TraineePublicProfilePage } from '@/pages/trainee/public';
import { TrainersPage } from '@/pages/trainers';
import { ClientsPage } from '@/pages/dashboard/clients';
import { ClientDetailPage } from '@/pages/dashboard/clients/[id]';
import { ResourcesPage } from '@/pages/dashboard/resources';
import { ExerciseFormPage } from '@/pages/dashboard/resources/exercises/form';
import { RecipeFormPage } from '@/pages/dashboard/resources/recipes/form';
import { WorkoutPlanFormPage } from '@/pages/dashboard/resources/workout-plans/form';
import { MealPlanFormPage } from '@/pages/dashboard/resources/meal-plans/form';
import { DiaryPage } from '@/pages/dashboard/diary';
import { GoalsPage } from '@/pages/dashboard/goals';
import { MyPlansPage } from '@/pages/dashboard/my-plans';
import { OnboardingPage } from '@/pages/dashboard/onboarding';
import { OnboardingTemplateFormPage } from '@/pages/dashboard/onboarding/templates/form';
import { OnboardingCompletePage } from '@/pages/dashboard/onboarding/[responseId]';
import { SettingsPage } from '@/pages/dashboard/settings';
import { BookingsPage } from '@/pages/dashboard/bookings';
import { BookSessionPage } from '@/pages/dashboard/bookings/book';
import { BookingDetailPage } from '@/pages/dashboard/bookings/[id]';
import { BookingCallPage } from '@/pages/dashboard/bookings/[id]/call';
import { TrainerBookSessionPage } from '@/pages/dashboard/bookings/book-client';
import { PrivacyPolicyPage } from '@/pages/privacy';
import { TermsOfServicePage } from '@/pages/terms';
import { SupportPage } from '@/pages/support';
import { PricingPage } from '@/pages/pricing';
import { AnalyticsPage } from '@/pages/dashboard/analytics';
import { ReviewsPage } from '@/pages/dashboard/reviews';
import { WebsitePage } from '@/pages/dashboard/website';
import { StorefrontPage } from '@/pages/dashboard/storefront';
import { ReferralsPage } from '@/pages/dashboard/referrals';
import { SiteRoutePage } from '@/pages/site/route';
import { FeedPage } from '@/pages/dashboard/feed';
import { FriendsPage } from '@/pages/dashboard/friends';
import { LeaderboardsPage } from '@/pages/dashboard/leaderboards';
import { AchievementsPage } from '@/pages/dashboard/achievements';
import { PurchasesPage } from '@/pages/dashboard/purchases';
import { NotFoundPage } from '@/pages/not-found';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui';
import { ThemeProvider } from '@/providers';

function App() {
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path={routes.home} element={<HomePage />} />
                  <Route path={routes.trainers} element={<TrainersPage />} />
                  <Route path={routes.privacy} element={<PrivacyPolicyPage />} />
                  <Route path={routes.terms} element={<TermsOfServicePage />} />
                  <Route path={routes.support} element={<SupportPage />} />
                  <Route path={routes.pricing} element={<PricingPage />} />
                </Route>
                {/* Auth routes */}
                <Route element={<AuthLayout />}>
                  <Route path={routes.register} element={<RegisterPage />} />
                  <Route path={routes.login} element={<LoginPage />} />
                  <Route path="/select-role" element={<SelectRolePage />} />
                  <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
                  <Route path={routes.resetPassword} element={<ResetPasswordPage />} />
                </Route>
                {/* Profile creation (outside onboarding guard) */}
                <Route element={<DashboardLayout />}>
                  <Route path={routes.trainerProfileCreate} element={<ProfileCreatePage />} />
                  <Route
                    path={routes.traineeProfileCreate}
                    element={<TraineeProfileCreatePage />}
                  />
                </Route>
                {/* Dashboard routes (protected + onboarding guard) */}
                <Route element={<DashboardLayout />}>
                  <Route element={<TrainerOnboardingGuard />}>
                    {/* Shared routes (both roles) */}
                    <Route path={routes.dashboard} element={<DashboardPage />} />
                    <Route path={routes.dashboardRequests} element={<RequestsPage />} />
                    <Route path={routes.dashboardMessages} element={<MessagesPage />} />
                    <Route path="/dashboard/messages/:connectionId" element={<MessagesPage />} />
                    <Route path={routes.dashboardBookings} element={<BookingsPage />} />
                    <Route path="/dashboard/bookings/:id" element={<BookingDetailPage />} />
                    <Route path="/dashboard/bookings/:id/call" element={<BookingCallPage />} />
                    <Route path={routes.dashboardSettings} element={<SettingsPage />} />

                    {/* Trainer-only routes */}
                    <Route element={<RoleGuard allowedRoles={['TRAINER']} />}>
                      <Route path={routes.dashboardClients} element={<ClientsPage />} />
                      <Route path="/dashboard/clients/:id" element={<ClientDetailPage />} />
                      <Route path={routes.dashboardResources} element={<ResourcesPage />} />
                      <Route path={routes.dashboardExerciseCreate} element={<ExerciseFormPage />} />
                      <Route
                        path="/dashboard/resources/exercises/:id/edit"
                        element={<ExerciseFormPage />}
                      />
                      <Route path={routes.dashboardRecipeCreate} element={<RecipeFormPage />} />
                      <Route
                        path="/dashboard/resources/recipes/:id/edit"
                        element={<RecipeFormPage />}
                      />
                      <Route
                        path={routes.dashboardWorkoutPlanCreate}
                        element={<WorkoutPlanFormPage />}
                      />
                      <Route
                        path="/dashboard/resources/workout-plans/:id/edit"
                        element={<WorkoutPlanFormPage />}
                      />
                      <Route path={routes.dashboardMealPlanCreate} element={<MealPlanFormPage />} />
                      <Route
                        path="/dashboard/resources/meal-plans/:id/edit"
                        element={<MealPlanFormPage />}
                      />
                      <Route path={routes.dashboardOnboarding} element={<OnboardingPage />} />
                      <Route
                        path={routes.dashboardOnboardingTemplateCreate}
                        element={<OnboardingTemplateFormPage />}
                      />
                      <Route
                        path="/dashboard/onboarding/templates/:id/edit"
                        element={<OnboardingTemplateFormPage />}
                      />
                      <Route
                        path="/dashboard/onboarding/:responseId"
                        element={<OnboardingCompletePage />}
                      />
                      <Route path={routes.dashboardAnalytics} element={<AnalyticsPage />} />
                      <Route path={routes.dashboardReviews} element={<ReviewsPage />} />
                      <Route
                        path="/dashboard/bookings/book-client"
                        element={<TrainerBookSessionPage />}
                      />
                      <Route
                        path="/dashboard/bookings/book-client/:clientRosterId"
                        element={<TrainerBookSessionPage />}
                      />
                      <Route path={routes.dashboardWebsite} element={<WebsitePage />} />
                      <Route path={routes.dashboardStorefront} element={<StorefrontPage />} />
                      <Route path={routes.dashboardReferrals} element={<ReferralsPage />} />
                      <Route path={routes.trainerProfileEdit} element={<ProfileEditPage />} />
                      <Route path="/trainee/profile/:userId" element={<TraineeProfileViewPage />} />
                    </Route>

                    {/* Trainee-only routes */}
                    <Route element={<RoleGuard allowedRoles={['TRAINEE']} />}>
                      <Route path={routes.dashboardFeed} element={<FeedPage />} />
                      <Route path={routes.dashboardDiary} element={<DiaryPage />} />
                      <Route path={routes.dashboardGoals} element={<GoalsPage />} />
                      <Route path={routes.dashboardMyPlans} element={<MyPlansPage />} />
                      <Route path={routes.dashboardContacts} element={<ContactsPage />} />
                      <Route
                        path="/dashboard/bookings/book/:trainerId"
                        element={<BookSessionPage />}
                      />
                      <Route path={routes.dashboardFriends} element={<FriendsPage />} />
                      <Route path={routes.dashboardLeaderboards} element={<LeaderboardsPage />} />
                      <Route path={routes.dashboardAchievements} element={<AchievementsPage />} />
                      <Route path={routes.dashboardPurchases} element={<PurchasesPage />} />
                      <Route
                        path={routes.traineeProfileEdit}
                        element={<TraineeProfileEditPage />}
                      />
                    </Route>
                  </Route>
                </Route>
                {/* Public profiles */}
                <Route element={<MainLayout />}>
                  <Route path="/trainers/:handle" element={<TrainerPublicProfilePage />} />
                  <Route path="/users/:handle" element={<TraineePublicProfilePage />} />
                </Route>
                {/* Public PT websites */}
                <Route path="/site/:handle" element={<SiteRoutePage />} />
                {/* 404 catch-all */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
          </QueryClientProvider>
        </trpc.Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
