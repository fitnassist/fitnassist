import { View, FlatList, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, UserPlus, Clock } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from '@/lib/dates';
import { colors } from '@/constants/theme';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  ACCEPTED: { label: 'Accepted', variant: 'default' },
  DECLINED: { label: 'Declined', variant: 'destructive' },
  RESPONDED: { label: 'Responded', variant: 'default' },
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
  const status = STATUS_BADGE[request.status] ?? { label: request.status, variant: 'secondary' as const };

  return (
    <Card className="mx-4 mb-3">
      <CardContent className="py-4 px-4 gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {isConnection ? <UserPlus size={16} color={colors.teal} /> : <Phone size={16} color={colors.teal} />}
            <Text className="text-base font-semibold text-foreground">{request.name}</Text>
          </View>
          <Badge variant={status.variant}>{status.label}</Badge>
        </View>

        <View className="gap-1">
          <Text className="text-sm text-muted-foreground">{request.email}</Text>
          {request.phone && <Text className="text-sm text-muted-foreground">{request.phone}</Text>}
        </View>

        {request.message && <Text className="text-sm text-foreground">{request.message}</Text>}

        <View className="flex-row items-center gap-1">
          <Clock size={12} color={colors.mutedForeground} />
          <Text className="text-xs text-muted-foreground">{formatDistanceToNow(String(request.createdAt))} ago</Text>
        </View>

        {isPending && (
          <View className="flex-row gap-2 mt-1">
            {isConnection ? (
              <>
                <Button size="sm" onPress={onAccept} className="flex-1">Accept</Button>
                <Button size="sm" variant="outline" onPress={onDecline} className="flex-1">Decline</Button>
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
  const router = useRouter();
  const { data: requests, isLoading, refetch } = trpc.contact.getMyRequests.useQuery();
  const acceptConnection = trpc.contact.acceptConnection.useMutation();
  const declineConnection = trpc.contact.declineConnection.useMutation();
  const updateStatus = trpc.contact.updateStatus.useMutation();
  const utils = trpc.useUtils();

  const invalidate = () => {
    utils.contact.getMyRequests.invalidate();
    utils.contact.getStats.invalidate();
    utils.message.getConnections.invalidate();
  };

  const handleAccept = (id: string) => {
    acceptConnection.mutate({ requestId: id }, { onSuccess: invalidate, onError: () => Alert.alert('Error', 'Failed to accept') });
  };

  const handleDecline = (id: string) => {
    Alert.alert('Decline Request', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => declineConnection.mutate({ requestId: id }, { onSuccess: invalidate }) },
    ]);
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
        <Text className="text-base font-semibold text-foreground">Requests</Text>
      </View>

      {isLoading ? (
        <View className="px-4 py-4 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={requests ?? []}
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
              <Text className="text-base text-muted-foreground">No requests</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default RequestsScreen;
