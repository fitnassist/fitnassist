import { TRPCError } from '@trpc/server';
import { websiteRepository } from '../repositories/website.repository';
import { websiteSectionRepository } from '../repositories/website-section.repository';
import type { SectionType } from '@fitnassist/database';

export const websiteSectionService = {
  async addSection(trainerId: string, data: {
    type: SectionType;
    title?: string | null;
    subtitle?: string | null;
    content?: unknown;
    settings?: unknown;
  }) {
    const website = await this.requireWebsite(trainerId);
    return websiteSectionRepository.create({
      websiteId: website.id,
      ...data,
    });
  },

  async updateSection(trainerId: string, sectionId: string, data: {
    title?: string | null;
    subtitle?: string | null;
    content?: unknown;
    settings?: unknown;
  }) {
    const website = await this.requireWebsite(trainerId);
    const section = await websiteSectionRepository.findById(sectionId);
    if (!section || section.websiteId !== website.id) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Section not found' });
    }
    return websiteSectionRepository.update(sectionId, data);
  },

  async removeSection(trainerId: string, sectionId: string) {
    const website = await this.requireWebsite(trainerId);
    const section = await websiteSectionRepository.findById(sectionId);
    if (!section || section.websiteId !== website.id) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Section not found' });
    }
    if (section.type === 'CONTACT') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'The contact section cannot be removed' });
    }
    return websiteSectionRepository.delete(sectionId);
  },

  async reorderSections(trainerId: string, sectionIds: string[]) {
    const website = await this.requireWebsite(trainerId);
    // Verify all sections belong to this website
    const sections = await websiteSectionRepository.findByWebsiteId(website.id);
    const validIds = new Set(sections.map((s) => s.id));
    for (const id of sectionIds) {
      if (!validIds.has(id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid section ID' });
      }
    }
    return websiteSectionRepository.reorder(website.id, sectionIds);
  },

  async toggleSectionVisibility(trainerId: string, sectionId: string) {
    const website = await this.requireWebsite(trainerId);
    const section = await websiteSectionRepository.findById(sectionId);
    if (!section || section.websiteId !== website.id) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Section not found' });
    }
    return websiteSectionRepository.toggleVisibility(sectionId);
  },

  async requireWebsite(trainerId: string) {
    const website = await websiteRepository.findByTrainerId(trainerId);
    if (!website) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Create a website first' });
    }
    return website;
  },
};
