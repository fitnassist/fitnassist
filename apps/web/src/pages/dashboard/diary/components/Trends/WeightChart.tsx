import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

interface WeightChartProps {
  data: Array<{ date: string; weightKg: number }>;
  goalWeight?: number | null;
  unitPreference: 'METRIC' | 'IMPERIAL';
}

const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;

export const WeightChart = ({ data, goalWeight, unitPreference }: WeightChartProps) => {
  const isImperial = unitPreference === 'IMPERIAL';
  const unit = isImperial ? 'lbs' : 'kg';

  const chartData = data.map(d => ({
    date: d.date,
    label: format(new Date(d.date), 'MMM d'),
    value: isImperial ? kgToLbs(d.weightKg) : d.weightKg,
  }));

  const goalValue = goalWeight ? (isImperial ? kgToLbs(goalWeight) : goalWeight) : null;

  if (chartData.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No weight data for this period</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis
          tick={{ fontSize: 11 }}
          domain={['auto', 'auto']}
          className="text-muted-foreground"
          tickFormatter={(v) => `${v}${unit}`}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(value) => [`${value} ${unit}`, 'Weight']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        {goalValue && (
          <ReferenceLine
            y={goalValue}
            stroke="hsl(var(--destructive))"
            strokeDasharray="5 5"
            label={{ value: `Goal: ${goalValue}${unit}`, fontSize: 11, position: 'right' }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};
