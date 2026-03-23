import { describe, it, expect } from 'vitest';
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
  formatHeight,
  formatWeight,
} from './unitConversion';

describe('cmToFeetInches', () => {
  it('converts 180 cm correctly', () => {
    const result = cmToFeetInches(180);
    expect(result.feet).toBe(5);
    expect(result.inches).toBe(11);
  });

  it('converts 152.4 cm (5 feet exactly)', () => {
    const result = cmToFeetInches(152.4);
    expect(result.feet).toBe(5);
    expect(result.inches).toBe(0);
  });

  it('handles 0', () => {
    const result = cmToFeetInches(0);
    expect(result.feet).toBe(0);
    expect(result.inches).toBe(0);
  });
});

describe('feetInchesToCm', () => {
  it('converts 5 feet 11 inches', () => {
    const result = feetInchesToCm(5, 11);
    expect(result).toBeCloseTo(180.34, 1);
  });

  it('converts 5 feet 0 inches', () => {
    const result = feetInchesToCm(5, 0);
    expect(result).toBeCloseTo(152.4, 1);
  });

  it('handles 0', () => {
    expect(feetInchesToCm(0, 0)).toBe(0);
  });
});

describe('kgToLbs', () => {
  it('converts 80 kg', () => {
    expect(kgToLbs(80)).toBe(176.4);
  });

  it('handles 0', () => {
    expect(kgToLbs(0)).toBe(0);
  });
});

describe('lbsToKg', () => {
  it('converts 176 lbs', () => {
    expect(lbsToKg(176)).toBe(79.8);
  });

  it('handles 0', () => {
    expect(lbsToKg(0)).toBe(0);
  });
});

describe('formatHeight', () => {
  it('formats metric', () => {
    expect(formatHeight(178.5, 'METRIC')).toBe('179 cm');
  });

  it('formats imperial', () => {
    expect(formatHeight(180, 'IMPERIAL')).toBe("5'11\"");
  });
});

describe('formatWeight', () => {
  it('formats metric', () => {
    expect(formatWeight(80, 'METRIC')).toBe('80 kg');
  });

  it('formats imperial', () => {
    expect(formatWeight(80, 'IMPERIAL')).toBe('176.4 lbs');
  });

  it('formats metric with decimal', () => {
    expect(formatWeight(80.55, 'METRIC')).toBe('80.6 kg');
  });
});
