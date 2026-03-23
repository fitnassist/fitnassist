import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { format } from 'date-fns';

const MEASUREMENT_COLORS: Record<string, string> = {
  chestCm: '#ef4444',
  waistCm: '#f97316',
  hipsCm: '#eab308',
  bicepCm: '#22c55e',
  thighCm: '#3b82f6',
  calfCm: '#8b5cf6',
  neckCm: '#ec4899',
};

const MEASUREMENT_LABELS: Record<string, string> = {
  chestCm: 'Chest',
  waistCm: 'Waist',
  hipsCm: 'Hips',
  bicepCm: 'Bicep',
  thighCm: 'Thigh',
  calfCm: 'Calf',
  neckCm: 'Neck',
};

interface MeasurementChartProps {
  data: Array<{
    date: string;
    chestCm?: number | null;
    waistCm?: number | null;
    hipsCm?: number | null;
    bicepCm?: number | null;
    thighCm?: number | null;
    calfCm?: number | null;
    neckCm?: number | null;
  }>;
  unitPreference: 'METRIC' | 'IMPERIAL';
}

const cmToInches = (cm: number) => Math.round(cm / 2.54 * 10) / 10;

export const MeasurementChart = ({ data, unitPreference }: MeasurementChartProps) => {
  const isImperial = unitPreference === 'IMPERIAL';
  const unit = isImperial ? 'in' : 'cm';

  // Find which measurements have data
  const fields = Object.keys(MEASUREMENT_LABELS).filter(field =>
    data.some(d => (d as Record<string, unknown>)[field] != null)
  );

  if (fields.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No measurement data for this period</p>;
  }

  const chartData = data.map(d => {
    const point: Record<string, string | number> = {
      label: format(new Date(d.date), 'MMM d'),
    };
    for (const field of fields) {
      const val = (d as Record<string, unknown>)[field];
      if (val != null) {
        point[field] = isImperial ? cmToInches(val as number) : (val as number);
      }
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}${unit}`} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {fields.map(field => (
          <Line
            key={field}
            type="monotone"
            dataKey={field}
            name={MEASUREMENT_LABELS[field]}
            stroke={MEASUREMENT_COLORS[field]}
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
