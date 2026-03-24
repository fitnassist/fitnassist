import { Eye, Users, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { useDashboardStats } from '@/api/analytics';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

const StatCard = ({ label, value, icon }: StatCardProps) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

export const StatsRow = () => {
  const { data, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-14 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Profile Views (30d)"
        value={data?.profileViews30d ?? 0}
        icon={<Eye className="h-5 w-5" />}
      />
      <StatCard
        label="Active Clients"
        value={data?.activeClients ?? 0}
        icon={<Users className="h-5 w-5" />}
      />
      <StatCard
        label="Bookings (30d)"
        value={data?.bookings30d ?? 0}
        icon={<Calendar className="h-5 w-5" />}
      />
      <StatCard
        label="Completion Rate"
        value={`${data?.completionRate ?? 0}%`}
        icon={<CheckCircle className="h-5 w-5" />}
      />
    </div>
  );
};
