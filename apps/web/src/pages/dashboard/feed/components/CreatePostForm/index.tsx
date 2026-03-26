import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button, Textarea } from '@/components/ui';
import { useCreatePost } from '@/api/post';

export const CreatePostForm = () => {
  const [content, setContent] = useState('');
  const createPost = useCreatePost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createPost.mutate(
      { content: content.trim() },
      {
        onSuccess: () => setContent(''),
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What's on your mind?"
        rows={3}
        className="resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
        maxLength={5000}
        disabled={createPost.isPending}
      />

      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">
          {content.length > 0 && `${content.length}/5000`}
        </span>
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || createPost.isPending}
        >
          {createPost.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Post
        </Button>
      </div>

      {createPost.error && (
        <p className="mt-2 text-sm text-destructive">{createPost.error.message}</p>
      )}
    </form>
  );
};
