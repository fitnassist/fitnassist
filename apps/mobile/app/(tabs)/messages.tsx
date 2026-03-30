import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { Text, Skeleton } from '@/components/ui';
import { useConnections } from '@/api/message';
import { useAuth } from '@/hooks/useAuth';
import { ConversationItem } from '@/components/messages';
import { colors } from '@/constants/theme';

const MessagesScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: connections, isLoading, refetch } = useConnections(false);

  const conversations = connections ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getConversationInfo = (connection: any) => {
    // Match web logic: senderId === userId means current user is the trainee
    const isTrainee = connection.senderId === user?.id;
    const otherName = isTrainee
      ? (connection.trainer?.displayName ?? 'Unknown')
      : (connection.sender?.name ?? connection.name ?? 'Unknown');
    const otherImage = isTrainee
      ? (connection.trainer?.profileImageUrl ?? connection.trainer?.user?.image ?? null)
      : (connection.sender?.traineeProfile?.avatarUrl ?? connection.sender?.image ?? null);
    const lastMsg = connection.messages?.[0];

    return {
      name: otherName,
      imageUrl: otherImage,
      lastMessage: lastMsg?.content ?? null,
      lastMessageAt: lastMsg?.createdAt ?? null,
      unreadCount: connection.unreadCount,
    };
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="px-4 py-4">
          <Text className="text-2xl font-extralight text-foreground uppercase" style={{ letterSpacing: 2 }}>
            Messages
          </Text>
        </View>
        <View className="gap-4 px-4">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="flex-row gap-3 items-center">
              <Skeleton className="w-12 h-12 rounded-full" />
              <View className="flex-1 gap-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-48 rounded" />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-4">
        <Text className="text-2xl font-extralight text-foreground uppercase" style={{ letterSpacing: 2 }}>
          Messages
        </Text>
      </View>

      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <MessageCircle size={48} color={colors.mutedForeground} />
          <Text className="text-base text-muted-foreground text-center">
            No conversations yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item: { id: string }) => item.id}
          renderItem={({ item }) => {
            const info = getConversationInfo(item);
            return (
              <ConversationItem
                id={item.id}
                {...info}
                onPress={() => router.push(`/messages/${item.id}`)}
              />
            );
          }}
          ItemSeparatorComponent={() => <View className="h-px bg-border mx-4" />}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default MessagesScreen;
