import type { IntegrationProvider } from '@fitnassist/database';

export interface ProviderMeta {
  provider: IntegrationProvider;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  dataTypes: string[];
  authPath: string;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    provider: 'STRAVA',
    name: 'Strava',
    description: 'Sync runs, rides, swims and other activities',
    color: 'text-[#FC4C02]',
    bgColor: 'bg-[#FC4C02]',
    dataTypes: ['Activities', 'GPS Routes', 'Heart Rate'],
    authPath: '/api/integrations/strava/auth',
  },
  {
    provider: 'GOOGLE_FIT',
    name: 'Google Fit',
    description: 'Sync steps, sleep, weight and activities',
    color: 'text-[#4285F4]',
    bgColor: 'bg-[#4285F4]',
    dataTypes: ['Steps', 'Sleep', 'Weight', 'Activities'],
    authPath: '/api/integrations/google-fit/auth',
  },
  {
    provider: 'FITBIT',
    name: 'Fitbit',
    description: 'Sync steps, sleep, heart rate, water and weight',
    color: 'text-[#00B0B9]',
    bgColor: 'bg-[#00B0B9]',
    dataTypes: ['Steps', 'Sleep', 'Heart Rate', 'Water', 'Weight', 'Activities'],
    authPath: '/api/integrations/fitbit/auth',
  },
  {
    provider: 'GARMIN',
    name: 'Garmin',
    description: 'Sync activities, steps, sleep and body data',
    color: 'text-[#007CC3]',
    bgColor: 'bg-[#007CC3]',
    dataTypes: ['Activities', 'Steps', 'Sleep', 'Weight'],
    authPath: '/api/integrations/garmin/auth',
  },
];

export const SYNC_PREFERENCE_LABELS: Record<string, string> = {
  activities: 'Activities',
  steps: 'Steps',
  sleep: 'Sleep',
  weight: 'Weight',
  water: 'Water',
};
