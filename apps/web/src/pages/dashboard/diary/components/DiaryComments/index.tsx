import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';

interface DiaryCommentsProps {
  entries?: Array<{
    id: string;
    type: string;
    comments?: Array<{
      id: string;
      content: string;
      createdAt: string | Date;
      user: { id: string; name: string; image: string | null };
    }>;
  }>;
}

export const DiaryComments = ({ entries }: DiaryCommentsProps) => {
  const allComments = (entries ?? []).flatMap((entry) =>
    (entry.comments ?? []).map((comment) => ({
      ...comment,
      entryType: entry.type,
    })),
  );

  if (allComments.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          Coach Comments
          <Badge>{allComments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allComments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm">{comment.content}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {comment.user.name} &middot; {format(new Date(comment.createdAt), 'MMM d, HH:mm')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
