import { useState } from 'react';
import { View, ScrollView, RefreshControl, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, UserMinus, ClipboardList, Target, FileText, TrendingUp } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Card, CardContent, Skeleton, Badge, TabBar } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

type Tab = 'overview' | 'plans' | 'progress' | 'notes';

const STATUSES = ['ACTIVE', 'INACTIVE', 'ON_HOLD', 'ONBOARDING'] as const;

const ClientDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: client, isLoading, refetch } = trpc.clientRoster.get.useQuery(
    { id: id ?? '' },
    { enabled: !!id },
  );
  const updateStatus = trpc.clientRoster.updateStatus.useMutation();
  const utils = trpc.useUtils();

  const name = (client as any)?.connection?.sender?.name ?? (client as any)?.connection?.name ?? 'Client';
  const image = (client as any)?.connection?.sender?.traineeProfile?.avatarUrl ?? (client as any)?.connection?.sender?.image ?? null;
  const email = (client as any)?.connection?.sender?.email ?? '';
  const status = (client as any)?.status ?? 'ACTIVE';

  const handleStatusChange = (newStatus: string) => {
    if (!id) return;
    updateStatus.mutate(
      { clientRosterId: id, status: newStatus } as any,
      {
        onSuccess: () => {
          utils.clientRoster.get.invalidate({ id });
          utils.clientRoster.list.invalidate();
        },
      },
    );
  };

  const handleDisconnect = () => {
    Alert.alert('Disconnect Client', `Remove ${name} from your client list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => {
          // Disconnect via status or dedicated endpoint
          handleStatusChange('DISCONNECTED');
          router.back();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Skeleton className="h-5 w-32 rounded" />
        </View>
        <View className="px-4 py-6 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">{name}</Text>
      </View>

      <TabBar
        tabs={[
          { key: 'overview' as Tab, label: 'Overview' },
          { key: 'plans' as Tab, label: 'Plans' },
          { key: 'progress' as Tab, label: 'Progress' },
          { key: 'notes' as Tab, label: 'Notes' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-2 gap-4 pb-8"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
      >
        {tab === 'overview' && (
          <>
            {/* Profile Card */}
            <Card>
              <CardContent className="py-5 px-4 gap-3">
                <View className="flex-row items-center gap-4">
                  {image ? (
                    <Image source={{ uri: image }} className="w-16 h-16 rounded-full" />
                  ) : (
                    <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center">
                      <Text className="text-xl font-bold text-foreground">{name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View className="flex-1 gap-0.5">
                    <Text className="text-lg font-semibold text-foreground">{name}</Text>
                    {email && <Text className="text-sm text-muted-foreground">{email}</Text>}
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
                  Status
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <TouchableOpacity
                      key={s}
                      className={`px-3 py-2 rounded-lg border-2 ${
                        status === s ? 'border-teal bg-teal/10' : 'border-border'
                      }`}
                      onPress={() => handleStatusChange(s)}
                    >
                      <Text className={`text-xs font-medium ${status === s ? 'text-teal' : 'text-muted-foreground'}`}>
                        {s.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </CardContent>
            </Card>

            {/* Actions */}
            <View className="gap-2">
              <Button
                onPress={() => {
                  const connectionId = (client as any)?.connection?.id;
                  if (connectionId) router.push(`/messages/${connectionId}`);
                }}
              >
                <View className="flex-row items-center gap-2">
                  <MessageCircle size={16} color="#fff" />
                  <Text className="text-white font-semibold">Message Client</Text>
                </View>
              </Button>

              <Button variant="ghost" onPress={handleDisconnect}>
                <View className="flex-row items-center gap-2">
                  <UserMinus size={16} color={colors.destructive} />
                  <Text className="text-destructive font-semibold">Disconnect Client</Text>
                </View>
              </Button>
            </View>
          </>
        )}

        {tab === 'plans' && (
          <View className="items-center justify-center py-12 gap-2">
            <ClipboardList size={48} color={colors.mutedForeground} />
            <Text className="text-base text-muted-foreground">Plan assignments coming soon</Text>
          </View>
        )}

        {tab === 'progress' && (
          <View className="items-center justify-center py-12 gap-2">
            <TrendingUp size={48} color={colors.mutedForeground} />
            <Text className="text-base text-muted-foreground">Client progress view coming soon</Text>
          </View>
        )}

        {tab === 'notes' && (
          <View className="items-center justify-center py-12 gap-2">
            <FileText size={48} color={colors.mutedForeground} />
            <Text className="text-base text-muted-foreground">Trainer notes coming soon</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ClientDetailScreen;
