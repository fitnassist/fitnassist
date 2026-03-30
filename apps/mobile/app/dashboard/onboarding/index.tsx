import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ClipboardCheck, Clock, CheckCircle } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from '@/lib/dates';
import { colors } from '@/constants/theme';

const OnboardingScreen = () => {
  const router = useRouter();
  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = trpc.onboarding.listTemplates.useQuery();
  const { data: responses, isLoading: responsesLoading, refetch: refetchResponses } = trpc.onboarding.listResponses.useQuery({});

  const onRefresh = async () => {
    await Promise.all([refetchTemplates(), refetchResponses()]);
  };

  const allResponses = (responses as any)?.items ?? responses ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Onboarding</Text>
      </View>

      {templatesLoading || responsesLoading ? (
        <View className="px-4 py-4 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={allResponses}
          keyExtractor={(item: any) => item.id}
          ListHeaderComponent={
            <View className="px-4 py-3">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
                Responses ({allResponses.length})
              </Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <Card className="mx-4 mb-2">
              <CardContent className="py-3 px-4 gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-foreground">
                    {item.client?.user?.name ?? 'Client'}
                  </Text>
                  <Badge variant={item.status === 'COMPLETED' ? 'default' : 'secondary'}>
                    {item.status === 'COMPLETED' ? 'Reviewed' : 'Pending Review'}
                  </Badge>
                </View>
                <View className="flex-row items-center gap-1">
                  <Clock size={12} color={colors.mutedForeground} />
                  <Text className="text-xs text-muted-foreground">
                    {formatDistanceToNow(String(item.createdAt))} ago
                  </Text>
                </View>
              </CardContent>
            </Card>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-2">
              <ClipboardCheck size={48} color={colors.mutedForeground} />
              <Text className="text-base text-muted-foreground">No onboarding responses yet</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default OnboardingScreen;
