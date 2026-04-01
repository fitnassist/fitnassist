import { Check, X, CalendarClock } from 'lucide-react';
import { Button, Badge, Card, CardContent } from '@/components/ui';
import { useBookingSuggestions, useRespondToSuggestion } from '@/api/booking';

interface SuggestionsListProps {
  bookingId: string;
  canRespond: boolean;
}

export const SuggestionsList = ({ bookingId, canRespond }: SuggestionsListProps) => {
  const { data: suggestions, isLoading } = useBookingSuggestions(bookingId);
  const respondMutation = useRespondToSuggestion();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading suggestions...</p>;
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const STATUS_VARIANT: Record<string, 'default' | 'success' | 'destructive' | 'warning'> = {
    PENDING: 'warning',
    ACCEPTED: 'success',
    DECLINED: 'destructive',
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <CalendarClock className="h-4 w-4" />
        Alternative Time Suggestions
      </h4>
      {suggestions.map(
        (suggestion: {
          id: string;
          date: string | Date;
          startTime: string;
          endTime: string;
          status: string;
          suggestor?: { name: string } | null;
        }) => (
          <Card key={suggestion.id}>
            <CardContent className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {new Date(suggestion.date).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  {suggestion.startTime} - {suggestion.endTime}
                </p>
                {suggestion.suggestor && (
                  <p className="text-xs text-muted-foreground">
                    Suggested by {suggestion.suggestor.name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {suggestion.status !== 'PENDING' && (
                  <Badge variant={STATUS_VARIANT[suggestion.status] ?? 'default'}>
                    {suggestion.status === 'ACCEPTED' ? 'Accepted' : 'Declined'}
                  </Badge>
                )}
                {suggestion.status === 'PENDING' && canRespond && (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        respondMutation.mutate({ suggestionId: suggestion.id, accept: true })
                      }
                      disabled={respondMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        respondMutation.mutate({ suggestionId: suggestion.id, accept: false })
                      }
                      disabled={respondMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </>
                )}
                {suggestion.status === 'PENDING' && !canRespond && (
                  <Badge variant="warning">Pending</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
};
