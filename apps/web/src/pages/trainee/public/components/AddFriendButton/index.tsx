import { UserPlus, UserCheck, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useFriendshipStatus, useSendFriendRequest } from '@/api/friendship';
import { useAuth } from '@/hooks';

interface AddFriendButtonProps {
  targetUserId: string;
}

export const AddFriendButton = ({ targetUserId }: AddFriendButtonProps) => {
  const { isAuthenticated, isTrainee, user } = useAuth();
  const { data: status, isLoading } = useFriendshipStatus(
    targetUserId,
    isAuthenticated && isTrainee,
  );
  const sendRequest = useSendFriendRequest();

  // Don't show for non-trainees, unauthenticated users, or self
  if (!isAuthenticated || !isTrainee || user?.id === targetUserId) return null;

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        Loading
      </Button>
    );
  }

  if (status?.status === 'ACCEPTED') {
    return (
      <Button variant="outline" size="sm" disabled>
        <UserCheck className="mr-1.5 h-4 w-4 text-green-600" />
        Friends
      </Button>
    );
  }

  if (status?.status === 'PENDING') {
    return (
      <Button variant="outline" size="sm" disabled>
        <Clock className="mr-1.5 h-4 w-4" />
        Request Sent
      </Button>
    );
  }

  if (status?.status === 'BLOCKED') {
    return null;
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => sendRequest.mutate({ addresseeId: targetUserId })}
      disabled={sendRequest.isPending}
    >
      {sendRequest.isPending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="mr-1.5 h-4 w-4" />
      )}
      Add Friend
    </Button>
  );
};
