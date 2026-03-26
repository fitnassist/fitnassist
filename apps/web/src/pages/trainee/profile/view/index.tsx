import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks';
import {
  Card,
  CardContent,
  SkeletonAvatar,
  SkeletonText,
  SkeletonCard,
} from '@/components/ui';
import { routes } from '@/config/routes';
import { trpc } from '@/lib/trpc';
import {
  TraineeProfileHeader,
  TraineeProfileBio,
  TraineeProfileBodyMetrics,
  TraineeProfileFitnessLevel,
  TraineeProfileGoals,
  TraineeProfileMedicalNotes,
} from '@/pages/trainee/components';

export const TraineeProfileViewPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { isTrainer } = useAuth();
  const backTo = isTrainer ? routes.dashboardClients : routes.dashboardContacts;
  const backLabel = isTrainer ? 'Back to Clients' : 'Back to Contacts';
  const { data: profile, isLoading, error } = trpc.trainee.getProfile.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <SkeletonAvatar className="h-16 w-16" />
          <div className="space-y-2">
            <SkeletonText className="w-40" />
            <SkeletonText className="w-60" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 space-y-4">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {error?.message || 'Profile not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <TraineeProfileHeader profile={profile} />
      <TraineeProfileBio profile={profile} />

      <div className="grid gap-6 md:grid-cols-2">
        <TraineeProfileBodyMetrics profile={profile} />
        <TraineeProfileFitnessLevel profile={profile} />
      </div>

      <TraineeProfileGoals profile={profile} />
      <TraineeProfileMedicalNotes profile={profile} />
    </div>
  );
};
