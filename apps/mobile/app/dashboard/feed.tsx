import { View, FlatList, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from '@/lib/dates';
import { colors } from '@/constants/theme';

const PostCard = ({ post, onLike, onUnlike }: { post: any; onLike: () => void; onUnlike: () => void }) => {
  const isLiked = post.isLiked ?? false;
  const authorName = post.author?.name ?? 'Unknown';
  const authorImage = post.author?.traineeProfile?.avatarUrl ?? post.author?.image ?? null;

  return (
    <View className="px-4 py-4 border-b border-border">
      <View className="flex-row items-center gap-3 mb-3">
        {authorImage ? (
          <Image source={{ uri: authorImage }} className="w-10 h-10 rounded-full" />
        ) : (
          <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
            <Text className="text-sm font-semibold text-foreground">{authorName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{authorName}</Text>
          <Text className="text-xs text-muted-foreground">{formatDistanceToNow(String(post.createdAt))}</Text>
        </View>
      </View>

      <Text className="text-sm text-foreground mb-3">{post.content}</Text>

      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} className="w-full h-48 rounded-lg mb-3" resizeMode="cover" />
      )}

      <View className="flex-row items-center gap-4">
        <TouchableOpacity className="flex-row items-center gap-1" onPress={isLiked ? onUnlike : onLike}>
          <Heart size={18} color={isLiked ? colors.primary : colors.mutedForeground} fill={isLiked ? colors.primary : 'transparent'} />
          <Text className="text-sm text-muted-foreground">{post.likeCount ?? 0}</Text>
        </TouchableOpacity>
        <View className="flex-row items-center gap-1">
          <MessageCircle size={18} color={colors.mutedForeground} />
          <Text className="text-sm text-muted-foreground">{post.commentCount ?? 0}</Text>
        </View>
      </View>
    </View>
  );
};

const FeedScreen = () => {
  const router = useRouter();
  const { data, isLoading, refetch, fetchNextPage, hasNextPage } = trpc.post.getFeed.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (lastPage: any) => lastPage.nextCursor },
  );
  const likeMutation = trpc.post.like.useMutation();
  const unlikeMutation = trpc.post.unlike.useMutation();
  const utils = trpc.useUtils();

  const posts = data?.pages.flatMap((p: any) => p.items ?? p) ?? [];

  const handleLike = (postId: string) => {
    likeMutation.mutate({ postId }, { onSuccess: () => utils.post.getFeed.invalidate() });
  };

  const handleUnlike = (postId: string) => {
    unlikeMutation.mutate({ postId }, { onSuccess: () => utils.post.getFeed.invalidate() });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Feed</Text>
      </View>

      {isLoading ? (
        <View className="px-4 py-4 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} onLike={() => handleLike(item.id)} onUnlike={() => handleUnlike(item.id)} />
          )}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-base text-muted-foreground">Your feed is empty. Follow people to see their posts!</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
        />
      )}
    </SafeAreaView>
  );
};

export default FeedScreen;
