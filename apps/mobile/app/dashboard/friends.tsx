import { useState } from 'react';
import { View, FlatList, RefreshControl, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, UserPlus, UserMinus, Check, X } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Skeleton, Card, CardContent } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

type Tab = 'friends' | 'requests' | 'sent';

const FriendsScreen = () => {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('friends');

  const { data: friends, isLoading: friendsLoading, refetch: refetchFriends } = trpc.friendship.getFriends.useQuery({});
  const { data: pending, refetch: refetchPending } = trpc.friendship.getPendingRequests.useQuery({});
  const { data: sent, refetch: refetchSent } = trpc.friendship.getSentRequests.useQuery({});

  const acceptRequest = trpc.friendship.acceptRequest.useMutation();
  const declineRequest = trpc.friendship.declineRequest.useMutation();
  const removeFriend = trpc.friendship.removeFriend.useMutation();
  const utils = trpc.useUtils();

  const invalidate = () => {
    refetchFriends();
    refetchPending();
    refetchSent();
  };

  const handleAccept = (id: string) => {
    acceptRequest.mutate({ requestId: id }, { onSuccess: invalidate });
  };

  const handleDecline = (id: string) => {
    declineRequest.mutate({ requestId: id }, { onSuccess: invalidate });
  };

  const handleRemove = (id: string) => {
    Alert.alert('Remove Friend', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFriend.mutate({ friendshipId: id }, { onSuccess: invalidate }) },
    ]);
  };

  const friendsList = Array.isArray(friends) ? friends : (friends as any)?.friends ?? [];
  const pendingList = (pending as any)?.items ?? pending ?? [];
  const sentList = (sent as any)?.items ?? sent ?? [];

  const currentData = tab === 'friends' ? friendsList : tab === 'requests' ? pendingList : sentList;
  const isLoading = friendsLoading;

  const renderPerson = (item: any) => {
    const person = tab === 'friends' ? item.friend : tab === 'requests' ? item.sender : item.receiver;
    const name = person?.name ?? 'Unknown';
    const image = person?.traineeProfile?.avatarUrl ?? person?.image ?? null;

    return (
      <Card className="mx-4 mb-2">
        <CardContent className="py-3 px-4 flex-row items-center gap-3">
          {image ? (
            <Image source={{ uri: image }} className="w-10 h-10 rounded-full" />
          ) : (
            <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
              <Text className="text-sm font-semibold text-foreground">{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text className="flex-1 text-base font-medium text-foreground">{name}</Text>

          {tab === 'friends' && (
            <TouchableOpacity onPress={() => handleRemove(item.id)}>
              <UserMinus size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          {tab === 'requests' && (
            <View className="flex-row gap-2">
              <TouchableOpacity className="bg-primary rounded-full w-8 h-8 items-center justify-center" onPress={() => handleAccept(item.id)}>
                <Check size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity className="bg-secondary rounded-full w-8 h-8 items-center justify-center" onPress={() => handleDecline(item.id)}>
                <X size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Friends</Text>
      </View>

      <View className="flex-row px-4 py-3 gap-2">
        {([
          { key: 'friends' as Tab, label: 'Friends' },
          { key: 'requests' as Tab, label: `Requests${pendingList.length ? ` (${pendingList.length})` : ''}` },
          { key: 'sent' as Tab, label: 'Sent' },
        ]).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            className={`flex-1 items-center py-2 rounded-lg ${tab === key ? 'bg-primary' : 'bg-card border border-border'}`}
            onPress={() => setTab(key)}
          >
            <Text className={`text-sm font-medium ${tab === key ? 'text-white' : 'text-muted-foreground'}`}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="px-4 gap-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => renderPerson(item)}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-base text-muted-foreground">
                {tab === 'friends' ? 'No friends yet' : tab === 'requests' ? 'No pending requests' : 'No sent requests'}
              </Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={invalidate} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default FriendsScreen;
