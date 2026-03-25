import { format, addDays, subDays } from 'date-fns';

// =============================================================================
// UNIT CONVERSIONS (always store metric, convert on display)
// =============================================================================

export const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
export const lbsToKg = (lbs: number) => Math.round(lbs / 2.20462 * 10) / 10;
export const cmToInches = (cm: number) => Math.round(cm / 2.54 * 10) / 10;
export const inchesToCm = (inches: number) => Math.round(inches * 2.54 * 10) / 10;
export const mlToFlOz = (ml: number) => Math.round(ml / 29.5735 * 10) / 10;
export const flOzToMl = (flOz: number) => Math.round(flOz * 29.5735);

export const formatWeight = (kg: number, unit: 'METRIC' | 'IMPERIAL') => {
  if (unit === 'IMPERIAL') {
    return `${kgToLbs(kg)} lbs`;
  }
  return `${kg} kg`;
};

export const formatMeasurement = (cm: number, unit: 'METRIC' | 'IMPERIAL') => {
  if (unit === 'IMPERIAL') {
    return `${cmToInches(cm)}"`;
  }
  return `${cm} cm`;
};

export const formatWater = (ml: number, unit: 'METRIC' | 'IMPERIAL') => {
  if (unit === 'IMPERIAL') {
    return `${mlToFlOz(ml)} fl oz`;
  }
  return `${ml} ml`;
};

// =============================================================================
// DATE HELPERS
// =============================================================================

export const toDateString = (date: Date) => format(date, 'yyyy-MM-dd');
export const today = () => toDateString(new Date());
export const nextDay = (dateStr: string) => toDateString(addDays(new Date(dateStr), 1));
export const prevDay = (dateStr: string) => toDateString(subDays(new Date(dateStr), 1));
export const isToday = (dateStr: string) => dateStr === today();
export const formatDisplayDate = (dateStr: string) => format(new Date(dateStr), 'EEEE, d MMMM yyyy');

// =============================================================================
// MOOD HELPERS
// =============================================================================

export const MOOD_OPTIONS = [
  { value: 'TERRIBLE' as const, label: 'Terrible', emoji: '😫' },
  { value: 'BAD' as const, label: 'Bad', emoji: '😞' },
  { value: 'OKAY' as const, label: 'Okay', emoji: '😐' },
  { value: 'GOOD' as const, label: 'Good', emoji: '😊' },
  { value: 'GREAT' as const, label: 'Great', emoji: '😄' },
] as const;

export const getMoodEmoji = (level: string) =>
  MOOD_OPTIONS.find(m => m.value === level)?.emoji ?? '😐';

export const getMoodLabel = (level: string) =>
  MOOD_OPTIONS.find(m => m.value === level)?.label ?? level;

// =============================================================================
// SLEEP QUALITY HELPERS
// =============================================================================

export const SLEEP_QUALITY_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] as const;

export const getSleepQualityLabel = (quality: number) => SLEEP_QUALITY_LABELS[quality] ?? '';

// =============================================================================
// WATER PRESETS (ml)
// =============================================================================

export const WATER_PRESETS = [
  { label: 'Glass', ml: 250 },
  { label: 'Bottle', ml: 500 },
  { label: 'Large', ml: 750 },
] as const;

// =============================================================================
// STEPS HELPERS
// =============================================================================

export const STEPS_PRESETS = [
  { label: '+1K', steps: 1000 },
  { label: '+2.5K', steps: 2500 },
  { label: '+5K', steps: 5000 },
] as const;

export const formatSteps = (steps: number) => {
  if (steps >= 1000) {
    return `${(steps / 1000).toFixed(steps % 1000 === 0 ? 0 : 1)}K`;
  }
  return steps.toLocaleString();
};

// =============================================================================
// WORKOUT HELPERS
// =============================================================================

export const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
};

// =============================================================================
// ACTIVITY HELPERS
// =============================================================================

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  RUN: 'Run',
  WALK: 'Walk',
  CYCLE: 'Cycle',
  SWIM: 'Swim',
  HIKE: 'Hike',
  OTHER: 'Other',
};

export const ACTIVITY_TYPE_OPTIONS = Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const formatPace = (secPerKm: number) => {
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.round(secPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
};

export const formatActivityDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

export const formatDistance = (km: number) => {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(2)} km`;
};

// =============================================================================
// PERSONAL BEST HELPERS
// =============================================================================

export const formatPBValue = (value: number, unit: string) => {
  switch (unit) {
    case 'seconds': {
      const hrs = Math.floor(value / 3600);
      const mins = Math.floor((value % 3600) / 60);
      const secs = Math.round(value % 60);
      if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    case 'km':
      return `${value.toFixed(2)} km`;
    case 'kg':
      return `${value} kg`;
    case 'steps':
      return `${value.toLocaleString()} steps`;
    default:
      return `${value} ${unit}`;
  }
};
