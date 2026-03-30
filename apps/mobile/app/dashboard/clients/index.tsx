import { View, FlatList, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users, MessageCircle } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Skeleton, Badge, Card, CardContent } from '@/components/ui';
import { useClients } from '@/api/client';
import { colors } from '@/constants/theme';

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ACTIVE: 'default',
  ONBOARDING: 'secondary',
  INACTIVE: 'secondary',
  ON_HOLD: 'secondary',
};

const ClientCard = ({ client, onPress }: { client: any; onPress: () => void }) => {
  const name = client.client?.user?.name ?? client.clientName ?? 'Unknown';
  const image = client.client?.user?.traineeProfile?.avatarUrl ?? client.client?.user?.image ?? null;
  const status = client.status ?? 'ACTIVE';

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card className="mx-4 mb-2">
        <CardContent className="py-3 px-4">
          <View className="flex-row items-center gap-3">
            {image ? (
              <Image source={{ uri: image }} className="w-12 h-12 rounded-full" />
            ) : (
              <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center">
                <Text className="text-base font-semibold text-foreground">{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-semibold text-foreground">{name}</Text>
              {client.client?.user?.email && (
                <Text className="text-xs text-muted-foreground">{client.client.user.email}</Text>
              )}
            </View>
            <Badge variant={STATUS_COLORS[status] ?? 'secondary'}>
              {status.replace('_', ' ')}
            </Badge>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
};

const ClientsScreen = () => {
  const router = useRouter();
  const { data: clients, isLoading, refetch } = useClients();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Clients</Text>
      </View>

      {isLoading ? (
        <View className="px-4 py-4 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={clients ?? []}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <ClientCard client={item} onPress={() => router.push(`/dashboard/clients/${item.id}`)} />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-2">
              <Users size={48} color={colors.mutedForeground} />
              <Text className="text-base text-muted-foreground">No clients yet</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default ClientsScreen;
