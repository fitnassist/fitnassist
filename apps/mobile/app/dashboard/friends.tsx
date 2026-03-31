import { useState } from 'react';
import { View, FlatList, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, UserPlus, UserMinus, Check, X } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Skeleton, TabBar, useAlert } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/theme';

type Tab = 'friends' | 'requests' | 'sent' | 'following' | 'blocked';

const FriendsScreen = () => {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('friends');

  const { data: friends, isLoading: friendsLoading, refetch: refetchFriends } = trpc.friendship.getFriends.useQuery({});
  const { data: pending, refetch: refetchPending } = trpc.friendship.getPendingRequests.useQuery({});
  const { data: sent, refetch: refetchSent } = trpc.friendship.getSentRequests.useQuery({});

  const { data: following, refetch: refetchFollowing } = trpc.follow.getFollowing.useQuery(
    { userId: user?.id ?? '' },
    { enabled: !!user?.id },
  );
  const { data: blocked, refetch: refetchBlocked } = trpc.friendship.getBlockedUsers.useQuery();

  const acceptRequest = trpc.friendship.acceptRequest.useMutation();
  const declineRequest = trpc.friendship.declineRequest.useMutation();
  const removeFriend = trpc.friendship.removeFriend.useMutation();
  const unfollowUser = trpc.follow.unfollow.useMutation();
  const unblockUser = trpc.friendship.unblockUser.useMutation();
  const utils = trpc.useUtils();

  const invalidate = () => {
    refetchFriends();
    refetchPending();
    refetchSent();
    refetchFollowing();
    refetchBlocked();
  };

  const handleAccept = (id: string) => {
    acceptRequest.mutate({ requestId: id }, { onSuccess: invalidate });
  };

  const handleDecline = (id: string) => {
    declineRequest.mutate({ requestId: id }, { onSuccess: invalidate });
  };

  const handleRemove = (id: string) => {
    showAlert({
      title: 'Remove Friend',
      message: 'Are you sure?',
      actions: [
        { label: 'Remove', variant: 'destructive', onPress: () => removeFriend.mutate({ friendshipId: id }, { onSuccess: invalidate }) },
        { label: 'Cancel', variant: 'outline' },
      ],
    });
  };

  const friendsList = Array.isArray(friends) ? friends : (friends as any)?.friends ?? [];
  const pendingList = (pending as any)?.items ?? pending ?? [];
  const sentList = (sent as any)?.items ?? sent ?? [];
  const followingList = (following as any)?.items ?? following ?? [];
  const blockedList = blocked ?? [];

  const dataMap: Record<Tab, any[]> = {
    friends: friendsList,
    requests: pendingList,
    sent: sentList,
    following: followingList,
    blocked: blockedList,
  };
  const currentData = dataMap[tab] ?? [];
  const isLoading = friendsLoading;

  const renderPerson = (item: any) => {
    const person = tab === 'friends' ? item.friend
      : tab === 'requests' ? item.requester
      : tab === 'sent' ? item.receiver
      : tab === 'following' ? item.following
      : item.blockedUser ?? item;
    const name = person?.trainerProfile?.displayName ?? person?.name ?? 'Unknown';
    const image = person?.trainerProfile?.profileImageUrl ?? person?.traineeProfile?.avatarUrl ?? person?.image ?? null;
    const trainerHandle = person?.trainerProfile?.handle;
    const traineeHandle = person?.traineeProfile?.handle;
    const profilePath = trainerHandle
      ? `/trainers/${trainerHandle}`
      : traineeHandle
      ? `/users/${traineeHandle}`
      : null;

    return (
      <TouchableOpacity
        className="flex-row items-center px-4 py-3 border-b border-border gap-3"
        activeOpacity={profilePath ? 0.6 : 1}
        onPress={() => profilePath && router.push(profilePath as any)}
      >
        {image ? (
          <Image source={{ uri: image }} className="w-10 h-10 rounded-full" />
        ) : (
          <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
            <Text className="text-sm font-semibold text-foreground">{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text className="flex-1 text-sm font-medium text-foreground">{name}</Text>

        {tab === 'friends' && (
          <TouchableOpacity hitSlop={8} onPress={() => handleRemove(item.id)}>
            <UserMinus size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        {tab === 'following' && (
          <TouchableOpacity
            className="px-3 py-1.5 rounded-full border border-border bg-card"
            hitSlop={8}
            onPress={() => unfollowUser.mutate({ followingId: person?.id }, { onSuccess: invalidate })}
          >
            <Text className="text-xs text-muted-foreground">Unfollow</Text>
          </TouchableOpacity>
        )}
        {tab === 'blocked' && (
          <TouchableOpacity hitSlop={8} onPress={() => unblockUser.mutate({ userId: person?.id } as any, { onSuccess: invalidate })}>
            <Text className="text-xs text-teal">Unblock</Text>
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
      </TouchableOpacity>
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

      <TabBar
        tabs={[
          { key: 'friends' as Tab, label: 'Friends' },
          { key: 'requests' as Tab, label: `Requests${pendingList.length ? ` (${pendingList.length})` : ''}` },
          { key: 'sent' as Tab, label: 'Sent' },
          { key: 'following' as Tab, label: 'Following' },
          { key: 'blocked' as Tab, label: 'Blocked' },
        ]}
        active={tab}
        onChange={setTab}
      />

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
