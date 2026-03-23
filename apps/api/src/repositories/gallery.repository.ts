import { prisma } from '../lib/prisma';

const MAX_GALLERY_IMAGES = 6;

export const galleryRepository = {
  async findByTrainerId(trainerId: string) {
    return prisma.galleryImage.findMany({
      where: { trainerId },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async count(trainerId: string) {
    return prisma.galleryImage.count({
      where: { trainerId },
    });
  },

  async add(trainerId: string, url: string) {
    const count = await this.count(trainerId);
    if (count >= MAX_GALLERY_IMAGES) {
      throw new Error(`Gallery is full (max ${MAX_GALLERY_IMAGES} images)`);
    }

    return prisma.galleryImage.create({
      data: {
        trainerId,
        url,
        sortOrder: count,
      },
    });
  },

  async remove(id: string) {
    return prisma.galleryImage.delete({
      where: { id },
    });
  },

  async findById(id: string) {
    return prisma.galleryImage.findUnique({
      where: { id },
    });
  },

  async reorder(trainerId: string, imageIds: string[]) {
    const updates = imageIds.map((id, index) =>
      prisma.galleryImage.update({
        where: { id, trainerId },
        data: { sortOrder: index },
      })
    );
    return prisma.$transaction(updates);
  },
};
