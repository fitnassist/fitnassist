import { prisma } from '../lib/prisma';
import type { BlogPostStatus } from '@fitnassist/database';

export const blogPostRepository = {
  async findByWebsiteId(
    websiteId: string,
    options: { status?: BlogPostStatus; cursor?: string; limit?: number; search?: string; tag?: string } = {}
  ) {
    const { status, cursor, limit = 10, search, tag } = options;
    return prisma.blogPost.findMany({
      where: {
        websiteId,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                { excerpt: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
        ...(tag ? { tags: { has: tag } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  },

  async findAllTags(websiteId: string) {
    const posts = await prisma.blogPost.findMany({
      where: { websiteId, status: 'PUBLISHED' },
      select: { tags: true },
    });
    const tagSet = new Set<string>();
    for (const post of posts) {
      for (const tag of post.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  },

  async findBySlug(websiteId: string, slug: string) {
    return prisma.blogPost.findUnique({
      where: { websiteId_slug: { websiteId, slug } },
    });
  },

  async findById(id: string) {
    return prisma.blogPost.findUnique({ where: { id } });
  },

  async create(data: {
    websiteId: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    coverImageUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    tags?: string[];
  }) {
    return prisma.blogPost.create({ data });
  },

  async update(id: string, data: {
    title?: string;
    slug?: string;
    excerpt?: string | null;
    content?: string;
    coverImageUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    tags?: string[];
  }) {
    return prisma.blogPost.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.blogPost.delete({ where: { id } });
  },

  async publish(id: string) {
    return prisma.blogPost.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  },

  async unpublish(id: string) {
    return prisma.blogPost.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
  },

  async slugExists(websiteId: string, slug: string, excludeId?: string) {
    const existing = await prisma.blogPost.findUnique({
      where: { websiteId_slug: { websiteId, slug } },
      select: { id: true },
    });
    if (!existing) return false;
    return excludeId ? existing.id !== excludeId : true;
  },
};
