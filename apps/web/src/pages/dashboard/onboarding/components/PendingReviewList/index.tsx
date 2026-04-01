import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ClipboardCheck } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { routes } from '@/config/routes';
import { useSubmittedResponses } from '@/api/onboarding';

export const PendingReviewList = () => {
  const { data: responses, isLoading } = useSubmittedResponses();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!responses?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No pending onboarding reviews.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {responses.map((response) => {
        const clientName = response.clientRoster.connection.sender?.name || 'Unknown';
        const clientRosterId = response.clientRoster.id;

        return (
          <Card key={response.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{clientName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Template: {response.template.name}
                    {' · '}
                    Submitted{' '}
                    {response.completedAt
                      ? formatDistanceToNow(new Date(response.completedAt), { addSuffix: true })
                      : ''}
                  </p>
                </div>
                <Link to={`${routes.dashboardClientDetail(clientRosterId)}?tab=onboarding`}>
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
