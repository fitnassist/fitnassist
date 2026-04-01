import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { useMyBlogPosts } from '@/api/website';
import { BlogPostForm } from './BlogPostForm';
import { BlogPostList } from './BlogPostList';

export const BlogManager = () => {
  const { data, isLoading } = useMyBlogPosts();
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-12 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const blogPosts = data?.posts ?? [];

  if (blogPosts.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Blog Posts Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Start writing blog posts to share your fitness knowledge and attract new clients.
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Blog Post</DialogTitle>
            </DialogHeader>
            <BlogPostForm onClose={() => setIsCreating(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      <BlogPostList posts={blogPosts} />

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Blog Post</DialogTitle>
          </DialogHeader>
          <BlogPostForm onClose={() => setIsCreating(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
