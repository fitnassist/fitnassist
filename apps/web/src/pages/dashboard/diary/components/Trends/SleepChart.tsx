import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { format } from 'date-fns';
import { CHART_TOOLTIP_STYLE } from './chart.constants';

interface SleepChartProps {
  data: Array<{ date: string; hoursSlept: number; quality: number }>;
}

export const SleepChart = ({ data }: SleepChartProps) => {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No sleep data for this period</p>;
  }

  const chartData = data.map(d => ({
    label: format(new Date(d.date), 'MMM d'),
    Hours: d.hoursSlept,
    Quality: d.quality,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="hours" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}h`} />
        <YAxis yAxisId="quality" orientation="right" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} itemStyle={{ color: '#fff' }} labelStyle={{ color: 'rgba(255,255,255,0.7)' }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar yAxisId="hours" dataKey="Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
        <Line yAxisId="quality" type="monotone" dataKey="Quality" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
