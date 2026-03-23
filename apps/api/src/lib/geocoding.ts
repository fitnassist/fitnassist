import { env } from '../config/env';

// =============================================================================
// GOOGLE MAPS GEOCODING
// =============================================================================

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

interface GoogleGeocodingResponse {
  status: string;
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
}

// Simple in-memory cache for geocoding results
const geocodeCache = new Map<string, GeocodingResult>();

/**
 * Geocode a UK postcode to latitude/longitude coordinates
 */
export async function geocodePostcode(postcode: string): Promise<GeocodingResult | null> {
  // Normalize postcode
  const normalizedPostcode = postcode.toUpperCase().replace(/\s+/g, ' ').trim();

  // Check cache first
  if (geocodeCache.has(normalizedPostcode)) {
    return geocodeCache.get(normalizedPostcode)!;
  }

  // If no API key, return null (will be handled gracefully)
  if (!env.GOOGLE_MAPS_API_KEY) {
    console.log('[Geocoding] Google Maps API key not configured, skipping geocoding for:', normalizedPostcode);
    return null;
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', `${normalizedPostcode}, UK`);
    url.searchParams.set('key', env.GOOGLE_MAPS_API_KEY);
    url.searchParams.set('components', 'country:GB');

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error('[Geocoding] API request failed:', response.status, response.statusText);
      return null;
    }

    const data = (await response.json()) as GoogleGeocodingResponse;

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.log('[Geocoding] No results for postcode:', normalizedPostcode, 'Status:', data.status);
      return null;
    }

    const firstResult = data.results[0]!;
    const result: GeocodingResult = {
      latitude: firstResult.geometry.location.lat,
      longitude: firstResult.geometry.location.lng,
      formattedAddress: firstResult.formatted_address,
    };

    // Cache the result
    geocodeCache.set(normalizedPostcode, result);

    return result;
  } catch (error) {
    console.error('[Geocoding] Failed to geocode postcode:', error);
    return null;
  }
}

/**
 * Validate a UK postcode format
 */
export function isValidUKPostcode(postcode: string): boolean {
  const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
  return ukPostcodeRegex.test(postcode.trim());
}

/**
 * Format a UK postcode (add space if missing)
 */
export function formatUKPostcode(postcode: string): string {
  const clean = postcode.toUpperCase().replace(/\s+/g, '');
  // Insert space before last 3 characters
  if (clean.length > 3) {
    return `${clean.slice(0, -3)} ${clean.slice(-3)}`;
  }
  return clean;
}

export const geocoding = {
  geocodePostcode,
  isValidUKPostcode,
  formatUKPostcode,
};
