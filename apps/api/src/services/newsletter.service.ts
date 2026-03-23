import { newsletterRepository } from '../repositories/newsletter.repository';

export const newsletterService = {
  async subscribe(email: string) {
    return newsletterRepository.subscribe(email);
  },

  async unsubscribe(email: string) {
    return newsletterRepository.unsubscribe(email);
  },

  async isSubscribed(email: string) {
    return newsletterRepository.isSubscribed(email);
  },
};
