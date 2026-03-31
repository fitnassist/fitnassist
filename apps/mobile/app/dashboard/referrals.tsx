import { View, ScrollView, RefreshControl, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Copy, Share2, Users, CheckCircle, Clock, Gift } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Text, Button, Card, CardContent, Skeleton, Badge, useAlert } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const StatCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) => (
  <View className="flex-1 bg-card border border-border rounded-lg p-3 gap-1">
    <Icon size={16} color={colors.teal} />
    <Text className="text-xl font-bold text-foreground">{value}</Text>
    <Text className="text-xs text-muted-foreground">{label}</Text>
  </View>
);

const ReferralsScreen = () => {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.referral.getStats.useQuery();
  const { data: link } = trpc.referral.getReferralLink.useQuery();
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = trpc.referral.getHistory.useQuery({});

  const referralUrl = link?.url ?? '';

  const handleCopy = async () => {
    if (!referralUrl) return;
    await Clipboard.setStringAsync(referralUrl);
    showAlert({ title: 'Copied', message: 'Referral link copied to clipboard' });
  };

  const handleShare = async () => {
    if (!referralUrl) return;
    await Share.share({
      message: `Join me on Fitnassist! Sign up with my referral link: ${referralUrl}`,
      url: referralUrl,
    });
  };

  const onRefresh = async () => {
    await Promise.all([refetchStats(), refetchHistory()]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Referrals</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-4 pb-8"
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.teal} />}
      >
        {/* Stats */}
        {statsLoading ? (
          <Skeleton className="h-20 rounded-lg" />
        ) : (
          <View className="flex-row gap-2">
            <StatCard label="Total" value={stats?.total ?? 0} icon={Users} />
            <StatCard label="Activated" value={stats?.activated ?? 0} icon={CheckCircle} />
            <StatCard label="Pending" value={stats?.pending ?? 0} icon={Clock} />
            <StatCard label="Months Earned" value={stats?.monthsEarned ?? 0} icon={Gift} />
          </View>
        )}

        {/* Referral Link */}
        <Card>
          <CardContent className="py-4 px-4 gap-3">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
              Your Referral Link
            </Text>
            <View className="bg-secondary rounded-lg px-3 py-2">
              <Text className="text-xs text-foreground" numberOfLines={1}>{referralUrl || 'Loading...'}</Text>
            </View>
            <View className="flex-row gap-2">
              <Button size="sm" variant="outline" onPress={handleCopy} className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Copy size={14} color={colors.foreground} />
                  <Text className="text-sm font-semibold text-foreground">Copy</Text>
                </View>
              </Button>
              <Button size="sm" onPress={handleShare} className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Share2 size={14} color="#fff" />
                  <Text className="text-sm font-semibold text-white">Share</Text>
                </View>
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* History */}
        <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
          Referral History
        </Text>
        {historyLoading ? (
          <View className="gap-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </View>
        ) : (history?.items ?? []).length === 0 ? (
          <Text className="text-sm text-muted-foreground text-center py-6">No referrals yet. Share your link to get started!</Text>
        ) : (
          <View className="gap-2">
            {(history?.items ?? []).map((ref: any) => (
              <Card key={ref.id}>
                <CardContent className="py-3 px-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-medium text-foreground">{ref.referredUser?.name ?? ref.referredUser?.email ?? 'User'}</Text>
                    <Text className="text-xs text-muted-foreground">{new Date(ref.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Badge variant={ref.status === 'ACTIVATED' ? 'default' : 'secondary'}>
                    {ref.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReferralsScreen;
