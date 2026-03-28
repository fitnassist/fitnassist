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
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useBookingAnalytics } from '@/api/analytics';

export const BookingAnalytics = () => {
  const { data, isLoading } = useBookingAnalytics();

  const chartData = (data ?? []).map((d) => ({
    week: format(new Date(d.week + 'T00:00:00'), 'MMM d'),
    completed: d.completed,
    cancelled: d.cancelled,
    upcoming: d.upcoming,
  }));

  const totalBookings = chartData.reduce((sum, d) => sum + d.completed + d.cancelled + d.upcoming, 0);
  const totalCompleted = chartData.reduce((sum, d) => sum + d.completed, 0);
  const avgPerWeek = chartData.length > 0 ? Math.round(totalBookings / chartData.length) : 0;
  const completionRate = totalBookings > 0 ? Math.round((totalCompleted / totalBookings) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] animate-pulse rounded bg-muted" />
        ) : chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No bookings in the last 12 weeks
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{totalBookings}</p>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{avgPerWeek}</p>
                <p className="text-xs text-muted-foreground">Avg / Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="hsl(170, 58%, 50%)" />
                <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="hsl(0, 50%, 65%)" />
                <Bar dataKey="upcoming" name="Upcoming" stackId="a" fill="hsl(220, 45%, 65%)" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};
