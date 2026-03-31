import { useState, useMemo } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, UserPlus, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Card, CardContent, Skeleton, Badge, TabBar, useAlert } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from '@/lib/dates';
import { colors } from '@/constants/theme';

type RequestTab = 'all' | 'callbacks' | 'connections';

const STATUS_STYLES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon?: any; color?: string }> = {
  PENDING: { label: 'Pending', variant: 'secondary', icon: Clock, color: '#f59e0b' },
  ACCEPTED: { label: 'Accepted', variant: 'default', icon: CheckCircle, color: colors.teal },
  DECLINED: { label: 'Declined', variant: 'destructive', icon: XCircle, color: colors.destructive },
  RESPONDED: { label: 'Responded', variant: 'default', icon: CheckCircle, color: colors.teal },
  CLOSED: { label: 'Closed', variant: 'secondary' },
};

const RequestCard = ({ request, onAccept, onDecline, onResponded }: {
  request: any;
  onAccept: () => void;
  onDecline: () => void;
  onResponded: () => void;
}) => {
  const isConnection = request.type === 'CONNECTION_REQUEST';
  const isPending = request.status === 'PENDING';
  const status = STATUS_STYLES[request.status] ?? STATUS_STYLES.PENDING;
  const initials = (request.name ?? '')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <Card className="mx-4 mb-3">
      <CardContent className="py-4 px-4 gap-3">
        {/* Header */}
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
            <Text className="text-sm font-semibold text-foreground">{initials}</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-semibold text-foreground">{request.name}</Text>
              {isConnection ? <UserPlus size={14} color={colors.teal} /> : <Phone size={14} color={colors.teal} />}
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-muted-foreground">{request.email}</Text>
              {request.phone && <Text className="text-xs text-muted-foreground"> · {request.phone}</Text>}
            </View>
          </View>
          <Badge variant={status.variant}>{status.label}</Badge>
        </View>

        {/* Message */}
        {request.message && (
          <View className="bg-secondary rounded-lg p-3">
            <Text className="text-sm text-foreground">{request.message}</Text>
          </View>
        )}

        {/* Timestamp */}
        <Text className="text-xs text-muted-foreground">
          {formatDistanceToNow(String(request.createdAt))} ago
        </Text>

        {/* Actions */}
        {isPending && (
          <View className="flex-row gap-2">
            {isConnection ? (
              <>
                <Button size="sm" variant="outline" onPress={onDecline} className="flex-1">Decline</Button>
                <Button size="sm" onPress={onAccept} className="flex-1">Accept</Button>
              </>
            ) : (
              <Button size="sm" onPress={onResponded} className="flex-1">Mark as Called</Button>
            )}
          </View>
        )}
      </CardContent>
    </Card>
  );
};

const RequestsScreen = () => {
  const { showAlert } = useAlert();
  const router = useRouter();
  const [tab, setTab] = useState<RequestTab>('all');
  const { data: requests, isLoading, refetch } = trpc.contact.getMyRequests.useQuery();
  const acceptConnection = trpc.contact.acceptConnection.useMutation();
  const declineConnection = trpc.contact.declineConnection.useMutation();
  const updateStatus = trpc.contact.updateStatus.useMutation();
  const utils = trpc.useUtils();

  const invalidate = () => {
    utils.contact.getMyRequests.invalidate();
    utils.contact.getStats.invalidate();
    utils.clientRoster.list.invalidate();
    utils.message.getConnections.invalidate();
  };

  // Filter out accepted connections (they belong on contacts page)
  const activeRequests = useMemo(() => {
    return (requests ?? []).filter((r: any) => !(r.type === 'CONNECTION_REQUEST' && r.status === 'ACCEPTED'));
  }, [requests]);

  const filtered = useMemo(() => {
    if (tab === 'callbacks') return activeRequests.filter((r: any) => r.type === 'CALLBACK_REQUEST');
    if (tab === 'connections') return activeRequests.filter((r: any) => r.type === 'CONNECTION_REQUEST');
    return activeRequests;
  }, [activeRequests, tab]);

  const callbackCount = activeRequests.filter((r: any) => r.type === 'CALLBACK_REQUEST').length;
  const connectionCount = activeRequests.filter((r: any) => r.type === 'CONNECTION_REQUEST').length;
  const pendingCount = activeRequests.filter((r: any) => r.status === 'PENDING').length;

  const tabs = [
    { key: 'all' as RequestTab, label: `All (${activeRequests.length})` },
    { key: 'callbacks' as RequestTab, label: `Callbacks (${callbackCount})` },
    { key: 'connections' as RequestTab, label: `Connections (${connectionCount})` },
  ];

  const handleAccept = (id: string) => {
    acceptConnection.mutate({ requestId: id }, {
      onSuccess: (data) => {
        invalidate();
        if ((data as any)?.id) router.push(`/messages/${(data as any).id}`);
      },
      onError: () => showAlert({ title: 'Error', message: 'Failed to accept' }),
    });
  };

  const handleDecline = (id: string) => {
    showAlert({
      title: 'Decline Request',
      message: 'Are you sure?',
      actions: [
        { label: 'Decline', variant: 'destructive', onPress: () => declineConnection.mutate({ requestId: id }, { onSuccess: invalidate }) },
        { label: 'Cancel', variant: 'outline' },
      ],
    });
  };

  const handleResponded = (id: string) => {
    updateStatus.mutate({ requestId: id, status: 'RESPONDED' } as any, { onSuccess: invalidate });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text className="text-base font-semibold text-foreground">Requests</Text>
          <Text className="text-xs text-muted-foreground">Manage callback and connection requests</Text>
        </View>
      </View>

      {/* Pending banner */}
      {pendingCount > 0 && (
        <View className="mx-4 mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          <Text className="text-xs text-amber-400">You have {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} to review</Text>
        </View>
      )}

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {isLoading ? (
        <View className="px-4 py-4 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              onAccept={() => handleAccept(item.id)}
              onDecline={() => handleDecline(item.id)}
              onResponded={() => handleResponded(item.id)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-base text-muted-foreground">No requests yet.</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default RequestsScreen;
