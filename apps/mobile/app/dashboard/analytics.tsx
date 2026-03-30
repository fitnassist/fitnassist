import { View, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, Calendar, Users, CheckCircle, TrendingUp } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Card, CardContent, Skeleton } from '@/components/ui';
import { useDashboardStats } from '@/api/trainer';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const StatCard = ({ label, value, icon: Icon, iconColor }: { label: string; value: string | number; icon: any; iconColor?: string }) => (
  <View className="flex-1 bg-card border border-border rounded-lg p-3 gap-1">
    <Icon size={16} color={iconColor ?? colors.teal} />
    <Text className="text-xl font-bold text-foreground">{value}</Text>
    <Text className="text-xs text-muted-foreground">{label}</Text>
  </View>
);

const AnalyticsScreen = () => {
  const router = useRouter();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: viewTrend, isLoading: viewsLoading, refetch: refetchViews } = trpc.analytics.profileViewTrend.useQuery(undefined, {
    retry: false,
  });
  const { data: bookingData, refetch: refetchBookings } = trpc.analytics.bookingAnalytics.useQuery(undefined, {
    retry: false,
  });

  const onRefresh = async () => {
    await Promise.all([refetchStats(), refetchViews(), refetchBookings()]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Analytics</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-4 pb-8"
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.teal} />}
      >
        {/* Summary Stats */}
        {statsLoading ? (
          <View className="flex-row gap-2">
            <Skeleton className="flex-1 h-20 rounded-lg" />
            <Skeleton className="flex-1 h-20 rounded-lg" />
          </View>
        ) : (
          <>
            <View className="flex-row gap-2">
              <StatCard label="Views (30d)" value={stats?.profileViews30d ?? 0} icon={Eye} />
              <StatCard label="Bookings (30d)" value={stats?.bookings30d ?? 0} icon={Calendar} />
            </View>
            <View className="flex-row gap-2">
              <StatCard label="Active Clients" value={stats?.activeClients ?? 0} icon={Users} />
              <StatCard label="Completion" value={`${stats?.completionRate ?? 0}%`} icon={CheckCircle} />
            </View>
          </>
        )}

        {/* Profile Views Trend */}
        <Card>
          <CardContent className="py-4 px-4 gap-3">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
              Profile Views (30 days)
            </Text>
            {viewsLoading ? (
              <Skeleton className="h-32 rounded-lg" />
            ) : viewTrend && viewTrend.length > 0 ? (
              <View className="gap-1">
                {/* Simple bar chart */}
                <View className="flex-row items-end h-24 gap-0.5">
                  {viewTrend.map((point: any, i: number) => {
                    const max = Math.max(...viewTrend.map((p: any) => p.views ?? p.count ?? 0), 1);
                    const val = point.views ?? point.count ?? 0;
                    const height = (val / max) * 100;
                    return (
                      <View
                        key={i}
                        className="flex-1 bg-teal rounded-t"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                    );
                  })}
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-[10px] text-muted-foreground">30d ago</Text>
                  <Text className="text-[10px] text-muted-foreground">Today</Text>
                </View>
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground text-center py-4">No view data available</Text>
            )}
          </CardContent>
        </Card>

        {/* Booking Analytics */}
        <Card>
          <CardContent className="py-4 px-4 gap-3">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
              Booking Trends (12 weeks)
            </Text>
            {bookingData ? (
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <View className="items-center">
                    <Text className="text-lg font-bold text-foreground">{bookingData.totalBookings ?? 0}</Text>
                    <Text className="text-xs text-muted-foreground">Total</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-bold text-foreground">{bookingData.avgPerWeek?.toFixed(1) ?? '0'}</Text>
                    <Text className="text-xs text-muted-foreground">Avg/Week</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-bold text-teal">{bookingData.completionRate ?? 0}%</Text>
                    <Text className="text-xs text-muted-foreground">Completion</Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground text-center py-4">No booking data available</Text>
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;
