import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useDiaryRange } from '@/api/diary';
import { TrendDateRange } from './TrendDateRange';
import { WeightChart } from './WeightChart';
import { MeasurementChart } from './MeasurementChart';
import { NutritionChart } from './NutritionChart';
import { WaterChart } from './WaterChart';
import { MoodChart } from './MoodChart';
import { SleepChart } from './SleepChart';
import { ActivityChart } from './ActivityChart';
import { StepsChart } from './StepsChart';
import { ChartTabBar } from './ChartTabBar';

type ChartType = 'weight' | 'measurements' | 'nutrition' | 'water' | 'mood' | 'sleep' | 'activity' | 'steps';

const CHART_TABS: Array<{ key: ChartType; label: string }> = [
  { key: 'weight', label: 'Weight' },
  { key: 'measurements', label: 'Measurements' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'water', label: 'Water' },
  { key: 'activity', label: 'Activity' },
  { key: 'steps', label: 'Steps' },
  { key: 'mood', label: 'Mood' },
  { key: 'sleep', label: 'Sleep' },
];

interface TrendsProps {
  unitPreference: 'METRIC' | 'IMPERIAL';
}

export const Trends = ({ unitPreference }: TrendsProps) => {
  const [days, setDays] = useState(30);
  const [activeChart, setActiveChart] = useState<ChartType>('weight');

  const endDate = format(new Date(), 'yyyy-MM-dd');
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

  const { data: entries } = useDiaryRange(startDate, endDate);

  const weightData = (entries ?? [])
    .filter(e => e.type === 'WEIGHT' && e.weightEntry)
    .map(e => ({ date: e.date as unknown as string, weightKg: e.weightEntry!.weightKg }));

  const measurementData = (entries ?? [])
    .filter(e => e.type === 'MEASUREMENT' && e.measurementEntry)
    .map(e => ({
      date: e.date as unknown as string,
      ...e.measurementEntry!,
    }));

  const nutritionData = (entries ?? [])
    .filter(e => e.type === 'FOOD' && e.foodEntries && e.foodEntries.length > 0)
    .map(e => {
      const foods = e.foodEntries ?? [];
      return {
        date: e.date as unknown as string,
        calories: foods.reduce((sum, f) => sum + f.calories, 0),
        protein: foods.reduce((sum, f) => sum + (f.proteinG ?? 0), 0),
        carbs: foods.reduce((sum, f) => sum + (f.carbsG ?? 0), 0),
        fat: foods.reduce((sum, f) => sum + (f.fatG ?? 0), 0),
      };
    });

  const waterData = (entries ?? [])
    .filter(e => e.type === 'WATER' && e.waterEntry)
    .map(e => ({ date: e.date as unknown as string, totalMl: e.waterEntry!.totalMl }));

  const moodData = (entries ?? [])
    .filter(e => e.type === 'MOOD' && e.moodEntry)
    .map(e => ({ date: e.date as unknown as string, level: e.moodEntry!.level }));

  const sleepData = (entries ?? [])
    .filter(e => e.type === 'SLEEP' && e.sleepEntry)
    .map(e => ({
      date: e.date as unknown as string,
      hoursSlept: e.sleepEntry!.hoursSlept,
      quality: e.sleepEntry!.quality,
    }));

  const activityData = (entries ?? [])
    .filter(e => e.type === 'ACTIVITY' && e.activityEntry)
    .map(e => ({
      date: e.date as unknown as string,
      activityType: (e as { activityEntry: { activityType: string } }).activityEntry.activityType,
      distanceKm: (e as { activityEntry: { distanceKm: number | null } }).activityEntry.distanceKm,
      durationSeconds: (e as { activityEntry: { durationSeconds: number } }).activityEntry.durationSeconds,
    }));

  const stepsData = (entries ?? [])
    .filter(e => e.type === 'STEPS' && e.stepsEntry)
    .map(e => ({ date: e.date as unknown as string, totalSteps: e.stepsEntry!.totalSteps }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Trends
          </CardTitle>
          <TrendDateRange selectedDays={days} onChange={setDays} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart type tabs */}
        <ChartTabBar tabs={CHART_TABS} activeTab={activeChart} onTabChange={setActiveChart} />

        {/* Active chart */}
        {activeChart === 'weight' && <WeightChart data={weightData} unitPreference={unitPreference} />}
        {activeChart === 'measurements' && <MeasurementChart data={measurementData} unitPreference={unitPreference} />}
        {activeChart === 'nutrition' && <NutritionChart data={nutritionData} />}
        {activeChart === 'water' && <WaterChart data={waterData} />}
        {activeChart === 'mood' && <MoodChart data={moodData} />}
        {activeChart === 'sleep' && <SleepChart data={sleepData} />}
        {activeChart === 'activity' && <ActivityChart data={activityData} />}
        {activeChart === 'steps' && <StepsChart data={stepsData} />}
      </CardContent>
    </Card>
  );
};
