import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createBlogPostSchema,
  type CreateBlogPostInput,
} from '@fitnassist/schemas';
import {
  Button,
  ImageUpload,
  Input,
  Label,
  Textarea,
  RichTextEditor,
} from '@/components/ui';
import { useCreateBlogPost, useUpdateBlogPost } from '@/api/website';
import { useWebsiteUpload } from '../../hooks';
import type { BlogPost } from './BlogManager.types';

interface BlogPostFormProps {
  post?: BlogPost;
  onClose: () => void;
}

const generateSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const BlogPostForm = ({ post, onClose }: BlogPostFormProps) => {
  const isEditing = !!post;
  const createBlogPost = useCreateBlogPost();
  const updateBlogPost = useUpdateBlogPost();
  const { uploadImage, deleteFile } = useWebsiteUpload();
  const [coverImageUrl, setCoverImageUrl] = useState<string>(post?.coverImageUrl ?? '');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateBlogPostInput>({
    resolver: zodResolver(createBlogPostSchema),
    defaultValues: {
      title: post?.title ?? '',
      slug: post?.slug ?? '',
      excerpt: post?.excerpt ?? '',
      content: post?.content ?? '',
      coverImageUrl: post?.coverImageUrl ?? '',
      seoTitle: post?.seoTitle ?? '',
      seoDescription: post?.seoDescription ?? '',
      tags: post?.tags ?? [],
    },
  });

  const title = watch('title');

  useEffect(() => {
    if (!isEditing && title) {
      setValue('slug', generateSlug(title));
    }
  }, [title, isEditing, setValue]);

  const isPending = createBlogPost.isPending || updateBlogPost.isPending;

  const onSubmit = (data: CreateBlogPostInput) => {
    const cleaned = {
      ...data,
      excerpt: data.excerpt || null,
      coverImageUrl: coverImageUrl || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      tags: data.tags?.length ? data.tags : [],
    };

    if (isEditing) {
      updateBlogPost.mutate(
        { postId: post.id, ...cleaned },
        { onSuccess: onClose }
      );
    } else {
      createBlogPost.mutate(cleaned, { onSuccess: onClose });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="My awesome blog post"
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            {...register('slug')}
            placeholder="my-awesome-blog-post"
          />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            {...register('excerpt')}
            placeholder="A brief summary of your post..."
            rows={3}
          />
          {errors.excerpt && (
            <p className="text-sm text-destructive">{errors.excerpt.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                content={field.value}
                onChange={field.onChange}
                placeholder="Write your blog post content..."
              />
            )}
          />
          {errors.content && (
            <p className="text-sm text-destructive">{errors.content.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Cover Image</Label>
          <ImageUpload
            value={coverImageUrl}
            onChange={(url) => setCoverImageUrl(url ?? '')}
            onUpload={uploadImage}
            onDelete={(url) => deleteFile(url)}
            aspectRatio="cover"
            maxSizeMB={10}
          />
          {errors.coverImageUrl && (
            <p className="text-sm text-destructive">
              {errors.coverImageUrl.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            defaultValue={(watch('tags') ?? []).join(', ')}
            onBlur={(e) => {
              const tags = e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
              setValue('tags', tags);
            }}
            placeholder="fitness, nutrition, tips (comma separated)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input
            id="seoTitle"
            {...register('seoTitle')}
            placeholder="SEO-optimised title (max 60 characters)"
          />
          {errors.seoTitle && (
            <p className="text-sm text-destructive">
              {errors.seoTitle.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO Description</Label>
          <Textarea
            id="seoDescription"
            {...register('seoDescription')}
            placeholder="SEO-optimised description (max 160 characters)"
            rows={2}
          />
          {errors.seoDescription && (
            <p className="text-sm text-destructive">
              {errors.seoDescription.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
              ? 'Save Changes'
              : 'Create Post'}
        </Button>
      </div>
    </form>
  );
};
