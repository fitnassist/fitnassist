export const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  SITE_DOMAIN: (import.meta.env.VITE_SITE_DOMAIN || 'sites.fitnassist.co').trim(),
} as const;
