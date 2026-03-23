import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Ruler, Weight, Target, Dumbbell, Activity, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SkeletonAvatar,
  SkeletonText,
  SkeletonCard,
} from '@/components/ui';
import { routes } from '@/config/routes';
import { trpc } from '@/lib/trpc';
import { formatHeight, formatWeight } from '@/lib/unitConversion';
import {
  FITNESS_GOALS,
  EXPERIENCE_LEVEL_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
  GENDER_OPTIONS,
} from '@fitnassist/schemas';

const getLabel = (options: readonly { value: string; label: string }[], value: string | null) =>
  options.find((o) => o.value === value)?.label ?? value;

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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

  const unit = profile.unitPreference;
  const userName = profile.user.name;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {profile.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt={userName} />
          )}
          <AvatarFallback className="text-lg">{getInitials(userName)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{userName}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
            {profile.gender && (
              <span>{getLabel(GENDER_OPTIONS, profile.gender)}</span>
            )}
            {profile.dateOfBirth && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / 31557600000)} years old
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Body Metrics */}
        {(profile.heightCm || profile.startWeightKg || profile.goalWeightKg) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Body Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.heightCm && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Height</span>
                  <span className="font-medium">{formatHeight(profile.heightCm, unit)}</span>
                </div>
              )}
              {profile.startWeightKg && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Weight className="h-3.5 w-3.5" />
                    Start Weight
                  </span>
                  <span className="font-medium">{formatWeight(profile.startWeightKg, unit)}</span>
                </div>
              )}
              {profile.goalWeightKg && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    Goal Weight
                  </span>
                  <span className="font-medium">{formatWeight(profile.goalWeightKg, unit)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fitness Info */}
        {(profile.experienceLevel || profile.activityLevel) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Fitness Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.experienceLevel && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium">
                    {getLabel(EXPERIENCE_LEVEL_OPTIONS, profile.experienceLevel)}
                  </span>
                </div>
              )}
              {profile.activityLevel && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    Activity Level
                  </span>
                  <span className="font-medium">
                    {getLabel(ACTIVITY_LEVEL_OPTIONS, profile.activityLevel)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fitness Goals */}
      {profile.fitnessGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fitness Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {profile.fitnessGoals.map((goal) => (
                <span
                  key={goal}
                  className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-muted"
                >
                  {FITNESS_GOALS.find((g) => g.value === goal)?.label ?? goal}
                </span>
              ))}
            </div>
            {profile.fitnessGoalNotes && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {profile.fitnessGoalNotes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Medical Notes */}
      {profile.medicalNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medical Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{profile.medicalNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
