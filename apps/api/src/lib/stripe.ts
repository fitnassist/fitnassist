import Stripe from 'stripe';
import { env } from '../config/env';

if (!env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not set — Stripe features will be unavailable');
}

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' })
  : null;

export const getStripe = (): Stripe => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.');
  }
  return stripe;
};
