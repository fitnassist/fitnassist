import { useState } from 'react';
import { View, FlatList, RefreshControl, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Card, CardContent, Skeleton, useAlert } from '@/components/ui';
import { useMyTrainerProfile } from '@/api/trainer';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from '@/lib/dates';
import { colors } from '@/constants/theme';

const Stars = ({ rating }: { rating: number }) => (
  <View className="flex-row gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={14} color={colors.teal} fill={i <= rating ? colors.teal : 'transparent'} />
    ))}
  </View>
);

const ReviewCard = ({ review, onReply }: { review: any; onReply: (text: string) => void }) => {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  return (
    <Card className="mx-4 mb-3">
      <CardContent className="py-4 px-4 gap-3">
        <View className="flex-row items-center gap-3">
          {review.reviewer?.image ? (
            <Image source={{ uri: review.reviewer.image }} className="w-10 h-10 rounded-full" />
          ) : (
            <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
              <Text className="text-sm font-semibold text-foreground">
                {(review.reviewer?.name ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">{review.reviewer?.name ?? 'Anonymous'}</Text>
            <Stars rating={review.rating} />
          </View>
          <Text className="text-xs text-muted-foreground">{formatDistanceToNow(String(review.createdAt))}</Text>
        </View>

        <Text className="text-sm text-foreground">{review.text}</Text>

        {review.replyText ? (
          <View className="bg-secondary rounded-lg p-3 mt-1">
            <Text className="text-xs text-muted-foreground mb-1">Your reply</Text>
            <Text className="text-sm text-foreground">{review.replyText}</Text>
          </View>
        ) : replying ? (
          <View className="gap-2 mt-1">
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write a reply..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              className="border border-border rounded-lg p-3 text-sm text-foreground"
              style={{ fontSize: 14, minHeight: 60 }}
            />
            <View className="flex-row gap-2">
              <Button size="sm" onPress={() => { onReply(replyText); setReplying(false); }} disabled={!replyText.trim()} className="flex-1">
                Reply
              </Button>
              <Button size="sm" variant="outline" onPress={() => setReplying(false)} className="flex-1">
                Cancel
              </Button>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setReplying(true)}>
            <Text className="text-sm text-teal font-medium">Reply</Text>
          </TouchableOpacity>
        )}
      </CardContent>
    </Card>
  );
};

const ReviewsScreen = () => {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { data: profile } = useMyTrainerProfile();
  const { data, isLoading, refetch, fetchNextPage, hasNextPage } = trpc.review.getForDashboard.useInfiniteQuery(
    { limit: 10 },
    { getNextPageParam: (lastPage: any) => lastPage.nextCursor },
  );
  const replyMutation = trpc.review.reply.useMutation();
  const utils = trpc.useUtils();

  const reviews = data?.pages.flatMap((p: any) => p.reviews ?? []) ?? [];

  const handleReply = (reviewId: string, text: string) => {
    replyMutation.mutate(
      { reviewId, replyText: text },
      {
        onSuccess: () => utils.review.getForDashboard.invalidate(),
        onError: () => showAlert({ title: 'Error', message: 'Failed to reply' }),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Reviews</Text>
      </View>

      {/* Stats */}
      {profile && (
        <View className="flex-row items-center justify-center gap-2 py-4">
          <Star size={20} color={colors.teal} fill={colors.teal} />
          <Text className="text-2xl font-bold text-foreground">
            {profile.ratingAverage?.toFixed(1) ?? '0.0'}
          </Text>
          <Text className="text-sm text-muted-foreground">({profile.ratingCount ?? 0} reviews)</Text>
        </View>
      )}

      {isLoading ? (
        <View className="px-4 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <ReviewCard review={item} onReply={(text) => handleReply(item.id, text)} />
          )}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-base text-muted-foreground">No reviews yet</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default ReviewsScreen;
