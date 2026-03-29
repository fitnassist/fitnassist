import { useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
  GlobeLock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  Badge,
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import {
  useDeleteBlogPost,
  usePublishBlogPost,
  useUnpublishBlogPost,
} from '@/api/website';
import { BlogPostForm } from './BlogPostForm';
import type { BlogPost } from './BlogManager.types';

interface BlogPostListProps {
  posts: BlogPost[];
}

export const BlogPostList = ({ posts }: BlogPostListProps) => {
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const deleteBlogPost = useDeleteBlogPost();
  const publishBlogPost = usePublishBlogPost();
  const unpublishBlogPost = useUnpublishBlogPost();

  return (
    <>
      <div className="space-y-3">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">{post.title}</p>
                  <Badge
                    variant={
                      post.status === 'PUBLISHED' ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {post.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {post.publishedAt
                    ? `Published ${formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}`
                    : `Updated ${formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}`}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingPost(post)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  {post.status === 'PUBLISHED' ? (
                    <DropdownMenuItem
                      onClick={() =>
                        unpublishBlogPost.mutate({ postId: post.id })
                      }
                    >
                      <GlobeLock className="mr-2 h-4 w-4" />
                      Unpublish
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() =>
                        publishBlogPost.mutate({ postId: post.id })
                      }
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Publish
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteTarget(post.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!editingPost}
        onOpenChange={(open) => !open && setEditingPost(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          {editingPost && (
            <BlogPostForm
              post={editingPost}
              onClose={() => setEditingPost(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete blog post?"
        description="This post will be permanently deleted."
        onConfirm={() => {
          if (deleteTarget) deleteBlogPost.mutate({ postId: deleteTarget });
          setDeleteTarget(null);
        }}
        isLoading={deleteBlogPost.isPending}
      />
    </>
  );
};
