import { prisma } from '../lib/prisma';
import type { Prisma } from '@fitnassist/database';

const websiteInclude = {
  sections: {
    orderBy: { sortOrder: 'asc' as const },
  },
} satisfies Prisma.WebsiteInclude;

export const websiteRepository = {
  async findByTrainerId(trainerId: string) {
    return prisma.website.findUnique({
      where: { trainerId },
      include: websiteInclude,
    });
  },

  async findByTrainerIdFull(trainerId: string) {
    return prisma.website.findUnique({
      where: { trainerId },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
        },
        trainer: {
          select: {
            displayName: true,
            handle: true,
            profileImageUrl: true,
            bio: true,
            contactEmail: true,
            phoneNumber: true,
            socialLinks: true,
            services: true,
            galleryImages: { orderBy: { sortOrder: 'asc' } },
            reviews: {
              include: {
                reviewer: {
                  select: { id: true, name: true, image: true },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });
  },

  async findBySubdomain(subdomain: string) {
    return prisma.website.findUnique({
      where: { subdomain },
      include: {
        sections: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
        trainer: {
          select: {
            displayName: true,
            handle: true,
            profileImageUrl: true,
            bio: true,
            contactEmail: true,
            phoneNumber: true,
            socialLinks: true,
            services: true,
            galleryImages: { orderBy: { sortOrder: 'asc' } },
            reviews: {
              where: { replyText: { not: null } },
              include: {
                reviewer: {
                  select: { id: true, name: true, image: true },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });
  },

  async create(trainerId: string, subdomain: string) {
    return prisma.website.create({
      data: { trainerId, subdomain },
      include: websiteInclude,
    });
  },

  async update(id: string, data: Prisma.WebsiteUpdateInput) {
    return prisma.website.update({
      where: { id },
      data,
      include: websiteInclude,
    });
  },

  async subdomainExists(subdomain: string, excludeId?: string) {
    const existing = await prisma.website.findUnique({
      where: { subdomain },
      select: { id: true },
    });
    if (!existing) return false;
    return excludeId ? existing.id !== excludeId : true;
  },

  async delete(id: string) {
    return prisma.website.delete({ where: { id } });
  },
};
