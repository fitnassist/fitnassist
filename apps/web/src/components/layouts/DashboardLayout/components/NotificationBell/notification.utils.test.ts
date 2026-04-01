import { Bell, Calendar } from 'lucide-react';
import { getNotificationIcon, formatRelativeTime } from './notification.utils';

describe('getNotificationIcon', () => {
  it('returns the mapped icon for a known type', () => {
    expect(getNotificationIcon('BOOKING_CREATED')).toBe(Calendar);
  });

  it('returns Bell for an unknown type', () => {
    expect(getNotificationIcon('UNKNOWN_TYPE')).toBe(Bell);
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for less than 60 seconds ago', () => {
    const date = new Date('2026-04-01T11:59:30Z');
    expect(formatRelativeTime(date)).toBe('just now');
  });

  it('returns minutes ago for less than 60 minutes', () => {
    const date = new Date('2026-04-01T11:45:00Z');
    expect(formatRelativeTime(date)).toBe('15m ago');
  });

  it('returns hours ago for less than 24 hours', () => {
    const date = new Date('2026-04-01T09:00:00Z');
    expect(formatRelativeTime(date)).toBe('3h ago');
  });

  it('returns days ago for less than 7 days', () => {
    const date = new Date('2026-03-29T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('3d ago');
  });

  it('returns formatted date for 7 or more days ago', () => {
    const date = new Date('2026-03-20T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('20 Mar');
  });

  it('accepts a date string', () => {
    expect(formatRelativeTime('2026-04-01T11:59:30Z')).toBe('just now');
  });

  it('accepts a Date object', () => {
    expect(formatRelativeTime(new Date('2026-04-01T11:45:00Z'))).toBe('15m ago');
  });
});
