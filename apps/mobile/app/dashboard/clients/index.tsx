import { useState, useMemo } from 'react';
import { View, FlatList, RefreshControl, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users, MessageCircle, Search } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Skeleton, Badge, Card, CardContent, TabBar } from '@/components/ui';
import { useClients } from '@/api/client';
import { formatDistanceToNow } from '@/lib/dates';
import { colors } from '@/constants/theme';

type StatusFilter = 'ALL' | 'ONBOARDING' | 'ACTIVE' | 'ON_HOLD' | 'INACTIVE';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'ONBOARDING', label: 'Onboarding' },
  { key: 'ON_HOLD', label: 'On Hold' },
  { key: 'INACTIVE', label: 'Inactive' },
];

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ACTIVE: 'default',
  ONBOARDING: 'secondary',
  INACTIVE: 'secondary',
  ON_HOLD: 'secondary',
};

const ClientCard = ({ client, onPress, onMessage }: { client: any; onPress: () => void; onMessage: () => void }) => {
  const name = client.connection?.sender?.name ?? client.connection?.name ?? 'Unknown';
  const image = client.connection?.sender?.traineeProfile?.avatarUrl ?? client.connection?.sender?.image ?? null;
  const status = client.status ?? 'ACTIVE';
  const experienceLevel = client.connection?.sender?.traineeProfile?.experienceLevel;
  const fitnessGoals = client.connection?.sender?.traineeProfile?.fitnessGoals ?? [];
  const lastMessage = client.connection?.messages?.[0];

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card className="mx-4 mb-2">
        <CardContent className="py-3 px-4 gap-2">
          <View className="flex-row items-center gap-3">
            {image ? (
              <Image source={{ uri: image }} className="w-12 h-12 rounded-full" />
            ) : (
              <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center">
                <Text className="text-base font-semibold text-foreground">{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View className="flex-1 gap-0.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>{name}</Text>
                <Badge variant={STATUS_COLORS[status] ?? 'secondary'}>
                  {status.replace('_', ' ')}
                </Badge>
              </View>
              {experienceLevel && (
                <Text className="text-xs text-muted-foreground">{experienceLevel.replace('_', ' ')}</Text>
              )}
              {lastMessage && (
                <Text className="text-xs text-muted-foreground">
                  Last message: {formatDistanceToNow(String(lastMessage.createdAt))} ago
                </Text>
              )}
            </View>
          </View>

          {fitnessGoals.length > 0 && (
            <View className="flex-row flex-wrap gap-1">
              {fitnessGoals.slice(0, 3).map((goal: string) => (
                <View key={goal} className="bg-teal/10 rounded px-2 py-0.5">
                  <Text className="text-[10px] text-teal">{goal.replace(/-/g, ' ')}</Text>
                </View>
              ))}
              {fitnessGoals.length > 3 && (
                <View className="bg-secondary rounded px-2 py-0.5">
                  <Text className="text-[10px] text-muted-foreground">+{fitnessGoals.length - 3} more</Text>
                </View>
              )}
            </View>
          )}

          <View className="flex-row gap-2 mt-1">
            <TouchableOpacity
              className="flex-row items-center gap-1 bg-secondary rounded-lg px-3 py-1.5"
              onPress={(e) => { e.stopPropagation(); onMessage(); }}
            >
              <MessageCircle size={14} color={colors.teal} />
              <Text className="text-xs text-foreground">Message</Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
};

const ClientsScreen = () => {
  const router = useRouter();
  const { data: clients, isLoading, refetch } = useClients();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const allClients = (clients as any)?.clients ?? [];

  // Stats
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of allClients) {
      const s = c.status ?? 'ACTIVE';
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [allClients]);

  // Filter
  const filtered = useMemo(() => {
    let list = allClients;
    if (statusFilter !== 'ALL') {
      list = list.filter((c: any) => c.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c: any) => {
        const name = (c.connection?.sender?.name ?? c.connection?.name ?? '').toLowerCase();
        return name.includes(q);
      });
    }
    return list;
  }, [allClients, statusFilter, search]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Clients</Text>
      </View>

      {/* Stats */}
      {Object.keys(stats).length > 0 && (
        <View className="flex-row flex-wrap px-4 pt-3 gap-2">
          {Object.entries(stats).map(([status, count]) => (
            <View key={status} className="bg-card border border-border rounded-lg px-2.5 py-1">
              <Text className="text-xs text-muted-foreground">
                <Text className="font-semibold text-foreground">{count}</Text> {status.replace('_', ' ').toLowerCase()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Search */}
      <View className="px-4 pt-3">
        <View className="flex-row items-center h-10 bg-card border border-border rounded-lg px-3">
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search clients..."
            placeholderTextColor="hsl(230, 10%, 55%)"
            className="flex-1 text-foreground ml-2"
            style={{ fontSize: 14, padding: 0, margin: 0 }}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Status Filter */}
      <TabBar tabs={STATUS_FILTERS} active={statusFilter} onChange={setStatusFilter} />

      {isLoading ? (
        <View className="px-4 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <ClientCard
              client={item}
              onPress={() => router.push(`/dashboard/clients/${item.id}`)}
              onMessage={() => {
                const connectionId = item.connection?.id;
                if (connectionId) router.push(`/messages/${connectionId}`);
              }}
            />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-2">
              <Users size={48} color={colors.mutedForeground} />
              <Text className="text-base text-muted-foreground">
                {search ? 'No clients match your search' : 'No clients yet'}
              </Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default ClientsScreen;
