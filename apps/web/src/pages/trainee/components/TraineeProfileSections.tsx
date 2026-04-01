import {
  MapPin,
  Ruler,
  Weight,
  Target,
  Dumbbell,
  Activity,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { formatHeight, formatWeight } from '@/lib/unitConversion';
import {
  FITNESS_GOALS,
  EXPERIENCE_LEVEL_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
  GENDER_OPTIONS,
} from '@fitnassist/schemas';
import type { FilteredTraineeProfile } from './trainee-profile.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getLabel = (options: readonly { value: string; label: string }[], value: string | null) =>
  options.find((o) => o.value === value)?.label ?? value;

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// ---------------------------------------------------------------------------
// Profile Header
// ---------------------------------------------------------------------------

interface ProfileHeaderProps {
  profile: FilteredTraineeProfile;
}

export const TraineeProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const userName = profile.userName;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={userName} />}
        <AvatarFallback className="text-lg">{getInitials(userName)}</AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-2xl font-bold">{userName}</h1>
        {profile.handle && <p className="text-sm text-muted-foreground">@{profile.handle}</p>}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {(profile.city || profile.location) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {profile.city || profile.location}
            </span>
          )}
          {profile.gender && <span>{getLabel(GENDER_OPTIONS, profile.gender)}</span>}
          {profile.dateOfBirth && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {Math.floor(
                (Date.now() - new Date(profile.dateOfBirth).getTime()) / 31557600000,
              )}{' '}
              years old
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bio
// ---------------------------------------------------------------------------

export const TraineeProfileBio = ({ profile }: { profile: FilteredTraineeProfile }) => {
  if (!profile.bio) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-light uppercase tracking-wider">
          About
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Body Metrics
// ---------------------------------------------------------------------------

export const TraineeProfileBodyMetrics = ({ profile }: { profile: FilteredTraineeProfile }) => {
  const unit = (profile.unitPreference as 'METRIC' | 'IMPERIAL') ?? 'METRIC';

  if (!profile.heightCm && !profile.startWeightKg && !profile.goalWeightKg) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
          <Ruler className="h-5 w-5" />
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
  );
};

// ---------------------------------------------------------------------------
// Fitness Level
// ---------------------------------------------------------------------------

export const TraineeProfileFitnessLevel = ({ profile }: { profile: FilteredTraineeProfile }) => {
  if (!profile.experienceLevel && !profile.activityLevel) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
          <Dumbbell className="h-5 w-5" />
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
  );
};

// ---------------------------------------------------------------------------
// Fitness Goals
// ---------------------------------------------------------------------------

export const TraineeProfileGoals = ({ profile }: { profile: FilteredTraineeProfile }) => {
  if (profile.fitnessGoals.length === 0 && !profile.fitnessGoalNotes) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-light uppercase tracking-wider">
          Fitness Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile.fitnessGoals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.fitnessGoals.map((goal) => (
              <Badge key={goal} variant="secondary">
                {FITNESS_GOALS.find((g) => g.value === goal)?.label ?? goal}
              </Badge>
            ))}
          </div>
        )}
        {profile.fitnessGoalNotes && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {profile.fitnessGoalNotes}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Medical Notes
// ---------------------------------------------------------------------------

export const TraineeProfileMedicalNotes = ({ profile }: { profile: FilteredTraineeProfile }) => {
  if (!profile.medicalNotes) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
          <AlertTriangle className="h-5 w-5" />
          Medical Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{profile.medicalNotes}</p>
      </CardContent>
    </Card>
  );
};
