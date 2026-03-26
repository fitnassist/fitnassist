import { router } from '../lib/trpc';
import { authRouter } from './auth.router';
import { healthRouter } from './health.router';
import { trainerRouter } from './trainer.router';
import { traineeRouter } from './trainee.router';
import { contactRouter } from './contact.router';
import { newsletterRouter } from './newsletter.router';
import { uploadRouter } from './upload.router';
import { messageRouter } from './message.router';
import { userRouter } from './user.router';
import { supportRouter } from './support.router';
import { galleryRouter } from './gallery.router';
import { clientRosterRouter } from './client-roster.router';
import { exerciseRouter } from './exercise.router';
import { recipeRouter } from './recipe.router';
import { workoutPlanRouter } from './workout-plan.router';
import { mealPlanRouter } from './meal-plan.router';
import { onboardingRouter } from './onboarding.router';
import { diaryRouter } from './diary.router';
import { goalRouter } from './goal.router';
import { subscriptionRouter } from './subscription.router';
import { sessionLocationRouter } from './session-location.router';
import { availabilityRouter } from './availability.router';
import { bookingRouter } from './booking.router';
import { notificationRouter } from './notification.router';
import { analyticsRouter } from './analytics.router';
import { followRouter } from './follow.router';
import { friendshipRouter } from './friendship.router';
import { postRouter } from './post.router';
import { leaderboardRouter } from './leaderboard.router';

export const appRouter = router({
  auth: authRouter,
  health: healthRouter,
  trainer: trainerRouter,
  trainee: traineeRouter,
  contact: contactRouter,
  newsletter: newsletterRouter,
  upload: uploadRouter,
  message: messageRouter,
  user: userRouter,
  support: supportRouter,
  gallery: galleryRouter,
  clientRoster: clientRosterRouter,
  exercise: exerciseRouter,
  recipe: recipeRouter,
  workoutPlan: workoutPlanRouter,
  mealPlan: mealPlanRouter,
  onboarding: onboardingRouter,
  diary: diaryRouter,
  goal: goalRouter,
  subscription: subscriptionRouter,
  sessionLocation: sessionLocationRouter,
  availability: availabilityRouter,
  booking: bookingRouter,
  notification: notificationRouter,
  analytics: analyticsRouter,
  follow: followRouter,
  friendship: friendshipRouter,
  post: postRouter,
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
