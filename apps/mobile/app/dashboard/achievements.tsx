import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Award, Lock } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Card, CardContent, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const BadgeCard = ({ badge, earned }: { badge: any; earned: boolean }) => (
  <Card className={`flex-1 m-1 ${!earned ? 'opacity-40' : ''}`}>
    <CardContent className="py-4 px-3 items-center gap-2">
      <View className={`w-12 h-12 rounded-full items-center justify-center ${earned ? 'bg-teal/20' : 'bg-secondary'}`}>
        {earned ? (
          <Award size={24} color={colors.teal} />
        ) : (
          <Lock size={20} color={colors.mutedForeground} />
        )}
      </View>
      <Text className="text-xs font-semibold text-foreground text-center" numberOfLines={2}>
        {badge.name}
      </Text>
      {badge.description && (
        <Text className="text-[10px] text-muted-foreground text-center" numberOfLines={2}>
          {badge.description}
        </Text>
      )}
    </CardContent>
  </Card>
);

const AchievementsScreen = () => {
  const router = useRouter();
  const { data: allBadges, isLoading: allLoading, refetch: refetchAll } = trpc.badge.getAllBadgeDefinitions.useQuery();
  const { data: userBadges, isLoading: userLoading, refetch: refetchUser } = trpc.badge.getUserBadges.useQuery();

  const earnedIds = new Set((userBadges ?? []).map((b: any) => b.badgeDefinitionId ?? b.id));
  const badges = allBadges ?? [];
  const earnedCount = earnedIds.size;
  const isLoading = allLoading || userLoading;

  const onRefresh = async () => {
    await Promise.all([refetchAll(), refetchUser()]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Achievements</Text>
      </View>

      {/* Summary */}
      <View className="items-center py-4 gap-1">
        <Text className="text-3xl font-bold text-teal">{earnedCount}</Text>
        <Text className="text-sm text-muted-foreground">of {badges.length} badges earned</Text>
      </View>

      {isLoading ? (
        <View className="flex-row flex-wrap px-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} className="w-1/3 p-1">
              <Skeleton className="h-28 rounded-lg" />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={badges}
          keyExtractor={(item: any) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <BadgeCard badge={item} earned={earnedIds.has(item.id)} />
          )}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.teal} />}
        />
      )}
    </SafeAreaView>
  );
};

export default AchievementsScreen;
