import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTRPCClient } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';
import { routes } from '@/config/routes';
import { MainLayout, AuthLayout, DashboardLayout, TrainerOnboardingGuard } from '@/components/layouts';
import { HomePage } from '@/pages/home';
import { RegisterPage } from '@/pages/auth/register';
import { LoginPage } from '@/pages/auth/login';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password';
import { ResetPasswordPage } from '@/pages/auth/reset-password';
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
import { PrivacyPolicyPage } from '@/pages/privacy';
import { TermsOfServicePage } from '@/pages/terms';
import { SupportPage } from '@/pages/support';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
                </Route>
                {/* Auth routes */}
                <Route element={<AuthLayout />}>
                  <Route path={routes.register} element={<RegisterPage />} />
                  <Route path={routes.login} element={<LoginPage />} />
                  <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
                  <Route path={routes.resetPassword} element={<ResetPasswordPage />} />
                </Route>
                {/* Profile creation (outside onboarding guard) */}
                <Route element={<DashboardLayout />}>
                  <Route path={routes.trainerProfileCreate} element={<ProfileCreatePage />} />
                  <Route path={routes.traineeProfileCreate} element={<TraineeProfileCreatePage />} />
                </Route>
                {/* Dashboard routes (protected + onboarding guard) */}
                <Route element={<DashboardLayout />}>
                  <Route element={<TrainerOnboardingGuard />}>
                    <Route path={routes.dashboard} element={<DashboardPage />} />
                    <Route path={routes.dashboardRequests} element={<RequestsPage />} />
                    <Route path={routes.dashboardMessages} element={<MessagesPage />} />
                    <Route path="/dashboard/messages/:connectionId" element={<MessagesPage />} />
                    <Route path={routes.dashboardClients} element={<ClientsPage />} />
                    <Route path="/dashboard/clients/:id" element={<ClientDetailPage />} />
                    <Route path={routes.dashboardResources} element={<ResourcesPage />} />
                    <Route path={routes.dashboardExerciseCreate} element={<ExerciseFormPage />} />
                    <Route path="/dashboard/resources/exercises/:id/edit" element={<ExerciseFormPage />} />
                    <Route path={routes.dashboardRecipeCreate} element={<RecipeFormPage />} />
                    <Route path="/dashboard/resources/recipes/:id/edit" element={<RecipeFormPage />} />
                    <Route path={routes.dashboardWorkoutPlanCreate} element={<WorkoutPlanFormPage />} />
                    <Route path="/dashboard/resources/workout-plans/:id/edit" element={<WorkoutPlanFormPage />} />
                    <Route path={routes.dashboardMealPlanCreate} element={<MealPlanFormPage />} />
                    <Route path="/dashboard/resources/meal-plans/:id/edit" element={<MealPlanFormPage />} />
                    <Route path={routes.dashboardOnboarding} element={<OnboardingPage />} />
                    <Route path={routes.dashboardOnboardingTemplateCreate} element={<OnboardingTemplateFormPage />} />
                    <Route path="/dashboard/onboarding/templates/:id/edit" element={<OnboardingTemplateFormPage />} />
                    <Route path="/dashboard/onboarding/:responseId" element={<OnboardingCompletePage />} />
                    <Route path={routes.dashboardDiary} element={<DiaryPage />} />
                    <Route path={routes.dashboardGoals} element={<GoalsPage />} />
                    <Route path={routes.dashboardMyPlans} element={<MyPlansPage />} />
                    <Route path={routes.dashboardContacts} element={<ContactsPage />} />
                    <Route path={routes.dashboardSettings} element={<SettingsPage />} />
                    <Route path={routes.trainerProfileEdit} element={<ProfileEditPage />} />
                    <Route path={routes.traineeProfileEdit} element={<TraineeProfileEditPage />} />
                    <Route path="/trainee/profile/:userId" element={<TraineeProfileViewPage />} />
                  </Route>
                </Route>
                {/* Public trainer profile */}
                <Route element={<MainLayout />}>
                  <Route path="/trainers/:handle" element={<TrainerPublicProfilePage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
