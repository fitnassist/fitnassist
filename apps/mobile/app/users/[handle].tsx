import { View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, MapPin, Lock, UserPlus, UserCheck, Clock,
  Award, Flame, Dumbbell, Utensils, Heart, Users,
  Target, Compass, Footprints, Droplets, Moon, Smile, Camera, Star, Trophy, Zap,
  BarChart3, Ruler, Activity,
} from 'lucide-react-native';
import { Text, Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { useTraineeByHandle, usePublicProfileData } from '@/api/trainee';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';
import {
  FITNESS_GOALS,
  EXPERIENCE_LEVEL_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
} from '@fitnassist/schemas/src/constants/trainee.constants';

const ICON_MAP: Record<string, any> = {
  Flame, Dumbbell, Utensils, Heart, Users, Target, Compass,
  Footprints, Droplets, Moon, Smile, Camera, Award, Star, Trophy, Zap,
};

const TIER_COLORS = {
  BRONZE: '#b45309',
  SILVER: '#64748b',
  GOLD: '#ca8a04',
};

const formatHeight = (cm: number, unit: 'METRIC' | 'IMPERIAL') => {
  if (unit === 'IMPERIAL') {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
};

const formatWeight = (kg: number, unit: 'METRIC' | 'IMPERIAL') => {
  if (unit === 'IMPERIAL') return `${Math.round(kg / 0.453592 * 10) / 10} lbs`;
  return `${Math.round(kg * 10) / 10} kg`;
};

const getLabel = (options: readonly { value: string; label: string }[], value: string | null) =>
  options.find((o) => o.value === value)?.label ?? value;

const SectionTitle = ({ label }: { label: string }) => (
  <Text className="text-sm font-medium text-primary uppercase mb-3" style={{ letterSpacing: 1 }}>
    {label}
  </Text>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row justify-between py-2 border-b border-border">
    <Text className="text-sm text-muted-foreground">{label}</Text>
    <Text className="text-sm font-medium text-foreground">{value}</Text>
  </View>
);

const TraineeProfileScreen = () => {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const { user, role } = useAuth();
  const isTrainee = role === 'TRAINEE';

  const { data: profile, isLoading, isError } = useTraineeByHandle(handle ?? '');
  const { data: profileData } = usePublicProfileData(handle ?? '');

  const { data: friendStatus } = trpc.friendship.getStatus.useQuery(
    { targetId: (profile as any)?.userId ?? '' },
    { enabled: !!((profile as any)?.userId) && isTrainee && user?.id !== (profile as any)?.userId },
  );

  const utils = trpc.useUtils();
  const sendRequest = trpc.friendship.sendRequest.useMutation({
    onSuccess: () => utils.friendship.getStatus.invalidate(),
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View className="px-4 gap-4 pt-6">
          <View className="items-center gap-3">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </View>
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">Profile</Text>
        </View>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Users size={48} color={colors.mutedForeground} />
          <Text className="text-lg font-light text-foreground uppercase" style={{ letterSpacing: 1 }}>Profile Not Found</Text>
          <Text className="text-sm text-muted-foreground text-center">This profile doesn't exist or isn't available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const p = profile as any;
  const pd = profileData as any;

  const unitPreference: 'METRIC' | 'IMPERIAL' = p.unitPreference ?? 'METRIC';
  const isSelf = user?.id === p.userId;
  const isConnectedPT = pd?.viewerRelationship === 'PT';

  // Determine if there's any content to show (privacy check)
  const hasContent = !!(
    p.bio || p.city ||
    pd?.goals?.length ||
    pd?.personalBests?.length ||
    pd?.stats ||
    pd?.showcaseBadges?.length ||
    p.heightCm || p.startWeightKg || p.goalWeightKg ||
    p.experienceLevel || p.activityLevel ||
    p.fitnessGoals?.length || p.fitnessGoalNotes
  );

  const friendState = (friendStatus as any)?.status;

  const renderFriendButton = () => {
    if (!isTrainee || isSelf) return null;
    if (friendState === 'ACCEPTED') {
      return (
        <View className="flex-row items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card">
          <UserCheck size={14} color={colors.teal} />
          <Text className="text-xs font-medium text-teal">Friends</Text>
        </View>
      );
    }
    if (friendState === 'PENDING') {
      return (
        <View className="flex-row items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card">
          <Clock size={14} color={colors.mutedForeground} />
          <Text className="text-xs font-medium text-muted-foreground">Request Sent</Text>
        </View>
      );
    }
    if (friendState === 'BLOCKED') return null;
    return (
      <TouchableOpacity
        className="flex-row items-center gap-1.5 px-4 py-2 rounded-full bg-primary"
        onPress={() => sendRequest.mutate({ addresseeId: p.userId })}
        disabled={sendRequest.isPending}
      >
        <UserPlus size={14} color="#fff" />
        <Text className="text-xs font-semibold text-white">Add Friend</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground flex-1">{p.userName ?? handle}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="items-center px-4 pt-6 pb-4 gap-2">
          {p.avatarUrl ? (
            <Image source={{ uri: p.avatarUrl }} className="w-24 h-24 rounded-full" />
          ) : (
            <View className="w-24 h-24 rounded-full bg-secondary items-center justify-center">
              <Text className="text-3xl font-semibold text-foreground">{(p.userName ?? handle)?.charAt(0)?.toUpperCase()}</Text>
            </View>
          )}
          <Text className="text-xl font-semibold text-foreground">{p.userName}</Text>
          {p.handle && <Text className="text-sm text-muted-foreground">@{p.handle}</Text>}
          {p.city && (
            <View className="flex-row items-center gap-1">
              <MapPin size={12} color={colors.mutedForeground} />
              <Text className="text-xs text-muted-foreground">{p.city}</Text>
            </View>
          )}
          {p.bio && (
            <Text className="text-sm text-muted-foreground text-center mt-1 px-4">{p.bio}</Text>
          )}
          <View className="mt-2">{renderFriendButton()}</View>
        </View>

        {/* Private profile notice */}
        {!hasContent && (
          <View className="items-center px-6 py-12 gap-3">
            <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center">
              <Lock size={28} color={colors.mutedForeground} />
            </View>
            <Text className="text-base font-medium text-foreground">This profile is private</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Follow or connect with {p.userName} to see their profile.
            </Text>
          </View>
        )}

        {hasContent && (
          <View className="px-4 gap-5">
            {/* Stats */}
            {pd?.stats && (
              <View>
                <SectionTitle label="Stats" />
                <View className="flex-row gap-3">
                  {[
                    { label: 'Active Goals', value: pd.stats.activeGoals },
                    { label: 'Completed', value: pd.stats.completedGoals },
                    { label: 'Personal Bests', value: pd.stats.totalPBs },
                    { label: 'Total Goals', value: pd.stats.totalGoals },
                  ].map(({ label, value }) => (
                    <View key={label} className="flex-1 bg-card border border-border rounded-lg p-3 items-center gap-1">
                      <Text className="text-xl font-semibold text-foreground">{value}</Text>
                      <Text className="text-[10px] text-muted-foreground text-center">{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Goals */}
            {(pd?.goals?.length ?? 0) > 0 && (
              <View>
                <SectionTitle label="Goals" />
                {pd.goals.slice(0, 3).map((goal: any) => (
                  <View key={goal.id} className="bg-card border border-border rounded-lg p-3 mb-2">
                    <Text className="text-sm font-medium text-foreground">{goal.title}</Text>
                    {goal.description && (
                      <Text className="text-xs text-muted-foreground mt-0.5">{goal.description}</Text>
                    )}
                    {goal.targetDate && (
                      <Text className="text-xs text-teal mt-1">
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Showcase Badges */}
            {(pd?.showcaseBadges?.length ?? 0) > 0 && (
              <View>
                <SectionTitle label="Badges" />
                <View className="flex-row flex-wrap gap-2">
                  {pd.showcaseBadges.map((badge: any) => {
                    const Icon = ICON_MAP[badge.icon] ?? Award;
                    const tierColor = TIER_COLORS[badge.tier as keyof typeof TIER_COLORS] ?? TIER_COLORS.BRONZE;
                    return (
                      <View key={badge.id} className="items-center gap-1 w-16">
                        <View
                          className="w-14 h-14 rounded-full items-center justify-center"
                          style={{ backgroundColor: tierColor + '25' }}
                        >
                          <Icon size={24} color={tierColor} />
                        </View>
                        <Text className="text-[10px] text-muted-foreground text-center leading-tight">{badge.name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Personal Bests */}
            {(pd?.personalBests?.length ?? 0) > 0 && (
              <View>
                <SectionTitle label="Personal Bests" />
                {pd.personalBests.map((pb: any) => (
                  <View key={pb.id} className="flex-row justify-between py-2 border-b border-border">
                    <Text className="text-sm text-muted-foreground">{pb.exerciseName}</Text>
                    <Text className="text-sm font-medium text-foreground">
                      {pb.weightKg ? `${pb.weightKg} kg` : ''}{pb.reps ? ` × ${pb.reps}` : ''}{pb.distanceKm ? `${pb.distanceKm} km` : ''}{pb.durationSeconds ? ` ${Math.round(pb.durationSeconds / 60)} min` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Body Metrics */}
            {(p.heightCm || p.startWeightKg || p.goalWeightKg) && (
              <View>
                <SectionTitle label="Body Metrics" />
                <Card>
                  <CardContent className="py-3 px-4">
                    {p.heightCm && <Row label="Height" value={formatHeight(p.heightCm, unitPreference)} />}
                    {p.startWeightKg && <Row label="Start Weight" value={formatWeight(p.startWeightKg, unitPreference)} />}
                    {p.goalWeightKg && <Row label="Goal Weight" value={formatWeight(p.goalWeightKg, unitPreference)} />}
                  </CardContent>
                </Card>
              </View>
            )}

            {/* Fitness Level */}
            {(p.experienceLevel || p.activityLevel) && (
              <View>
                <SectionTitle label="Fitness Level" />
                <Card>
                  <CardContent className="py-3 px-4">
                    {p.experienceLevel && <Row label="Experience" value={getLabel(EXPERIENCE_LEVEL_OPTIONS, p.experienceLevel) ?? ''} />}
                    {p.activityLevel && <Row label="Activity Level" value={getLabel(ACTIVITY_LEVEL_OPTIONS, p.activityLevel) ?? ''} />}
                  </CardContent>
                </Card>
              </View>
            )}

            {/* Fitness Goals */}
            {((p.fitnessGoals?.length ?? 0) > 0 || p.fitnessGoalNotes) && (
              <View>
                <SectionTitle label="Fitness Goals" />
                {(p.fitnessGoals?.length ?? 0) > 0 && (
                  <View className="flex-row flex-wrap gap-2 mb-2">
                    {p.fitnessGoals.map((goal: string) => (
                      <View key={goal} className="bg-secondary rounded-full px-3 py-1">
                        <Text className="text-xs text-foreground">
                          {FITNESS_GOALS.find((g) => g.value === goal)?.label ?? goal}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {p.fitnessGoalNotes && (
                  <Text className="text-sm text-muted-foreground">{p.fitnessGoalNotes}</Text>
                )}
              </View>
            )}

            {/* Medical Notes - PT only */}
            {p.medicalNotes && isConnectedPT && (
              <View>
                <SectionTitle label="Medical Notes" />
                <Card>
                  <CardContent className="py-3 px-4">
                    <Text className="text-sm text-foreground">{p.medicalNotes}</Text>
                  </CardContent>
                </Card>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TraineeProfileScreen;
