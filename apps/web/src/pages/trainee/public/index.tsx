import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2, UserX, ArrowLeft, TrendingUp, ChevronLeft, ChevronRight,
  Target, Ruler, Dumbbell, Activity, Weight, BarChart3,
} from 'lucide-react';
import { subDays, format } from 'date-fns';
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useTraineeByHandle, usePublicProfileData } from '@/api/trainee';
import { routes } from '@/config/routes';
import { formatHeight, formatWeight } from '@/lib/unitConversion';
import {
  FITNESS_GOALS,
  EXPERIENCE_LEVEL_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
} from '@fitnassist/schemas';
import { GoalCard } from '@/pages/dashboard/goals/components';
import { PersonalBests } from '@/pages/dashboard/diary/components/PersonalBests';
import { ProgressPhotos } from '@/pages/dashboard/diary/components/ProgressPhotos';
import { WeightChart } from '@/pages/dashboard/diary/components/Trends/WeightChart';
import { MeasurementChart } from '@/pages/dashboard/diary/components/Trends/MeasurementChart';
import { NutritionChart } from '@/pages/dashboard/diary/components/Trends/NutritionChart';
import { WaterChart } from '@/pages/dashboard/diary/components/Trends/WaterChart';
import { MoodChart } from '@/pages/dashboard/diary/components/Trends/MoodChart';
import { SleepChart } from '@/pages/dashboard/diary/components/Trends/SleepChart';
import { ActivityChart } from '@/pages/dashboard/diary/components/Trends/ActivityChart';
import { StepsChart } from '@/pages/dashboard/diary/components/Trends/StepsChart';
import { ChartTabBar } from '@/pages/dashboard/diary/components/Trends/ChartTabBar';
import { TrendDateRange } from '@/pages/dashboard/diary/components/Trends/TrendDateRange';
import { ProfileHeader } from './components';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TITLE_CLASS = 'flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider';
const ICON_CLASS = 'h-5 w-5';

type ChartType = 'weight' | 'measurements' | 'nutrition' | 'water' | 'mood' | 'sleep' | 'activity' | 'steps';

const CHART_TABS: Array<{ key: ChartType; label: string }> = [
  { key: 'weight', label: 'Weight' },
  { key: 'measurements', label: 'Measurements' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'water', label: 'Water' },
  { key: 'activity', label: 'Activity' },
  { key: 'steps', label: 'Steps' },
  { key: 'mood', label: 'Mood' },
  { key: 'sleep', label: 'Sleep' },
];

const getLabel = (options: readonly { value: string; label: string }[], value: string | null) =>
  options.find((o) => o.value === value)?.label ?? value;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const TraineePublicProfilePage = () => {
  const { handle } = useParams<{ handle: string }>();
  const { data: profile, isLoading, isError } = useTraineeByHandle(handle || '');
  const { data: profileData } = usePublicProfileData(handle || '');

  const [days, setDays] = useState(30);
  const [activeChart, setActiveChart] = useState<ChartType>('weight');
  const [goalIndex, setGoalIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <UserX className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-light uppercase tracking-wider">Profile Not Found</h1>
        <p className="text-sm text-muted-foreground">
          This profile doesn&apos;t exist or isn&apos;t available.
        </p>
        <Button variant="outline" asChild>
          <Link to={routes.home}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  const unitPreference = (profile.unitPreference as 'METRIC' | 'IMPERIAL') ?? 'METRIC';

  // Map progress photos to the shape ProgressPhotos expects
  const progressPhotoEntries = profileData?.progressPhotos && profileData.progressPhotos.length > 0
    ? [{
        id: 'public-photos',
        progressPhotos: profileData.progressPhotos.map((p) => ({
          id: p.id,
          imageUrl: p.imageUrl,
          category: p.category ?? null,
          notes: null,
        })),
      }]
    : [];

  // Diary entries for trends
  const allEntries = profileData?.diaryEntries ?? [];
  const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd');
  const entries = allEntries.filter((e) => {
    const d = typeof e.date === 'string' ? e.date : new Date(e.date).toISOString().slice(0, 10);
    return d >= cutoff;
  });

  // Extract chart data from diary entries
  const weightData = entries
    .filter(e => e.type === 'WEIGHT' && e.weightEntry)
    .map(e => ({ date: e.date as unknown as string, weightKg: e.weightEntry!.weightKg }));
  const measurementData = entries
    .filter(e => e.type === 'MEASUREMENT' && e.measurementEntry)
    .map(e => ({ date: e.date as unknown as string, ...e.measurementEntry! }));
  const nutritionData = entries
    .filter(e => e.type === 'FOOD' && e.foodEntries && e.foodEntries.length > 0)
    .map(e => {
      const foods = e.foodEntries ?? [];
      return {
        date: e.date as unknown as string,
        calories: foods.reduce((sum, f) => sum + f.calories, 0),
        protein: foods.reduce((sum, f) => sum + (f.proteinG ?? 0), 0),
        carbs: foods.reduce((sum, f) => sum + (f.carbsG ?? 0), 0),
        fat: foods.reduce((sum, f) => sum + (f.fatG ?? 0), 0),
      };
    });
  const waterData = entries
    .filter(e => e.type === 'WATER' && e.waterEntry)
    .map(e => ({ date: e.date as unknown as string, totalMl: e.waterEntry!.totalMl }));
  const moodData = entries
    .filter(e => e.type === 'MOOD' && e.moodEntry)
    .map(e => ({ date: e.date as unknown as string, level: e.moodEntry!.level }));
  const sleepData = entries
    .filter(e => e.type === 'SLEEP' && e.sleepEntry)
    .map(e => ({ date: e.date as unknown as string, hoursSlept: e.sleepEntry!.hoursSlept, quality: e.sleepEntry!.quality }));
  const activityData = entries
    .filter(e => e.type === 'ACTIVITY' && e.activityEntry)
    .map(e => ({
      date: e.date as unknown as string,
      activityType: e.activityEntry!.activityType,
      distanceKm: e.activityEntry!.distanceKm,
      durationSeconds: e.activityEntry!.durationSeconds,
    }));
  const stepsData = entries
    .filter(e => e.type === 'STEPS' && e.stepsEntry)
    .map(e => ({ date: e.date as unknown as string, totalSteps: e.stepsEntry!.totalSteps }));

  const goals = profileData?.goals ?? [];
  const currentGoal = goals[goalIndex];
  const stats = profileData?.stats;
  const hasBodyMetrics = profile.heightCm || profile.startWeightKg || profile.goalWeightKg;
  const hasFitnessLevel = profile.experienceLevel || profile.activityLevel;
  const hasFitnessGoals = (profile.fitnessGoals?.length ?? 0) > 0 || profile.fitnessGoalNotes;
  const hasPhotos = progressPhotoEntries.length > 0 && (progressPhotoEntries[0]?.progressPhotos?.length ?? 0) > 0;

  return (
    <div className="min-h-screen">
      <ProfileHeader
        userName={profile.userName}
        handle={profile.handle}
        avatarUrl={profile.avatarUrl}
        bio={profile.bio}
        city={profile.city}
        experienceLevel={profile.experienceLevel}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Goals carousel */}
            {goals.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={TITLE_CLASS}>
                      <Target className={ICON_CLASS} />
                      Goals
                    </CardTitle>
                    {goals.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {goalIndex + 1} / {goals.length}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setGoalIndex((goalIndex - 1 + goals.length) % goals.length)}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setGoalIndex((goalIndex + 1) % goals.length)}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {currentGoal && <GoalCard goal={currentGoal} readOnly compact />}
                </CardContent>
              </Card>
            )}

            {/* Personal Bests */}
            {profileData?.personalBests && profileData.personalBests.length > 0 && (
              <PersonalBests data={profileData.personalBests} variant="profile" />
            )}

            {/* Trends */}
            {allEntries.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className={TITLE_CLASS}>
                      <TrendingUp className={ICON_CLASS} />
                      Trends
                    </CardTitle>
                    <TrendDateRange selectedDays={days} onChange={setDays} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartTabBar tabs={CHART_TABS} activeTab={activeChart} onTabChange={setActiveChart} />
                  {activeChart === 'weight' && <WeightChart data={weightData} goalWeight={profile.goalWeightKg} unitPreference={unitPreference} />}
                  {activeChart === 'measurements' && <MeasurementChart data={measurementData} unitPreference={unitPreference} />}
                  {activeChart === 'nutrition' && <NutritionChart data={nutritionData} />}
                  {activeChart === 'water' && <WaterChart data={waterData} />}
                  {activeChart === 'mood' && <MoodChart data={moodData} />}
                  {activeChart === 'sleep' && <SleepChart data={sleepData} />}
                  {activeChart === 'activity' && <ActivityChart data={activityData} />}
                  {activeChart === 'steps' && <StepsChart data={stepsData} />}
                </CardContent>
              </Card>
            )}

            {/* Progress Photos */}
            {hasPhotos && (
              <ProgressPhotos
                date=""
                entries={progressPhotoEntries}
                readOnly
                variant="profile"
              />
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            {/* Stats */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className={TITLE_CLASS}>
                    <BarChart3 className={ICON_CLASS} />
                    Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center rounded-lg bg-muted/50 p-3">
                      <p className="text-2xl font-semibold">{stats.activeGoals}</p>
                      <p className="text-xs text-muted-foreground">Active Goals</p>
                    </div>
                    <div className="text-center rounded-lg bg-muted/50 p-3">
                      <p className="text-2xl font-semibold">{stats.completedGoals}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center rounded-lg bg-muted/50 p-3">
                      <p className="text-2xl font-semibold">{stats.totalPBs}</p>
                      <p className="text-xs text-muted-foreground">Personal Bests</p>
                    </div>
                    <div className="text-center rounded-lg bg-muted/50 p-3">
                      <p className="text-2xl font-semibold">{stats.totalGoals}</p>
                      <p className="text-xs text-muted-foreground">Total Goals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Body Metrics */}
            {hasBodyMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle className={TITLE_CLASS}>
                    <Ruler className={ICON_CLASS} />
                    Body Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.heightCm && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Height</span>
                      <span className="font-medium">{formatHeight(profile.heightCm, unitPreference)}</span>
                    </div>
                  )}
                  {profile.startWeightKg && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Weight className="h-3.5 w-3.5" />
                        Start Weight
                      </span>
                      <span className="font-medium">{formatWeight(profile.startWeightKg, unitPreference)}</span>
                    </div>
                  )}
                  {profile.goalWeightKg && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        Goal Weight
                      </span>
                      <span className="font-medium">{formatWeight(profile.goalWeightKg, unitPreference)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Fitness Level */}
            {hasFitnessLevel && (
              <Card>
                <CardHeader>
                  <CardTitle className={TITLE_CLASS}>
                    <Dumbbell className={ICON_CLASS} />
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

            {/* Fitness Goals */}
            {hasFitnessGoals && (
              <Card>
                <CardHeader>
                  <CardTitle className={TITLE_CLASS}>
                    Fitness Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(profile.fitnessGoals?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.fitnessGoals.map((goal: string) => (
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
            )}

            {/* Medical Notes */}
            {profile.medicalNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className={TITLE_CLASS}>
                    Medical Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{profile.medicalNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraineePublicProfilePage;
