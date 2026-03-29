import { TRPCError } from '@trpc/server';
import { websiteRepository } from '../repositories/website.repository';
import { blogPostRepository } from '../repositories/blog-post.repository';

export const blogService = {
  async createPost(trainerId: string, data: {
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    coverImageUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    tags?: string[];
  }) {
    const website = await this.requireWebsite(trainerId);

    const slugExists = await blogPostRepository.slugExists(website.id, data.slug);
    if (slugExists) {
      throw new TRPCError({ code: 'CONFLICT', message: 'A post with this slug already exists' });
    }

    return blogPostRepository.create({ websiteId: website.id, ...data });
  },

  async updatePost(trainerId: string, postId: string, data: {
    title?: string;
    slug?: string;
    excerpt?: string | null;
    content?: string;
    coverImageUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    tags?: string[];
  }) {
    const website = await this.requireWebsite(trainerId);
    const post = await blogPostRepository.findById(postId);
    if (!post || post.websiteId !== website.id) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
    }

    if (data.slug && data.slug !== post.slug) {
      const slugExists = await blogPostRepository.slugExists(website.id, data.slug, postId);
      if (slugExists) {
        throw new TRPCError({ code: 'CONFLICT', message: 'A post with this slug already exists' });
      }
    }

    return blogPostRepository.update(postId, data);
  },

  async deletePost(trainerId: string, postId: string) {
    const website = await this.requireWebsite(trainerId);
    const post = await blogPostRepository.findById(postId);
    if (!post || post.websiteId !== website.id) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
    }
    return blogPostRepository.delete(postId);
  },

  async publishPost(trainerId: string, postId: string) {
    const website = await this.requireWebsite(trainerId);
    const post = await blogPostRepository.findById(postId);
    if (!post || post.websiteId !== website.id) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
    }
    return blogPostRepository.publish(postId);
  },

  async unpublishPost(trainerId: string, postId: string) {
    const website = await this.requireWebsite(trainerId);
    const post = await blogPostRepository.findById(postId);
    if (!post || post.websiteId !== website.id) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
    }
    return blogPostRepository.unpublish(postId);
  },

  async getMyPosts(trainerId: string, cursor?: string, limit?: number) {
    const website = await this.requireWebsite(trainerId);
    const posts = await blogPostRepository.findByWebsiteId(website.id, { cursor, limit });
    const hasMore = posts.length > (limit ?? 10);
    if (hasMore) posts.pop();
    return {
      posts,
      nextCursor: hasMore ? posts[posts.length - 1]?.id : undefined,
    };
  },

  async getPublicPosts(subdomain: string, cursor?: string, limit = 10, search?: string, tag?: string) {
    const website = await websiteRepository.findBySubdomain(subdomain);
    if (!website || website.status !== 'PUBLISHED') {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Website not found' });
    }
    const posts = await blogPostRepository.findByWebsiteId(website.id, {
      status: 'PUBLISHED',
      cursor,
      limit,
      search,
      tag,
    });
    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();
    return {
      posts,
      nextCursor: hasMore ? posts[posts.length - 1]?.id : undefined,
    };
  },

  async getPublicTags(subdomain: string) {
    const website = await websiteRepository.findBySubdomain(subdomain);
    if (!website || website.status !== 'PUBLISHED') {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Website not found' });
    }
    return blogPostRepository.findAllTags(website.id);
  },

  async getPublicPost(subdomain: string, slug: string) {
    const website = await websiteRepository.findBySubdomain(subdomain);
    if (!website || website.status !== 'PUBLISHED') {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Website not found' });
    }
    const post = await blogPostRepository.findBySlug(website.id, slug);
    if (!post || post.status !== 'PUBLISHED') {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
    }
    return post;
  },

  async requireWebsite(trainerId: string) {
    const website = await websiteRepository.findByTrainerId(trainerId);
    if (!website) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Create a website first' });
    }
    return website;
  },
};
