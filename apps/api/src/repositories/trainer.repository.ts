import { prisma } from '../lib/prisma';
import type { Prisma } from '@fitnassist/database';
import { calculateDistance } from '@fitnassist/utils';

export interface TrainerSearchParams {
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  city?: string;
  postcode?: string;
  services?: string[];
  qualifications?: string[];
  travelOption?: 'CLIENT_TRAVELS' | 'TRAINER_TRAVELS' | 'BOTH';
  minRate?: number;
  maxRate?: number;
  acceptingClients?: boolean;
  sortBy?: 'distance' | 'recently_active' | 'newest' | 'price_low' | 'price_high';
  query?: string;
  page: number;
  limit: number;
}

export const trainerRepository = {
  async findById(id: string) {
    return prisma.trainerProfile.findUnique({
      where: { id },
      include: { user: true },
    });
  },

  async findByUserId(userId: string) {
    return prisma.trainerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
  },

  async findByHandle(handle: string) {
    return prisma.trainerProfile.findUnique({
      where: { handle },
      include: {
        user: true,
        galleryImages: { orderBy: { sortOrder: 'asc' } },
        website: { select: { subdomain: true, status: true } },
      },
    });
  },

  async handleExists(handle: string, excludeUserId?: string) {
    const profile = await prisma.trainerProfile.findUnique({
      where: { handle },
      select: { userId: true },
    });
    if (!profile) return false;
    if (excludeUserId && profile.userId === excludeUserId) return false;
    return true;
  },

  async search(params: TrainerSearchParams) {
    const {
      latitude,
      longitude,
      radiusMiles = 10,
      city,
      postcode,
      services,
      qualifications,
      travelOption,
      minRate,
      maxRate,
      acceptingClients,
      sortBy = 'distance',
      query,
      page,
      limit,
    } = params;

    const where: Prisma.TrainerProfileWhereInput = {
      isPublished: true,
    };

    // Text search on name/bio
    if (query) {
      where.OR = [
        { displayName: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Location filters
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    if (postcode) {
      where.postcode = { startsWith: postcode.split(' ')[0], mode: 'insensitive' };
    }

    // Services filter
    if (services && services.length > 0) {
      where.services = { hasSome: services };
    }

    // Qualifications filter
    if (qualifications && qualifications.length > 0) {
      where.qualifications = { hasSome: qualifications };
    }

    // Travel option filter — selecting a specific option also includes "BOTH"
    if (travelOption) {
      if (travelOption === 'BOTH') {
        where.travelOption = 'BOTH';
      } else {
        where.travelOption = { in: [travelOption, 'BOTH'] };
      }
    }

    // Price range filter — only include trainers who have set their rates
    if (minRate !== undefined || maxRate !== undefined) {
      const priceFilters: Prisma.TrainerProfileWhereInput[] = [
        { hourlyRateMin: { not: null } },
      ];
      if (minRate !== undefined) {
        priceFilters.push({ hourlyRateMax: { gte: minRate } });
      }
      if (maxRate !== undefined) {
        priceFilters.push({ hourlyRateMin: { lte: maxRate } });
      }
      where.AND = priceFilters;
    }

    // Accepting clients filter
    if (acceptingClients) {
      where.acceptingClients = true;
    }

    // Determine sort order for the DB query
    const getOrderBy = (): Prisma.TrainerProfileOrderByWithRelationInput => {
      switch (sortBy) {
        case 'recently_active':
          return { user: { lastActiveAt: { sort: 'desc', nulls: 'last' } } };
        case 'price_low':
          return { hourlyRateMin: { sort: 'asc', nulls: 'last' } };
        case 'price_high':
          return { hourlyRateMax: { sort: 'desc', nulls: 'last' } };
        case 'newest':
          return { createdAt: 'desc' };
        case 'distance':
        default:
          return { createdAt: 'desc' }; // Fallback; distance sort is done post-query
      }
    };

    // Get all matching trainers
    let trainers = await prisma.trainerProfile.findMany({
      where,
      include: { user: true },
      orderBy: getOrderBy(),
    });

    // Filter by distance and add distance property if coordinates provided
    type TrainerWithDistance = (typeof trainers)[number] & { distance?: number };
    let results: TrainerWithDistance[] = trainers;

    if (latitude && longitude) {
      results = trainers
        .filter((t) => t.latitude !== null && t.longitude !== null)
        .map((t) => ({
          ...t,
          distance: calculateDistance(latitude, longitude, t.latitude!, t.longitude!),
        }))
        .filter((t) => t.distance! <= radiusMiles);

      // Sort by distance if that's the selected sort
      if (sortBy === 'distance') {
        results.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      }
    }

    // Paginate
    const total = results.length;
    const paginatedTrainers = results.slice((page - 1) * limit, page * limit);

    return {
      trainers: paginatedTrainers,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  },

  async create(userId: string, data: Prisma.TrainerProfileCreateWithoutUserInput) {
    return prisma.trainerProfile.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
      include: { user: true },
    });
  },

  async update(id: string, data: Prisma.TrainerProfileUpdateInput) {
    return prisma.trainerProfile.update({
      where: { id },
      data,
      include: { user: true },
    });
  },

  async delete(id: string) {
    return prisma.trainerProfile.delete({
      where: { id },
    });
  },

  async recordProfileView(trainerId: string, viewerId?: string) {
    return prisma.profileView.create({
      data: {
        trainerId,
        viewerId,
      },
    });
  },

  async getProfileViewCount(trainerId: string, since?: Date) {
    return prisma.profileView.count({
      where: {
        trainerId,
        ...(since && { viewedAt: { gte: since } }),
      },
    });
  },
};
