import { useState } from 'react';
import { View, FlatList, RefreshControl, Alert, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Award, Lock } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Card, CardContent, Skeleton } from '@/components/ui';
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
  const [showShowcase, setShowShowcase] = useState(false);
  const { data: allBadges, isLoading: allLoading, refetch: refetchAll } = trpc.badge.getAllBadgeDefinitions.useQuery();
  const { data: userBadges, isLoading: userLoading, refetch: refetchUser } = trpc.badge.getUserBadges.useQuery();
  const { data: showcaseIds } = trpc.badge.getMyShowcaseBadgeIds.useQuery();
  const setShowcase = trpc.badge.setShowcaseBadges.useMutation();
  const utils = trpc.useUtils();
  const [selectedShowcase, setSelectedShowcase] = useState<string[]>([]);

  const earnedIds = new Set((userBadges ?? []).map((b: any) => b.badgeDefinitionId ?? b.id));
  const badges = allBadges ?? [];
  const earnedCount = earnedIds.size;
  const isLoading = allLoading || userLoading;

  const toggleShowcase = (id: string) => {
    setSelectedShowcase((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) { Alert.alert('Max 5', 'You can showcase up to 5 badges'); return prev; }
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
          Alert.alert('Saved', 'Showcase updated');
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
            {(badges as any[]).filter((b: any) => earnedIds.has(b.id)).map((badge: any) => {
              const selected = selectedShowcase.includes(badge.id);
              return (
                <TouchableOpacity
                  key={badge.id}
                  className={`flex-row items-center gap-3 p-3 rounded-lg border ${selected ? 'border-primary bg-primary/10' : 'border-border'}`}
                  onPress={() => toggleShowcase(badge.id)}
                >
                  <Award size={20} color={selected ? colors.primary : colors.teal} />
                  <Text className={`flex-1 text-sm ${selected ? 'text-primary font-medium' : 'text-foreground'}`}>{badge.name}</Text>
                  {selected && <Lock size={14} color={colors.primary} />}
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
