import { UserPlus, Send } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import {
  usePendingRequests,
  useSentRequests,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
} from '@/api/friendship';
import { routes } from '@/config/routes';
import { UserCard } from '../UserCard';

export const FriendRequests = () => {
  const {
    data: pendingData,
    isLoading: pendingLoading,
    hasNextPage: pendingHasNext,
    fetchNextPage: pendingFetchNext,
    isFetchingNextPage: pendingFetchingNext,
  } = usePendingRequests();

  const {
    data: sentData,
    isLoading: sentLoading,
    hasNextPage: sentHasNext,
    fetchNextPage: sentFetchNext,
    isFetchingNextPage: sentFetchingNext,
  } = useSentRequests();

  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();

  const pendingRequests = pendingData?.pages.flatMap((page) => page.items) ?? [];
  const sentRequests = sentData?.pages.flatMap((page) => page.items) ?? [];

  const isLoading = pendingLoading || sentLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const hasNone = pendingRequests.length === 0 && sentRequests.length === 0;

  if (hasNone) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UserPlus className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">No friend requests</p>
        <p className="mt-1 text-xs text-muted-foreground">
          When someone sends you a request, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Incoming requests */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Incoming Requests
        </h2>

        {pendingRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No incoming requests.</p>
        ) : (
          <>
            {pendingRequests.map((friendship) => {
              const requester = friendship.requester;
              const handle = requester.traineeProfile?.handle;
              const avatarUrl = requester.traineeProfile?.avatarUrl ?? requester.image;
              const profileUrl = routes.traineePublicProfile(handle ?? requester.id);

              return (
                <UserCard
                  key={friendship.id}
                  name={requester.name}
                  handle={handle}
                  avatarUrl={avatarUrl}
                  profileUrl={profileUrl}
                >
                  <Button
                    size="sm"
                    onClick={() => acceptRequest.mutate({ requestId: friendship.id })}
                    disabled={acceptRequest.isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => declineRequest.mutate({ requestId: friendship.id })}
                    disabled={declineRequest.isPending}
                  >
                    Decline
                  </Button>
                </UserCard>
              );
            })}

            {pendingHasNext && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pendingFetchNext()}
                  disabled={pendingFetchingNext}
                >
                  {pendingFetchingNext ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sent requests */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Sent Requests
        </h2>

        {sentRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sent requests.</p>
        ) : (
          <>
            {sentRequests.map((friendship) => {
              const addressee = friendship.addressee;
              const handle = addressee.traineeProfile?.handle;
              const avatarUrl = addressee.traineeProfile?.avatarUrl ?? addressee.image;
              const profileUrl = routes.traineePublicProfile(handle ?? addressee.id);

              return (
                <UserCard
                  key={friendship.id}
                  name={addressee.name}
                  handle={handle}
                  avatarUrl={avatarUrl}
                  profileUrl={profileUrl}
                >
                  <Badge variant="secondary">
                    <Send className="mr-1 h-3 w-3" />
                    Pending
                  </Badge>
                </UserCard>
              );
            })}

            {sentHasNext && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sentFetchNext()}
                  disabled={sentFetchingNext}
                >
                  {sentFetchingNext ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
