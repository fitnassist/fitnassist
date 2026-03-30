import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ClipboardCheck, FileText } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const OnboardingScreen = () => {
  const router = useRouter();
  const { data: templates, isLoading, refetch } = trpc.onboarding.getTemplates.useQuery();
  const { data: pendingCount } = trpc.onboarding.pendingReviewCount.useQuery();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Onboarding</Text>
        {typeof pendingCount === 'number' && pendingCount > 0 && (
          <Badge>{pendingCount} pending</Badge>
        )}
      </View>

      {isLoading ? (
        <View className="px-4 py-4 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={templates ?? []}
          keyExtractor={(item: any) => item.id}
          ListHeaderComponent={
            <View className="px-4 py-3">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
                Templates
              </Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <Card className="mx-4 mb-2">
              <CardContent className="py-3 px-4 flex-row items-center gap-3">
                <FileText size={20} color={colors.teal} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{item.name}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {item.questions?.length ?? 0} questions
                  </Text>
                </View>
                <Badge variant={item.isActive ? 'default' : 'secondary'}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardContent>
            </Card>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-2">
              <ClipboardCheck size={48} color={colors.mutedForeground} />
              <Text className="text-base text-muted-foreground">No onboarding templates</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default OnboardingScreen;
