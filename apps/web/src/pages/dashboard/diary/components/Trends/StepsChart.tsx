import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { CHART_TOOLTIP_STYLE } from './chart.constants';

interface StepsChartProps {
  data: Array<{ date: string; totalSteps: number }>;
  goalSteps?: number;
}

export const StepsChart = ({ data, goalSteps = 10000 }: StepsChartProps) => {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No steps data for this period
      </p>
    );
  }

  const chartData = data.map((d) => ({
    label: format(new Date(d.date), 'MMM d'),
    steps: d.totalSteps,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`)}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          itemStyle={{ color: '#fff' }}
          labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
          formatter={(v) => [`${Number(v).toLocaleString()} steps`, 'Steps']}
        />
        <Bar dataKey="steps" fill="#14b8a6" radius={[4, 4, 0, 0]} />
        {goalSteps > 0 && <ReferenceLine y={goalSteps} stroke="#ef4444" strokeDasharray="5 5" />}
      </BarChart>
    </ResponsiveContainer>
  );
};
