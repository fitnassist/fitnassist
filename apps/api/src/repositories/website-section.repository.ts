import { prisma } from '../lib/prisma';
import type { SectionType } from '@fitnassist/database';

export const websiteSectionRepository = {
  async findByWebsiteId(websiteId: string) {
    return prisma.websiteSection.findMany({
      where: { websiteId },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async findById(id: string) {
    return prisma.websiteSection.findUnique({
      where: { id },
    });
  },

  async create(data: {
    websiteId: string;
    type: SectionType;
    title?: string | null;
    subtitle?: string | null;
    content?: unknown;
    settings?: unknown;
  }) {
    const maxOrder = await prisma.websiteSection.aggregate({
      where: { websiteId: data.websiteId },
      _max: { sortOrder: true },
    });
    return prisma.websiteSection.create({
      data: {
        ...data,
        content: data.content as any,
        settings: data.settings as any,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
  },

  async update(id: string, data: {
    title?: string | null;
    subtitle?: string | null;
    content?: unknown;
    settings?: unknown;
  }) {
    return prisma.websiteSection.update({
      where: { id },
      data: {
        ...data,
        content: data.content as any,
        settings: data.settings as any,
      },
    });
  },

  async delete(id: string) {
    return prisma.websiteSection.delete({ where: { id } });
  },

  async reorder(_websiteId: string, sectionIds: string[]) {
    const updates = sectionIds.map((id, index) =>
      prisma.websiteSection.update({
        where: { id },
        data: { sortOrder: index },
      })
    );
    return prisma.$transaction(updates);
  },

  async toggleVisibility(id: string) {
    const section = await prisma.websiteSection.findUnique({
      where: { id },
      select: { isVisible: true },
    });
    if (!section) throw new Error('Section not found');
    return prisma.websiteSection.update({
      where: { id },
      data: { isVisible: !section.isVisible },
    });
  },
};
