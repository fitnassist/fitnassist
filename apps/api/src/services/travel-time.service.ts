import { travelTimeCacheRepository } from '../repositories/travel-time-cache.repository';
import { getDistanceMatrix } from '../lib/distance-matrix';

export const travelTimeService = {
  /**
   * Get travel time in seconds between two coordinates.
   * Uses cache first, falls back to Google Distance Matrix API.
   * Returns null if unable to calculate.
   */
  getTravelTimeSeconds: async (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<number | null> => {
    // Check cache first
    const cached = await travelTimeCacheRepository.find(originLat, originLng, destLat, destLng);
    if (cached) return cached.durationSeconds;

    // Call Distance Matrix API
    const result = await getDistanceMatrix(originLat, originLng, destLat, destLng);
    if (!result) return null;

    // Cache the result
    await travelTimeCacheRepository.upsert(
      originLat,
      originLng,
      destLat,
      destLng,
      result.durationSeconds,
      result.distanceMeters
    );

    return result.durationSeconds;
  },

  /**
   * Get the effective travel buffer in minutes between two bookings.
   * If smart travel is enabled and coordinates are available, uses actual travel time.
   * Otherwise, falls back to the flat travelBufferMin.
   */
  getEffectiveBufferMinutes: async (
    smartTravelEnabled: boolean,
    travelBufferMin: number,
    originLat: number | null,
    originLng: number | null,
    destLat: number | null,
    destLng: number | null
  ): Promise<number> => {
    if (!smartTravelEnabled || !originLat || !originLng || !destLat || !destLng) {
      return travelBufferMin;
    }

    const travelSeconds = await travelTimeService.getTravelTimeSeconds(
      originLat,
      originLng,
      destLat,
      destLng
    );

    if (travelSeconds === null) {
      return travelBufferMin; // Fallback
    }

    // Add 5-minute buffer on top of actual travel time
    return Math.ceil(travelSeconds / 60) + 5;
  },
};
