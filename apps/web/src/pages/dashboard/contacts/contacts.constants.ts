import type { TabValue } from './contacts.types';

export const DEFAULT_TAB: TabValue = 'connected';

export const TAB_CONFIG = {
  connected: {
    value: 'connected' as const,
    label: 'Connected',
    emptyMessage: 'No accepted connections yet.',
  },
  pending: {
    value: 'pending' as const,
    label: 'Pending',
    emptyMessage: 'No pending requests.',
  },
  declined: {
    value: 'declined' as const,
    label: 'Declined',
    emptyMessage: 'No declined requests.',
  },
} as const;
