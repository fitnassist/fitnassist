import { getServiceLabel, getQualificationLabel, getTravelOptionDisplay, getPostcodeArea, formatRate } from './public.utils';

describe('getServiceLabel', () => {
  it('returns the label for a known service', () => {
    expect(getServiceLabel('personal-training')).toBe('Personal Training');
  });

  it('returns the raw value for an unknown service', () => {
    expect(getServiceLabel('unknown-service')).toBe('unknown-service');
  });
});

describe('getQualificationLabel', () => {
  it('returns the label for a known qualification', () => {
    expect(getQualificationLabel('level-3-pt')).toBe('Level 3 Personal Trainer');
  });

  it('returns the raw value for an unknown qualification', () => {
    expect(getQualificationLabel('made-up-cert')).toBe('made-up-cert');
  });
});

describe('getTravelOptionDisplay', () => {
  it('returns correct display for CLIENT_TRAVELS', () => {
    expect(getTravelOptionDisplay('CLIENT_TRAVELS')).toEqual({
      label: 'Studio/Gym Based',
      description: "Clients travel to trainer's location",
    });
  });

  it('returns correct display for BOTH', () => {
    expect(getTravelOptionDisplay('BOTH')).toEqual({
      label: 'Flexible Location',
      description: 'Both studio and mobile sessions available',
    });
  });

  it('returns fallback for unknown value', () => {
    expect(getTravelOptionDisplay('UNKNOWN')).toEqual({
      label: 'UNKNOWN',
      description: '',
    });
  });
});

describe('getPostcodeArea', () => {
  it('returns empty string for null', () => {
    expect(getPostcodeArea(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(getPostcodeArea(undefined)).toBe('');
  });

  it('extracts outward code from a full postcode', () => {
    expect(getPostcodeArea('SW1A 1AA')).toBe('SW1A');
  });

  it('handles lowercase input', () => {
    expect(getPostcodeArea('ec2a 3ar')).toBe('EC2A');
  });
});

describe('formatRate', () => {
  it('returns null when both min and max are null', () => {
    expect(formatRate(null, null)).toBeNull();
  });

  it('returns single rate when min and max are equal', () => {
    expect(formatRate(5000, 5000)).toBe('£50/hr');
  });

  it('returns range when min and max differ', () => {
    expect(formatRate(3000, 6000)).toBe('£30 - £60/hr');
  });

  it('returns "From" when only min is provided', () => {
    expect(formatRate(4000, null)).toBe('From £40/hr');
  });

  it('returns "Up to" when only max is provided', () => {
    expect(formatRate(null, 8000)).toBe('Up to £80/hr');
  });
});
