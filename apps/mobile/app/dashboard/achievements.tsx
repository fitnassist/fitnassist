import { useState } from 'react';
import { View, FlatList, RefreshControl, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Award, Lock, Flame, Dumbbell, Utensils, Heart, Users,
  Target, Compass, Footprints, Droplets, Moon, Smile, Camera, Star, Trophy, Zap, Check,
} from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Card, CardContent, Skeleton, useAlert } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const ICON_MAP: Record<string, any> = {
  Flame, Dumbbell, Utensils, Heart, Users, Target, Compass,
  Footprints, Droplets, Moon, Smile, Camera, Award, Star, Trophy, Zap,
};

const TIER_COLORS = {
  BRONZE: { bg: 'rgba(180,83,9,0.15)', icon: '#b45309' },
  SILVER: { bg: 'rgba(100,116,139,0.15)', icon: '#64748b' },
  GOLD: { bg: 'rgba(202,138,4,0.15)', icon: '#ca8a04' },
};

const BadgeCard = ({ badge, earned, earnedAt }: { badge: any; earned: boolean; earnedAt?: string }) => {
  const Icon = ICON_MAP[badge.icon] ?? Award;
  const tier = TIER_COLORS[badge.tier as keyof typeof TIER_COLORS] ?? TIER_COLORS.BRONZE;

  return (
    <Card className={`flex-1 m-1 ${!earned ? 'opacity-40' : ''}`}>
      <CardContent className="py-4 px-3 items-center gap-2">
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: earned ? tier.bg : colors.secondary }}
        >
          {earned ? (
            <Icon size={24} color={tier.icon} />
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
        {earned && earnedAt && (
          <Text className="text-[10px] text-muted-foreground">
            {new Date(earnedAt).toLocaleDateString()}
          </Text>
        )}
      </CardContent>
    </Card>
  );
};

const AchievementsScreen = () => {
  const { showAlert } = useAlert();
  const router = useRouter();
  const [showShowcase, setShowShowcase] = useState(false);
  const { data: allBadges, isLoading: allLoading, refetch: refetchAll } = trpc.badge.getAllBadgeDefinitions.useQuery();
  const { data: userBadges, isLoading: userLoading, refetch: refetchUser } = trpc.badge.getUserBadges.useQuery();
  const { data: showcaseIds } = trpc.badge.getMyShowcaseBadgeIds.useQuery();
  const setShowcase = trpc.badge.setShowcaseBadges.useMutation();
  const utils = trpc.useUtils();
  const [selectedShowcase, setSelectedShowcase] = useState<string[]>([]);

  const earnedMap = new Map((userBadges ?? []).map((b: any) => [b.badgeId, b]));
  const badges = allBadges ?? [];
  const earnedCount = earnedMap.size;
  const isLoading = allLoading || userLoading;

  const toggleShowcase = (id: string) => {
    setSelectedShowcase((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) { showAlert({ title: 'Max 5', message: 'You can showcase up to 5 badges' }); return prev; }
      return [...prev, id];
    });
  };

  const saveShowcase = () => {
    setShowcase.mutate(
      { badgeIds: selectedShowcase } as any,
      {
        onSuccess: () => {
          utils.badge.getMyShowcaseBadgeIds.invalidate();
          setShowShowcase(false);
          showAlert({ title: 'Saved', message: 'Showcase updated' });
        },
      },
    );
  };

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
      <View className="items-center py-4 gap-2">
        <Text className="text-3xl font-bold text-teal">{earnedCount}</Text>
        <Text className="text-sm text-muted-foreground">of {badges.length} badges earned</Text>
        {earnedCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onPress={() => {
              setSelectedShowcase([...((showcaseIds as any) ?? [])]);
              setShowShowcase(true);
            }}
          >
            Edit Showcase
          </Button>
        )}
      </View>

      {/* Showcase Editor Modal */}
      <Modal visible={showShowcase} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowShowcase(false)}>
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Text className="text-base font-semibold text-foreground">Edit Showcase (max 5)</Text>
            <TouchableOpacity onPress={() => setShowShowcase(false)}>
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-2 pb-8">
            {(badges as any[]).filter((b: any) => earnedMap.has(b.id)).map((badge: any) => {
              const selected = selectedShowcase.includes(badge.id);
              const BadgeIcon = ICON_MAP[badge.icon] ?? Award;
              const tier = TIER_COLORS[badge.tier as keyof typeof TIER_COLORS] ?? TIER_COLORS.BRONZE;
              return (
                <TouchableOpacity
                  key={badge.id}
                  className={`flex-row items-center gap-3 p-3 rounded-lg border ${selected ? 'border-teal bg-teal/10' : 'border-border'}`}
                  onPress={() => toggleShowcase(badge.id)}
                >
                  <BadgeIcon size={20} color={selected ? colors.teal : tier.icon} />
                  <Text className={`flex-1 text-sm ${selected ? 'text-teal font-medium' : 'text-foreground'}`}>{badge.name}</Text>
                  {selected && <Check size={16} color={colors.teal} />}
                </TouchableOpacity>
              );
            })}
            <Button onPress={saveShowcase} loading={setShowcase.isPending}>Save Showcase</Button>
          </ScrollView>
        </View>
      </Modal>

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
          renderItem={({ item }) => {
            const earned = earnedMap.get(item.id);
            return (
              <BadgeCard badge={item} earned={!!earned} earnedAt={earned?.earnedAt} />
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.teal} />}
        />
      )}
    </SafeAreaView>
  );
};

export default AchievementsScreen;
