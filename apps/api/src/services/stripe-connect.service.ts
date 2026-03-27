import { getStripe } from '../lib/stripe';
import { env } from '../config/env';

export const stripeConnectService = {
  /**
   * Create a Standard connected account for a trainer.
   */
  createConnectedAccount: async (email: string) => {
    const stripe = getStripe();
    const account = await stripe.accounts.create({
      type: 'standard',
      email,
      metadata: { platform: 'fitnassist' },
    });
    return account.id;
  },

  /**
   * Generate a Stripe hosted onboarding link for a connected account.
   */
  createOnboardingLink: async (accountId: string) => {
    const stripe = getStripe();
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${env.FRONTEND_URL}/dashboard/settings?tab=payments&stripe=refresh`,
      return_url: `${env.FRONTEND_URL}/dashboard/settings?tab=payments&stripe=complete`,
      type: 'account_onboarding',
    });
    return accountLink.url;
  },

  /**
   * Generate a Stripe Express dashboard link for a connected account.
   */
  createDashboardLink: async (accountId: string) => {
    const stripe = getStripe();
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return loginLink.url;
  },

  /**
   * Check the status of a connected account (onboarding complete, payouts enabled).
   */
  getAccountStatus: async (accountId: string) => {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(accountId);
    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    };
  },
};
