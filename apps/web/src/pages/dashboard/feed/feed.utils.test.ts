import { formatRelativeTime } from './feed.utils';

const NOW = new Date('2026-04-01T12:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('formatRelativeTime', () => {
  it('returns "just now" for less than 60 seconds ago', () => {
    const date = new Date(NOW.getTime() - 30 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('just now');
  });

  it('returns minutes ago for less than 60 minutes', () => {
    const date = new Date(NOW.getTime() - 15 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('15m ago');
  });

  it('returns hours ago for less than 24 hours', () => {
    const date = new Date(NOW.getTime() - 5 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('5h ago');
  });

  it('returns days ago for less than 7 days', () => {
    const date = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('3d ago');
  });

  it('returns formatted date for 7+ days ago', () => {
    const date = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('22 Mar');
  });
});
