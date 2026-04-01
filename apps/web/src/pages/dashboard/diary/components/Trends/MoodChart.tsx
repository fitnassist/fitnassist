import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { CHART_TOOLTIP_STYLE } from './chart.constants';

const MOOD_VALUES: Record<string, number> = {
  TERRIBLE: 1,
  BAD: 2,
  OKAY: 3,
  GOOD: 4,
  GREAT: 5,
};

const MOOD_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

interface MoodChartProps {
  data: Array<{ date: string; level: string }>;
}

export const MoodChart = ({ data }: MoodChartProps) => {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No mood data for this period</p>
    );
  }

  const chartData = data.map((d) => ({
    label: format(new Date(d.date), 'MMM d'),
    value: MOOD_VALUES[d.level] ?? 3,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => MOOD_LABELS[v] ?? ''}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          itemStyle={{ color: '#fff' }}
          labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
          formatter={(v) => [MOOD_LABELS[v as number] ?? v, 'Mood']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#eab308"
          strokeWidth={2}
          dot={{ r: 3, fill: '#eab308' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
