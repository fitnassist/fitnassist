import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Avatar, AvatarImage, AvatarFallback } from '@/components/ui';
import { useClientAdherence } from '@/api/analytics';
import { routes } from '@/config/routes';

const getAdherenceStatus = (entries: number) => {
  if (entries >= 5) return { label: 'Good', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' };
  if (entries >= 3) return { label: 'Fair', className: 'bg-amber-100 text-amber-700' };
  return { label: 'Low', className: 'bg-red-100 text-red-700' };
};

export const ClientAdherence = () => {
  const { data, isLoading } = useClientAdherence();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Adherence (7d)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No active clients to show
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-2 font-medium">Client</th>
                  <th className="pb-2 font-medium text-center">Entries This Week</th>
                  <th className="pb-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((client) => {
                  const status = getAdherenceStatus(client.entriesThisWeek);
                  return (
                    <tr key={client.clientRosterId} className="border-b last:border-0">
                      <td className="py-3">
                        <Link
                          to={routes.dashboardClientDetail(client.clientRosterId)}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Avatar className="h-7 w-7">
                            {client.avatarUrl && (
                              <AvatarImage src={client.avatarUrl} alt={client.clientName} />
                            )}
                            <AvatarFallback className="text-xs">
                              {client.clientName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{client.clientName}</span>
                        </Link>
                      </td>
                      <td className="py-3 text-center text-sm">{client.entriesThisWeek}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
