import type { TrainerProfile } from '@fitnassist/database';

// =============================================================================
// COMMON UTILITY TYPES
// =============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  website?: string;
}

// =============================================================================
// TRAINER SEARCH TYPES
// =============================================================================

export interface TrainerWithDistance extends TrainerProfile {
  distance?: number;
}

export interface TrainerSearchResult {
  trainers: TrainerWithDistance[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
