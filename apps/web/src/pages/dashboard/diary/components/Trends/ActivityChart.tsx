import { useState } from 'react';
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
import { ACTIVITY_TYPE_LABELS, formatDistance, formatActivityDuration } from '../../diary.utils';
import { CHART_TOOLTIP_STYLE } from './chart.constants';

interface ActivityChartProps {
  data: Array<{
    date: string;
    activityType: string;
    distanceKm: number | null;
    durationSeconds: number;
  }>;
}

const ACTIVITY_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All' },
  ...Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

type Metric = 'distance' | 'duration';

export const ActivityChart = ({ data }: ActivityChartProps) => {
  const [filter, setFilter] = useState('ALL');
  const [metric, setMetric] = useState<Metric>('distance');

  const filtered = filter === 'ALL' ? data : data.filter((d) => d.activityType === filter);

  if (filtered.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No activity data for this period
      </p>
    );
  }

  const chartData = filtered.map((d) => ({
    label: format(new Date(d.date), 'MMM d'),
    value: metric === 'distance' ? (d.distanceKm ?? 0) : d.durationSeconds / 60,
  }));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {ACTIVITY_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-primary text-gray-900'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          {(['distance', 'duration'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                metric === m
                  ? 'bg-primary text-gray-900'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {m === 'distance' ? 'Distance' : 'Duration'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => (metric === 'distance' ? `${v}km` : `${Math.round(v)}m`)}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
            formatter={(v) => [
              metric === 'distance'
                ? formatDistance(Number(v))
                : formatActivityDuration(Math.round(Number(v) * 60)),
              metric === 'distance' ? 'Distance' : 'Duration',
            ]}
          />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
