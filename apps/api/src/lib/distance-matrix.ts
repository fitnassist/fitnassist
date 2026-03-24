import { env } from '../config/env';

interface DistanceResult {
  durationSeconds: number;
  distanceMeters: number;
}

/**
 * Calls Google Maps Distance Matrix API for driving travel time.
 * Returns null if the API key is missing or the request fails.
 */
export const getDistanceMatrix = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DistanceResult | null> => {
  const apiKey = env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', `${originLat},${originLng}`);
    url.searchParams.set('destinations', `${destLat},${destLng}`);
    url.searchParams.set('mode', 'driving');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = await response.json() as {
      rows?: { elements?: { status: string; duration: { value: number }; distance: { value: number } }[] }[];
    };
    const element = data?.rows?.[0]?.elements?.[0];

    if (element?.status !== 'OK') return null;

    return {
      durationSeconds: element.duration.value,
      distanceMeters: element.distance.value,
    };
  } catch (error) {
    console.error('Distance Matrix API error:', error);
    return null;
  }
};
