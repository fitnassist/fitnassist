import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  kgToLbs,
  lbsToKg,
  cmToInches,
  inchesToCm,
  mlToFlOz,
  flOzToMl,
  formatWeight,
  formatMeasurement,
  formatWater,
  toDateString,
  today,
  nextDay,
  prevDay,
  isToday,
  formatDisplayDate,
  getMoodEmoji,
  getMoodLabel,
  getSleepQualityLabel,
  formatSteps,
  formatDuration,
  formatPace,
  formatActivityDuration,
  formatDistance,
  formatPBValue,
} from './diary.utils';

// =============================================================================
// UNIT CONVERSIONS
// =============================================================================

describe('kgToLbs', () => {
  it('converts 0 kg', () => {
    expect(kgToLbs(0)).toBe(0);
  });

  it('converts 1 kg', () => {
    expect(kgToLbs(1)).toBe(2.2);
  });

  it('converts 100 kg', () => {
    expect(kgToLbs(100)).toBe(220.5);
  });
});

describe('lbsToKg', () => {
  it('converts 0 lbs', () => {
    expect(lbsToKg(0)).toBe(0);
  });

  it('converts 100 lbs', () => {
    expect(lbsToKg(100)).toBe(45.4);
  });
});

describe('cmToInches', () => {
  it('converts 0 cm', () => {
    expect(cmToInches(0)).toBe(0);
  });

  it('converts 2.54 cm to 1 inch', () => {
    expect(cmToInches(2.54)).toBe(1);
  });

  it('converts 180 cm', () => {
    expect(cmToInches(180)).toBe(70.9);
  });
});

describe('inchesToCm', () => {
  it('converts 0 inches', () => {
    expect(inchesToCm(0)).toBe(0);
  });

  it('converts 1 inch to 2.5 cm', () => {
    expect(inchesToCm(1)).toBe(2.5);
  });
});

describe('mlToFlOz', () => {
  it('converts 0 ml', () => {
    expect(mlToFlOz(0)).toBe(0);
  });

  it('converts 500 ml', () => {
    expect(mlToFlOz(500)).toBe(16.9);
  });
});

describe('flOzToMl', () => {
  it('converts 0 fl oz', () => {
    expect(flOzToMl(0)).toBe(0);
  });

  it('converts 16 fl oz', () => {
    expect(flOzToMl(16)).toBe(473);
  });
});

// =============================================================================
// FORMAT HELPERS
// =============================================================================

describe('formatWeight', () => {
  it('formats metric', () => {
    expect(formatWeight(80, 'METRIC')).toBe('80 kg');
  });

  it('formats imperial', () => {
    expect(formatWeight(80, 'IMPERIAL')).toBe('176.4 lbs');
  });
});

describe('formatMeasurement', () => {
  it('formats metric', () => {
    expect(formatMeasurement(90, 'METRIC')).toBe('90 cm');
  });

  it('formats imperial', () => {
    expect(formatMeasurement(90, 'IMPERIAL')).toBe('35.4"');
  });
});

describe('formatWater', () => {
  it('formats metric', () => {
    expect(formatWater(2000, 'METRIC')).toBe('2000 ml');
  });

  it('formats imperial', () => {
    expect(formatWater(2000, 'IMPERIAL')).toBe('67.6 fl oz');
  });
});

// =============================================================================
// DATE HELPERS
// =============================================================================

describe('toDateString', () => {
  it('formats a date as yyyy-MM-dd', () => {
    expect(toDateString(new Date(2026, 0, 15))).toBe('2026-01-15');
  });

  it('pads single-digit months and days', () => {
    expect(toDateString(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
});

describe('today', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns current date as string', () => {
    expect(today()).toBe('2026-04-01');
  });
});

describe('nextDay', () => {
  it('returns the next day', () => {
    expect(nextDay('2026-04-01')).toBe('2026-04-02');
  });

  it('crosses month boundary', () => {
    expect(nextDay('2026-01-31')).toBe('2026-02-01');
  });
});

describe('prevDay', () => {
  it('returns the previous day', () => {
    expect(prevDay('2026-04-02')).toBe('2026-04-01');
  });

  it('crosses month boundary', () => {
    expect(prevDay('2026-02-01')).toBe('2026-01-31');
  });
});

describe('isToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for today', () => {
    expect(isToday('2026-04-01')).toBe(true);
  });

  it('returns false for a different date', () => {
    expect(isToday('2026-03-31')).toBe(false);
  });
});

describe('formatDisplayDate', () => {
  it('formats a date for display', () => {
    expect(formatDisplayDate('2026-04-01')).toBe('Wednesday, 1 April 2026');
  });

  it('formats another date', () => {
    expect(formatDisplayDate('2026-12-25')).toBe('Friday, 25 December 2026');
  });
});

// =============================================================================
// MOOD HELPERS
// =============================================================================

describe('getMoodEmoji', () => {
  it('returns emoji for known mood', () => {
    expect(getMoodEmoji('GREAT')).toBe('😄');
    expect(getMoodEmoji('TERRIBLE')).toBe('😫');
  });

  it('returns default emoji for unknown mood', () => {
    expect(getMoodEmoji('UNKNOWN')).toBe('😐');
  });
});

describe('getMoodLabel', () => {
  it('returns label for known mood', () => {
    expect(getMoodLabel('GOOD')).toBe('Good');
  });

  it('returns the input string for unknown mood', () => {
    expect(getMoodLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});

// =============================================================================
// SLEEP QUALITY
// =============================================================================

describe('getSleepQualityLabel', () => {
  it('returns labels for valid indices', () => {
    expect(getSleepQualityLabel(1)).toBe('Poor');
    expect(getSleepQualityLabel(3)).toBe('Good');
    expect(getSleepQualityLabel(5)).toBe('Excellent');
  });

  it('returns empty string for 0', () => {
    expect(getSleepQualityLabel(0)).toBe('');
  });

  it('returns empty string for out-of-range', () => {
    expect(getSleepQualityLabel(6)).toBe('');
    expect(getSleepQualityLabel(-1)).toBe('');
  });
});

// =============================================================================
// STEPS
// =============================================================================

describe('formatSteps', () => {
  it('formats steps under 1000', () => {
    expect(formatSteps(500)).toBe('500');
  });

  it('formats exact thousands without decimal', () => {
    expect(formatSteps(5000)).toBe('5K');
  });

  it('formats non-exact thousands with one decimal', () => {
    expect(formatSteps(5500)).toBe('5.5K');
  });

  it('formats 0 steps', () => {
    expect(formatSteps(0)).toBe('0');
  });
});

// =============================================================================
// WORKOUT DURATION
// =============================================================================

describe('formatDuration', () => {
  it('formats minutes under 60', () => {
    expect(formatDuration(45)).toBe('45min');
  });

  it('formats exact hours', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30min');
  });

  it('formats 0 minutes', () => {
    expect(formatDuration(0)).toBe('0min');
  });
});

// =============================================================================
// ACTIVITY HELPERS
// =============================================================================

describe('formatPace', () => {
  it('formats pace with padded seconds', () => {
    expect(formatPace(300)).toBe('5:00 /km');
  });

  it('formats pace with non-zero seconds', () => {
    expect(formatPace(330)).toBe('5:30 /km');
  });

  it('formats pace under a minute', () => {
    expect(formatPace(45)).toBe('0:45 /km');
  });
});

describe('formatActivityDuration', () => {
  it('formats seconds under 60', () => {
    expect(formatActivityDuration(45)).toBe('45s');
  });

  it('formats exact minutes', () => {
    expect(formatActivityDuration(300)).toBe('5m');
  });

  it('formats minutes and seconds', () => {
    expect(formatActivityDuration(125)).toBe('2m 5s');
  });

  it('formats hours and minutes', () => {
    expect(formatActivityDuration(3900)).toBe('1h 5m');
  });

  it('formats exact hours', () => {
    expect(formatActivityDuration(7200)).toBe('2h');
  });
});

describe('formatDistance', () => {
  it('formats distances under 1km in meters', () => {
    expect(formatDistance(0.5)).toBe('500m');
  });

  it('formats distances at or above 1km', () => {
    expect(formatDistance(5.123)).toBe('5.12 km');
  });

  it('formats exactly 1km', () => {
    expect(formatDistance(1)).toBe('1.00 km');
  });

  it('formats 0', () => {
    expect(formatDistance(0)).toBe('0m');
  });
});

// =============================================================================
// PERSONAL BEST
// =============================================================================

describe('formatPBValue', () => {
  it('formats seconds as mm:ss', () => {
    expect(formatPBValue(125, 'seconds')).toBe('2:05');
  });

  it('formats seconds as hh:mm:ss when over an hour', () => {
    expect(formatPBValue(3661, 'seconds')).toBe('1:01:01');
  });

  it('formats km', () => {
    expect(formatPBValue(5.1, 'km')).toBe('5.10 km');
  });

  it('formats kg', () => {
    expect(formatPBValue(100, 'kg')).toBe('100 kg');
  });

  it('formats steps', () => {
    expect(formatPBValue(10000, 'steps')).toBe('10,000 steps');
  });

  it('formats unknown unit as value + unit', () => {
    expect(formatPBValue(42, 'reps')).toBe('42 reps');
  });
});
