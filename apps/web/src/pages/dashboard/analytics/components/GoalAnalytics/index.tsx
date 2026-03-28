import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useGoalAnalytics } from '@/api/analytics';

export const GoalAnalytics = () => {
  const { data, isLoading } = useGoalAnalytics();

  const chartData = (data ?? []).map((d) => ({
    name: d.clientName,
    completed: d.completed,
    active: d.active,
    abandoned: d.abandoned,
  }));

  const totalGoals = (data ?? []).reduce((sum, d) => sum + d.total, 0);
  const totalCompleted = (data ?? []).reduce((sum, d) => sum + d.completed, 0);
  const overallRate = totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goal Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] animate-pulse rounded bg-muted" />
        ) : chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No client goals to display
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{totalGoals}</p>
                <p className="text-xs text-muted-foreground">Total Goals Set</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{overallRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 50)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  width={100}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="hsl(170, 58%, 50%)" />
                <Bar dataKey="active" name="Active" stackId="a" fill="hsl(220, 45%, 65%)" />
                <Bar dataKey="abandoned" name="Abandoned" stackId="a" fill="hsl(0, 50%, 65%)" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};
