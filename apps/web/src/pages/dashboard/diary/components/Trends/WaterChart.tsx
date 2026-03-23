import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";

interface WaterChartProps {
  data: Array<{ date: string; totalMl: number }>;
  targetMl?: number;
}

export const WaterChart = ({ data, targetMl = 2000 }: WaterChartProps) => {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No water data for this period
      </p>
    );
  }

  const chartData = data.map((d) => ({
    label: format(new Date(d.date), "MMM d"),
    ml: d.totalMl,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}ml`} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v) => [`${v}ml`, "Water"]}
        />
        <Bar dataKey="ml" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        {targetMl > 0 && (
          <ReferenceLine y={targetMl} stroke="#ef4444" strokeDasharray="5 5" />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};
