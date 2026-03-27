import { loadStripe } from '@stripe/stripe-js';
import { env } from '@/config/env';

export const stripePromise = env.STRIPE_PUBLISHABLE_KEY
  ? loadStripe(env.STRIPE_PUBLISHABLE_KEY)
  : null;
