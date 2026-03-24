import { prisma } from '../lib/prisma';

export const sessionLocationRepository = {
  findByTrainerId: (trainerId: string) => {
    return prisma.sessionLocation.findMany({
      where: { trainerId },
      orderBy: { sortOrder: 'asc' },
    });
  },

  findActiveByTrainerId: (trainerId: string) => {
    return prisma.sessionLocation.findMany({
      where: { trainerId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  findById: (id: string) => {
    return prisma.sessionLocation.findUnique({ where: { id } });
  },

  create: (data: {
    trainerId: string;
    name: string;
    addressLine1?: string;
    city?: string;
    postcode?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    isDefault?: boolean;
  }) => {
    return prisma.sessionLocation.create({ data });
  },

  update: (id: string, data: {
    name?: string;
    addressLine1?: string;
    city?: string;
    postcode?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    isDefault?: boolean;
    isActive?: boolean;
    sortOrder?: number;
  }) => {
    return prisma.sessionLocation.update({ where: { id }, data });
  },

  delete: (id: string) => {
    return prisma.sessionLocation.delete({ where: { id } });
  },

  clearDefault: (trainerId: string) => {
    return prisma.sessionLocation.updateMany({
      where: { trainerId, isDefault: true },
      data: { isDefault: false },
    });
  },
};
