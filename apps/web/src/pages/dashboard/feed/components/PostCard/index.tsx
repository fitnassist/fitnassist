import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Globe, Users, Lock } from 'lucide-react';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  ConfirmDialog,
} from '@/components/ui';
import { useAuth } from '@/hooks';
import { useLikePost, useUnlikePost, useDeletePost } from '@/api/post';
import { routes } from '@/config/routes';
import { LikeButton } from '../LikeButton';
import { formatRelativeTime } from '../../feed.utils';

interface PostAuthor {
  id: string;
  name: string;
  image: string | null;
  role: string;
  trainerProfile: { profileImageUrl: string | null; handle: string | null } | null;
  traineeProfile: { avatarUrl: string | null; handle: string | null } | null;
}

interface PostCardProps {
  id: string;
  content: string;
  imageUrl: string | null;
  type: string;
  visibility: string;
  createdAt: string;
  user: PostAuthor;
  hasLiked: boolean;
  likeCount: number;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const getAvatarUrl = (user: PostAuthor) => {
  if (user.role === 'TRAINER') return user.trainerProfile?.profileImageUrl ?? user.image;
  return user.traineeProfile?.avatarUrl ?? user.image;
};

const getProfileUrl = (user: PostAuthor) => {
  if (user.role === 'TRAINER' && user.trainerProfile?.handle) {
    return routes.trainerPublicProfile(user.trainerProfile.handle);
  }
  if (user.role === 'TRAINEE') {
    const handle = user.traineeProfile?.handle;
    return routes.traineePublicProfile(handle ?? user.id);
  }
  return undefined;
};

const VisibilityIcon = ({ visibility }: { visibility: string }) => {
  switch (visibility) {
    case 'EVERYONE':
      return <Globe className="h-3 w-3" />;
    case 'PT_AND_FRIENDS':
      return <Users className="h-3 w-3" />;
    default:
      return <Lock className="h-3 w-3" />;
  }
};

export const PostCard = ({
  id,
  content,
  imageUrl,
  type,
  visibility,
  createdAt,
  user,
  hasLiked,
  likeCount,
}: PostCardProps) => {
  const { user: currentUser } = useAuth();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const deletePost = useDeletePost();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = currentUser?.id === user.id;
  const avatarUrl = getAvatarUrl(user);
  const profileUrl = getProfileUrl(user);

  const typeLabel =
    type === 'ACHIEVEMENT' ? 'New Achievement' :
    type === 'MILESTONE' ? 'Milestone' :
    null;

  return (
    <div className="rounded-lg border bg-card p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to={profileUrl ?? '#'} className="shrink-0">
          <Avatar className="h-10 w-10">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name} />}
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              to={profileUrl ?? '#'}
              className="text-sm font-medium hover:underline truncate"
            >
              {user.name}
            </Link>
            {typeLabel && (
              <span className="shrink-0 rounded-full bg-coral-100 px-2 py-0.5 text-xs font-medium text-coral-700 dark:bg-coral-900/30 dark:text-coral-300">
                {typeLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{formatRelativeTime(createdAt)}</span>
            <span>·</span>
            <VisibilityIcon visibility={visibility} />
          </div>
        </div>

        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="mt-3">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Post image"
            className="mt-3 rounded-lg max-h-96 w-full object-cover"
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center border-t pt-2">
        <LikeButton
          liked={hasLiked}
          count={likeCount}
          onLike={() => likePost.mutate({ postId: id })}
          onUnlike={() => unlikePost.mutate({ postId: id })}
          disabled={likePost.isPending || unlikePost.isPending}
        />
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete post?"
        description="This action cannot be undone. Your post will be permanently deleted."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deletePost.mutate({ postId: id })}
        isLoading={deletePost.isPending}
      />
    </div>
  );
};
