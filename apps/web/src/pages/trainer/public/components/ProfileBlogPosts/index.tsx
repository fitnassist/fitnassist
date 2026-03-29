import { Calendar, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';

interface ProfileBlogPostsProps {
  subdomain: string;
}

export const ProfileBlogPosts = ({ subdomain }: ProfileBlogPostsProps) => {
  const { data, isLoading } = trpc.blog.getPublicPosts.useQuery(
    { subdomain, limit: 3 },
    { enabled: !!subdomain }
  );

  const posts = data?.posts ?? [];

  if (!isLoading && posts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
          <BookOpen className="h-5 w-5" />
          Blog
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-20 w-28 shrink-0 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const formattedDate = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : null;

              return (
                <a
                  key={post.id}
                  href={`https://${subdomain}.fitnassist.co/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-4 rounded-md p-2 transition-colors hover:bg-muted"
                >
                  {post.coverImageUrl && (
                    <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md">
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium line-clamp-2">{post.title}</h3>
                    {post.excerpt && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    {formattedDate && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formattedDate}</span>
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
