import { View, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Eye,
  Users,
  Calendar,
  CheckCircle,
  UserPen,
  ExternalLink,
  Inbox,
  MessageCircle,
  Scale,
  Droplets,
  Utensils,
  Smile,
  Moon,
  Dumbbell,
  Footprints,
  Activity,
  Camera,
  Ruler,
  Trophy,
} from 'lucide-react-native';
import { Text, Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { useMyTrainerProfile, useDashboardStats } from '@/api/trainer';
import { useContactStats } from '@/api/connection';
import { useRecentClientActivity } from '@/api/diary';
import { useUnreadMessageCount } from '@/api/message';
import { StatCard } from './StatCard';
import { QuickAction } from './QuickAction';
import { colors } from '@/constants/theme';

export const TrainerDashboard = () => {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useMyTrainerProfile();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: contactStats, refetch: refetchContacts } = useContactStats();
  const { data: unreadCount } = useUnreadMessageCount();
  const { data: recentActivity } = useRecentClientActivity();

  const onRefresh = async () => {
    await Promise.all([refetchProfile(), refetchStats(), refetchContacts()]);
  };

  const isLoading = profileLoading || statsLoading;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-8"
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.teal} />
      }
    >
      {/* Profile Card */}
      <View className="px-4 mb-6">
        {profileLoading ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : profile ? (
          <Card>
            <CardContent className="py-4 px-4">
              <View className="flex-row items-center gap-3">
                {profile.profileImageUrl ? (
                  <Image
                    source={{ uri: profile.profileImageUrl }}
                    className="w-14 h-14 rounded-full"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-full bg-primary items-center justify-center">
                    <Text className="text-lg font-bold text-white">
                      {profile.displayName?.charAt(0) ?? '?'}
                    </Text>
                  </View>
                )}
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-semibold text-foreground">
                      {profile.displayName}
                    </Text>
                    <Badge variant={profile.isPublished ? 'default' : 'secondary'}>
                      {profile.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </View>
                  <Text className="text-xs text-muted-foreground">
                    fitnassist.co/trainers/{profile.handle}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-6 px-4 items-center gap-2">
              <Text className="text-sm text-muted-foreground text-center">
                Set up your trainer profile to start getting discovered
              </Text>
              <TouchableOpacity
                className="bg-primary rounded-lg px-4 py-2 mt-2"
                onPress={() => router.push('/dashboard/onboarding')}
              >
                <Text className="text-sm font-semibold text-white">Create Profile</Text>
              </TouchableOpacity>
            </CardContent>
          </Card>
        )}
      </View>

      {/* Stats Row */}
      <View className="px-4 mb-6">
        {statsLoading ? (
          <View className="flex-row gap-2">
            <Skeleton className="flex-1 h-20 rounded-lg" />
            <Skeleton className="flex-1 h-20 rounded-lg" />
          </View>
        ) : (
          <View className="gap-2">
            <View className="flex-row gap-2">
              <StatCard
                label="Views (30d)"
                value={stats?.profileViews30d ?? 0}
                icon={Eye}
              />
              <StatCard
                label="Active Clients"
                value={stats?.activeClients ?? 0}
                icon={Users}
              />
            </View>
            <View className="flex-row gap-2">
              <StatCard
                label="Bookings (30d)"
                value={stats?.bookings30d ?? 0}
                icon={Calendar}
              />
              <StatCard
                label="Completion"
                value={`${stats?.completionRate ?? 0}%`}
                icon={CheckCircle}
              />
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View className="px-4 gap-2">
        <Text className="text-sm font-medium text-teal uppercase mb-1" style={{ letterSpacing: 1 }}>
          Quick Actions
        </Text>
        <View className="flex-row gap-2">
          <QuickAction
            label="Edit Profile"
            description="Update bio, services, photos"
            icon={UserPen}
            onPress={() => router.push('/dashboard/profile/edit')}
          />
          <QuickAction
            label="View Profile"
            description="See your public profile"
            icon={ExternalLink}
            onPress={() => profile?.handle && router.push(`/trainers/${profile.handle}`)}
          />
        </View>
        <View className="flex-row gap-2">
          <QuickAction
            label="Requests"
            description="Connection & callback requests"
            icon={Inbox}
            onPress={() => router.push('/dashboard/requests')}
            badge={contactStats?.connections?.last7Days ?? 0}
          />
          <QuickAction
            label="Messages"
            description="Chat with your trainees"
            icon={MessageCircle}
            onPress={() => router.push('/(tabs)/messages')}
            badge={unreadCount?.count ?? 0}
          />
        </View>
      </View>

      {/* Client Activity Feed */}
      {recentActivity && (recentActivity as any[]).length > 0 && (
        <View className="px-4 mt-4 gap-2">
          <Text className="text-sm font-medium text-teal uppercase mb-1" style={{ letterSpacing: 1 }}>
            Recent Client Activity
          </Text>
          {(recentActivity as any[]).slice(0, 10).map((entry: any) => {
            const typeIcons: Record<string, { icon: any; color: string }> = {
              WEIGHT: { icon: Scale, color: '#10b981' },
              WATER: { icon: Droplets, color: '#3b82f6' },
              FOOD: { icon: Utensils, color: '#f97316' },
              MOOD: { icon: Smile, color: '#f59e0b' },
              SLEEP: { icon: Moon, color: '#6366f1' },
              WORKOUT_LOG: { icon: Dumbbell, color: '#8b5cf6' },
              STEPS: { icon: Footprints, color: '#22c55e' },
              ACTIVITY: { icon: Activity, color: '#ec4899' },
              MEASUREMENT: { icon: Ruler, color: '#f97316' },
              PROGRESS_PHOTO: { icon: Camera, color: '#ec4899' },
              GOAL_COMPLETED: { icon: Trophy, color: colors.teal },
            };
            const typeInfo = typeIcons[entry.type] ?? { icon: Eye, color: colors.mutedForeground };
            const Icon = typeInfo.icon;
            return (
              <View key={entry.id} className="flex-row items-center gap-3 py-2">
                <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: typeInfo.color + '20' }}>
                  <Icon size={16} color={typeInfo.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{entry.user?.name ?? 'Client'}</Text>
                  <Text className="text-xs text-muted-foreground">
                    Logged {entry.type?.replace(/_/g, ' ').toLowerCase() ?? 'activity'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};
