import { TRPCError } from '@trpc/server';
import { productRepository } from '../repositories/product.repository';
import type { ProductStatus } from '@fitnassist/database';

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
};

const ensureUniqueSlug = async (trainerId: string, baseSlug: string, excludeId?: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await productRepository.findBySlug(trainerId, slug);
    if (!existing || existing.id === excludeId) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

export const productService = {
  async getProducts(trainerId: string, status?: ProductStatus) {
    return productRepository.findByTrainerId(trainerId, { status });
  },

  async getProduct(trainerId: string, productId: string) {
    const product = await productRepository.findById(productId);
    if (!product || product.trainerId !== trainerId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
    }
    return product;
  },

  async createProduct(trainerId: string, data: {
    type: 'DIGITAL' | 'PHYSICAL';
    name: string;
    description?: string;
    shortDescription?: string;
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
    const slug = await ensureUniqueSlug(trainerId, generateSlug(data.name));
    return productRepository.create({ trainerId, slug, ...data });
  },

  async updateProduct(trainerId: string, productId: string, data: {
    name?: string;
    description?: string;
    shortDescription?: string;
    pricePence?: number;
    compareAtPricePence?: number | null;
    imageUrl?: string | null;
    galleryUrls?: string[];
    digitalFileUrl?: string | null;
    digitalFileName?: string | null;
    stockCount?: number | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  }) {
    const product = await productRepository.findById(productId);
    if (!product || product.trainerId !== trainerId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
    }

    const updateData: Record<string, unknown> = { ...data };

    if (data.name && data.name !== product.name) {
      updateData.slug = await ensureUniqueSlug(trainerId, generateSlug(data.name), productId);
    }

    return productRepository.update(productId, updateData as Parameters<typeof productRepository.update>[1]);
  },

  async deleteProduct(trainerId: string, productId: string) {
    const product = await productRepository.findById(productId);
    if (!product || product.trainerId !== trainerId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
    }

    const hasOrders = await productRepository.hasOrders(productId);
    if (hasOrders) {
      return productRepository.update(productId, { status: 'ARCHIVED' });
    }
    return productRepository.delete(productId);
  },

  async publishProduct(trainerId: string, productId: string) {
    const product = await productRepository.findById(productId);
    if (!product || product.trainerId !== trainerId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
    }
    if (product.status === 'ACTIVE') return product;
    return productRepository.update(productId, { status: 'ACTIVE' });
  },

  async archiveProduct(trainerId: string, productId: string) {
    const product = await productRepository.findById(productId);
    if (!product || product.trainerId !== trainerId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
    }
    if (product.status === 'ARCHIVED') return product;
    return productRepository.update(productId, { status: 'ARCHIVED' });
  },

  async reorderProducts(trainerId: string, productIds: string[]) {
    // Verify all products belong to this trainer
    for (const id of productIds) {
      const product = await productRepository.findById(id);
      if (!product || product.trainerId !== trainerId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
      }
    }
    return productRepository.reorder(productIds);
  },

  async getPublicProducts(trainerId: string) {
    return productRepository.findPublicByTrainerId(trainerId);
  },

  async getPublicProduct(trainerId: string, slug: string) {
    const product = await productRepository.findBySlug(trainerId, slug);
    if (!product || product.status !== 'ACTIVE') {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
    }
    return product;
  },
};
