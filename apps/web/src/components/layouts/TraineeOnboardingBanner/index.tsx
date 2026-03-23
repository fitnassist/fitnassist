import { useState } from "react";
import { Link } from "react-router-dom";
import { X, UserCircle } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { routes } from "@/config/routes";
import { useAuth } from "@/hooks";
import { trpc } from "@/lib/trpc";

const DISMISS_KEY = "trainee-onboarding-banner-dismissed";

export const TraineeOnboardingBanner = () => {
  const { isTrainee, isAuthenticated } = useAuth();
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "true",
  );

  const { data, isLoading } = trpc.trainee.hasProfile.useQuery(undefined, {
    enabled: isTrainee && isAuthenticated && !isDismissed,
  });

  // Don't show for non-trainees, if dismissed, while loading, or if they already have a profile
  if (!isTrainee || isDismissed || isLoading || data?.hasProfile) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setIsDismissed(true);
  };

  return (
    <Card className="border-primary/20 bg-primary/5 mb-4">
      <CardContent className="flex items-center gap-4 py-4">
        <div className="rounded-full bg-primary/10 p-2">
          <UserCircle className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Complete your profile</p>
          <p className="text-sm text-muted-foreground">
            Help trainers understand your goals by setting up your profile.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={routes.traineeProfileEdit}>
            <Button size="sm">Set Up Profile</Button>
          </Link>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
