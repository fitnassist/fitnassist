import { TRPCError } from '@trpc/server';
import { websiteRepository } from '../repositories/website.repository';
import { websiteSectionRepository } from '../repositories/website-section.repository';
import type { Prisma } from '@fitnassist/database';

export const websiteService = {
  async getMyWebsite(trainerId: string) {
    return websiteRepository.findByTrainerId(trainerId);
  },

  async getPreview(trainerId: string) {
    const website = await websiteRepository.findByTrainerIdFull(trainerId);
    if (!website) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Create a website first' });
    }
    return website;
  },

  async getPublicWebsite(subdomain: string) {
    const website = await websiteRepository.findBySubdomain(subdomain);
    if (!website || website.status !== 'PUBLISHED') {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Website not found' });
    }
    return website;
  },

  async createWebsite(trainerId: string, handle: string) {
    const existing = await websiteRepository.findByTrainerId(trainerId);
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Website already exists' });
    }

    // Use the trainer's handle as the default subdomain
    const subdomainTaken = await websiteRepository.subdomainExists(handle);
    const subdomain = subdomainTaken ? `${handle}-site` : handle;

    const website = await websiteRepository.create(trainerId, subdomain);

    // Create default sections
    const defaultSections = [
      { type: 'HERO' as const, title: 'Welcome', content: { headline: '', subheadline: '', ctaText: 'Book a Session', ctaLink: '' } },
      { type: 'ABOUT' as const, title: 'About Me', content: { richText: '', imageUrl: null, imagePosition: 'right' } },
      { type: 'SERVICES' as const, title: 'Services', content: { items: [] } },
      { type: 'CONTACT' as const, title: 'Get in Touch', content: { showForm: true, showEmail: true, showPhone: false, showSocial: true, showMap: false, showBookingLink: true } },
    ];

    for (const section of defaultSections) {
      await websiteSectionRepository.create({
        websiteId: website.id,
        ...section,
      });
    }

    return websiteRepository.findByTrainerId(trainerId);
  },

  async updateSettings(trainerId: string, data: Prisma.WebsiteUpdateInput) {
    const website = await this.requireWebsite(trainerId);
    return websiteRepository.update(website.id, data);
  },

  async updateSubdomain(trainerId: string, subdomain: string) {
    const website = await this.requireWebsite(trainerId);

    const taken = await websiteRepository.subdomainExists(subdomain, website.id);
    if (taken) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Subdomain is already taken' });
    }

    return websiteRepository.update(website.id, { subdomain });
  },

  async publish(trainerId: string) {
    const website = await this.requireWebsite(trainerId);

    if (website.sections.length === 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Add at least one section before publishing' });
    }

    return websiteRepository.update(website.id, { status: 'PUBLISHED' });
  },

  async unpublish(trainerId: string) {
    const website = await this.requireWebsite(trainerId);
    return websiteRepository.update(website.id, { status: 'DRAFT' });
  },

  async requireWebsite(trainerId: string) {
    const website = await websiteRepository.findByTrainerId(trainerId);
    if (!website) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Create a website first' });
    }
    return website;
  },
};
