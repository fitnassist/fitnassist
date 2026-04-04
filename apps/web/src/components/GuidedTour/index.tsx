import { useCallback } from 'react';
import { Joyride, STATUS, ACTIONS } from 'react-joyride';
import type { EventData, Controls, Step } from 'react-joyride';
import { trpc } from '@/lib/trpc';
import { useSession } from '@/lib/auth-client';

interface GuidedTourProps {
  role: 'TRAINER' | 'TRAINEE';
}

const trainerSteps: Step[] = [
  {
    target: 'body',
    content: "Welcome to Fitnassist! Let's show you around your dashboard.",
    placement: 'center',
    skipBeacon: true,
  },
  {
    target: '[data-tour="stats-row"]',
    content: 'Your key metrics at a glance — profile views, active clients, and bookings.',
    skipBeacon: true,
  },
  {
    target: '[data-tour="nav-requests"]',
    content: 'Connection and callback requests from trainees appear here.',
    skipBeacon: true,
  },
  {
    target: '[data-tour="nav-clients"]',
    content: 'Manage your client roster, notes, and assigned plans.',
    skipBeacon: true,
  },
  {
    target: '[data-tour="nav-resources"]',
    content: 'Create exercises, workout plans, meal plans, and recipes for your clients.',
    skipBeacon: true,
  },
  {
    target: '[data-tour="profile-card"]',
    content: "Customise your public profile to attract new clients. You're all set!",
    skipBeacon: true,
  },
];

const traineeSteps: Step[] = [
  {
    target: 'body',
    content: "Welcome to Fitnassist! Here's how to get the most out of the platform.",
    placement: 'center',
    skipBeacon: true,
  },
  {
    target: '[data-tour="quick-actions"]',
    content: 'Quick links to your diary, goals, plans, and finding trainers.',
    skipBeacon: true,
  },
  {
    target: '[data-tour="nav-diary"]',
    content: 'Log your meals, weight, workouts, mood, sleep, and more.',
    skipBeacon: true,
  },
  {
    target: '[data-tour="nav-goals"]',
    content: 'Set fitness goals and track your progress over time.',
    skipBeacon: true,
  },
  {
    target: '[data-tour="nav-my-plans"]',
    content: 'View workout and meal plans assigned by your trainer.',
    skipBeacon: true,
  },
  {
    target: '[data-tour="nav-find-trainers"]',
    content: "Search for personal trainers near you. You're ready to go!",
    skipBeacon: true,
  },
];

export const GuidedTour = ({ role }: GuidedTourProps) => {
  const { refetch: refetchSession } = useSession();

  const completeTour = trpc.user.completeWebTour.useMutation({
    onSuccess: () => refetchSession(),
  });
  const skipTour = trpc.user.skipWebTour.useMutation({
    onSuccess: () => refetchSession(),
  });

  const steps = role === 'TRAINER' ? trainerSteps : traineeSteps;

  const handleEvent = useCallback(
    (data: EventData, controls: Controls) => {
      const { status, action } = data;

      if (status === STATUS.FINISHED) {
        completeTour.mutate();
      }

      if (status === STATUS.SKIPPED || action === ACTIONS.SKIP) {
        controls.close();
        skipTour.mutate();
      }
    },
    [completeTour, skipTour],
  );

  return (
    <Joyride
      steps={steps}
      run
      continuous
      onEvent={handleEvent}
      options={{
        overlayColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10000,
        backgroundColor: 'hsl(230, 18%, 14%)',
        textColor: 'hsl(0, 0%, 95%)',
        primaryColor: 'hsl(346, 66%, 55%)',
        showProgress: true,
        buttons: ['skip', 'back', 'primary', 'close'],
        overlayClickAction: false,
        dismissKeyAction: 'close',
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip tour',
      }}
    />
  );
};
