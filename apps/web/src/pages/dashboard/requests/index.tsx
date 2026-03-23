import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Phone,
  UserPlus,
  Check,
  X,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SkeletonHeader,
  SkeletonTabs,
  SkeletonCardList,
  ResponsiveTabs,
  TabsContent,
  Avatar,
  AvatarFallback,
} from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useTabParam } from '@/hooks';
import { trpc } from '@/lib/trpc';
import { routes } from '@/config/routes';

type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'RESPONDED' | 'CLOSED';

export const RequestsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useTabParam<'all' | 'callbacks' | 'connections'>('all');

  const { data: requests, isLoading } = trpc.contact.getMyRequests.useQuery();

  const utils = trpc.useUtils();
  const acceptMutation = trpc.contact.acceptConnection.useMutation({
    onSuccess: (data) => {
      utils.contact.getMyRequests.invalidate();
      utils.contact.getStats.invalidate();
      utils.clientRoster.list.invalidate();
      utils.clientRoster.stats.invalidate();
      utils.message.getConnections.invalidate();
      // Navigate to the message thread after accepting
      navigate(routes.dashboardMessageThread(data.id));
    },
  });

  const declineMutation = trpc.contact.declineConnection.useMutation({
    onSuccess: () => {
      utils.contact.getMyRequests.invalidate();
      utils.contact.getStats.invalidate();
    },
  });

  const updateStatusMutation = trpc.contact.updateStatus.useMutation({
    onSuccess: () => {
      utils.contact.getMyRequests.invalidate();
      utils.contact.getStats.invalidate();
    },
  });

  // Filter out accepted connections - they belong in Contacts page
  const activeRequests = requests?.filter((r) =>
    !(r.type === 'CONNECTION_REQUEST' && r.status === 'ACCEPTED')
  ) || [];

  const filteredRequests = activeRequests.filter((request) => {
    if (activeTab === 'callbacks') return request.type === 'CALLBACK_REQUEST';
    if (activeTab === 'connections') return request.type === 'CONNECTION_REQUEST';
    return true;
  });

  const pendingCount = activeRequests.filter((r) => r.status === 'PENDING').length;
  const callbackCount = activeRequests.filter((r) => r.type === 'CALLBACK_REQUEST').length;
  const connectionCount = activeRequests.filter((r) => r.type === 'CONNECTION_REQUEST').length;

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            <XCircle className="h-3 w-3" />
            Declined
          </span>
        );
      case 'RESPONDED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            <CheckCircle className="h-3 w-3" />
            Responded
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
            Closed
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageLayout.Content>
          <SkeletonHeader />
          <SkeletonTabs count={3} />
          <SkeletonCardList count={4} />
        </PageLayout.Content>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageLayout.Header
        title="Requests"
        description="Manage callback and connection requests from trainees"
      />
      <ResponsiveTabs
        value={activeTab}
        onValueChange={setActiveTab}
        options={[
          { value: 'all', label: `All (${activeRequests.length})` },
          { value: 'callbacks', label: `Callbacks (${callbackCount})`, icon: <Phone className="h-4 w-4" /> },
          { value: 'connections', label: `Connections (${connectionCount})`, icon: <UserPlus className="h-4 w-4" /> },
        ]}
        tabsListClassName="mb-6"
      >
        <TabsContent value={activeTab}>
          {pendingCount > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              You have {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} to review.
            </div>
          )}

          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No requests yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const initials = request.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <Card key={request.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {request.name}
                              {request.type === 'CALLBACK_REQUEST' ? (
                                <Phone className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                              )}
                            </CardTitle>
                            <CardDescription>
                              {request.email}
                              {request.phone && ` • ${request.phone}`}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status as RequestStatus)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {request.message && (
                        <div className="mb-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{request.message}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </p>

                        <div className="flex gap-2">
                          {request.status === 'PENDING' && request.type === 'CONNECTION_REQUEST' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => declineMutation.mutate({ requestId: request.id })}
                                disabled={declineMutation.isPending}
                              >
                                {declineMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4 mr-1" />
                                )}
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => acceptMutation.mutate({ requestId: request.id })}
                                disabled={acceptMutation.isPending}
                              >
                                {acceptMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                Accept
                              </Button>
                            </>
                          )}

                          {request.status === 'PENDING' && request.type === 'CALLBACK_REQUEST' && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  requestId: request.id,
                                  status: 'RESPONDED',
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              {updateStatusMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 mr-1" />
                              )}
                              Mark as Called
                            </Button>
                          )}

                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </ResponsiveTabs>
    </PageLayout>
  );
}

export default RequestsPage;
