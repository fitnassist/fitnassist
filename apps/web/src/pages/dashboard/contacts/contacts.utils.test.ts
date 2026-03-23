import { describe, it, expect } from 'vitest';
import { getInitials } from './contacts.utils';

describe('getInitials', () => {
  it('returns two initials for two-word name', () => {
    expect(getInitials('John Smith')).toBe('JS');
  });

  it('returns one initial for single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('returns first two initials for multi-word name', () => {
    expect(getInitials('John Michael Smith')).toBe('JM');
  });

  it('uppercases lowercase names', () => {
    expect(getInitials('john smith')).toBe('JS');
  });
});
