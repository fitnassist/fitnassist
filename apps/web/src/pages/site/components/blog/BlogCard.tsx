import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

interface BlogCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  tags: string[];
  onNavigate: (slug: string) => void;
}

export const BlogCard = ({
  title,
  slug,
  excerpt,
  coverImageUrl,
  publishedAt,
  tags,
  onNavigate,
}: BlogCardProps) => {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Card
      className="cursor-pointer overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-shadow hover:shadow-lg"
      onClick={() => onNavigate(slug)}
    >
      {coverImageUrl && (
        <div className="aspect-video overflow-hidden">
          <img
            src={coverImageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <CardContent className="p-5">
        <h3 className="site-heading text-lg font-semibold text-[hsl(var(--card-foreground))] line-clamp-2">
          {title}
        </h3>
        {excerpt && (
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] line-clamp-3">
            {excerpt}
          </p>
        )}
        <div className="mt-4 flex items-center gap-3">
          {formattedDate && (
            <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-[hsl(var(--muted-foreground))]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
