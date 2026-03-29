import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

// =============================================================================
// CLOUDINARY CONFIGURATION
// =============================================================================

const isConfigured = !!(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type UploadType = 'profile' | 'cover' | 'gallery' | 'video-intro' | 'exercise-video' | 'exercise-thumbnail' | 'recipe-image' | 'progress-photo' | 'website-image' | 'website-video';

interface UploadConfig {
  folder: string;
  resourceType: 'image' | 'video';
  transformation?: object[];
  maxFileSize?: number; // in bytes
}

const UPLOAD_CONFIGS: Record<UploadType, UploadConfig> = {
  profile: {
    folder: 'fitnassist/profiles',
    resourceType: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  cover: {
    folder: 'fitnassist/covers',
    resourceType: 'image',
    transformation: [
      { width: 1200, height: 400, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  gallery: {
    folder: 'fitnassist/gallery',
    resourceType: 'image',
    transformation: [
      { width: 1200, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  'video-intro': {
    folder: 'fitnassist/intros',
    resourceType: 'video',
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  'exercise-video': {
    folder: 'fitnassist/exercises/videos',
    resourceType: 'video',
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
  'exercise-thumbnail': {
    folder: 'fitnassist/exercises/thumbnails',
    resourceType: 'image',
    transformation: [
      { width: 640, height: 360, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  'recipe-image': {
    folder: 'fitnassist/recipes',
    resourceType: 'image',
    transformation: [
      { width: 800, height: 600, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  'progress-photo': {
    folder: 'fitnassist/progress-photos',
    resourceType: 'image',
    transformation: [
      { width: 1200, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  'website-image': {
    folder: 'fitnassist/websites/images',
    resourceType: 'image',
    transformation: [
      { width: 1920, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  'website-video': {
    folder: 'fitnassist/websites/videos',
    resourceType: 'video',
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
};

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  uploadPreset?: string;
}

/**
 * Generate signed upload parameters for direct client-side upload
 */
export function getSignedUploadParams(type: UploadType): SignedUploadParams {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured');
  }

  const config = UPLOAD_CONFIGS[type];
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = {
    timestamp,
    folder: config.folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    apiKey: env.CLOUDINARY_API_KEY!,
    folder: config.folder,
  };
}

/**
 * Get upload configuration for a type
 */
export function getUploadConfig(type: UploadType): UploadConfig {
  return UPLOAD_CONFIGS[type];
}

/**
 * Delete a file from Cloudinary by public ID
 */
export async function deleteFile(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
  if (!isConfigured) {
    console.log('[Cloudinary] Not configured, mock deleting:', publicId);
    return true;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return true;
  } catch (error) {
    console.error('[Cloudinary] Failed to delete file:', error);
    return false;
  }
}

/**
 * Extract public ID from a Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url.includes('cloudinary.com')) return null;

  // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
  const match = url.match(/\/v\d+\/(.+)\.\w+$/);
  return match?.[1] ?? null;
}

/**
 * Generate optimized URL for an image
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: { width?: number; height?: number; crop?: string } = {}
): string {
  if (!isConfigured) {
    return `https://placeholder.com/${options.width || 400}x${options.height || 400}`;
  }

  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: options.crop || 'fill',
      },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
}

/**
 * Generate video thumbnail URL
 */
export function getVideoThumbnailUrl(publicId: string, options: { width?: number; height?: number } = {}): string {
  if (!isConfigured) {
    return `https://placeholder.com/${options.width || 640}x${options.height || 360}`;
  }

  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'video',
    transformation: [
      {
        width: options.width || 640,
        height: options.height || 360,
        crop: 'fill',
      },
      { quality: 'auto', fetch_format: 'jpg' },
    ],
  });
}

export const cloudinaryService = {
  isConfigured,
  getSignedUploadParams,
  getUploadConfig,
  deleteFile,
  getPublicIdFromUrl,
  getOptimizedImageUrl,
  getVideoThumbnailUrl,
};
