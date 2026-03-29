import { prisma } from '../lib/prisma';
import type { ProductStatus, ProductType } from '@fitnassist/database';

export const productRepository = {
  async findByTrainerId(
    trainerId: string,
    options: { status?: ProductStatus; cursor?: string; limit?: number } = {},
  ) {
    const { status, cursor, limit = 50 } = options;
    return prisma.product.findMany({
      where: {
        trainerId,
        ...(status ? { status } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  },

  async findPublicByTrainerId(trainerId: string) {
    return prisma.product.findMany({
      where: { trainerId, status: 'ACTIVE' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  },

  async findBySlug(trainerId: string, slug: string) {
    return prisma.product.findUnique({
      where: { trainerId_slug: { trainerId, slug } },
    });
  },

  async findById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },

  async create(data: {
    trainerId: string;
    type: ProductType;
    name: string;
    slug: string;
    description?: string | null;
    shortDescription?: string | null;
    pricePence: number;
    compareAtPricePence?: number | null;
    imageUrl?: string | null;
    galleryUrls?: string[];
    digitalFileUrl?: string | null;
    digitalFileName?: string | null;
    stockCount?: number | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  }) {
    return prisma.product.create({ data });
  },

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      shortDescription?: string | null;
      pricePence?: number;
      compareAtPricePence?: number | null;
      imageUrl?: string | null;
      galleryUrls?: string[];
      digitalFileUrl?: string | null;
      digitalFileName?: string | null;
      stockCount?: number | null;
      seoTitle?: string | null;
      seoDescription?: string | null;
      status?: ProductStatus;
      sortOrder?: number;
    },
  ) {
    return prisma.product.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.product.delete({ where: { id } });
  },

  async updateStock(id: string, decrement: number) {
    return prisma.product.update({
      where: { id },
      data: { stockCount: { decrement } },
    });
  },

  async countByTrainerId(trainerId: string) {
    return prisma.product.count({ where: { trainerId } });
  },

  async hasOrders(id: string) {
    const count = await prisma.orderItem.count({ where: { productId: id } });
    return count > 0;
  },

  async reorder(productIds: string[]) {
    const updates = productIds.map((id, index) =>
      prisma.product.update({ where: { id }, data: { sortOrder: index } }),
    );
    return prisma.$transaction(updates);
  },
};
