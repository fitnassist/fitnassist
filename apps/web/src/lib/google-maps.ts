import { env } from '@/config/env';

// Google's recommended bootstrap loader for dynamic loading
// This sets up google.maps.importLibrary() for async library loading
export function initGoogleMaps() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;

  w.google = w.google || {};
  const maps = w.google.maps || (w.google.maps = {});

  // If importLibrary already exists (e.g., script already loaded), don't override
  if (maps.importLibrary) {
    return;
  }

  const libraries = new Set<string>();
  let loadPromise: Promise<void> | null = null;

  const load = (): Promise<void> =>
    loadPromise ||
    (loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const params = new URLSearchParams({
        key: env.GOOGLE_MAPS_API_KEY,
        v: 'weekly',
        libraries: [...libraries].join(','),
        callback: 'google.maps.__ib__',
      });
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      script.async = true;
      maps.__ib__ = resolve;
      script.onerror = () => {
        loadPromise = null;
        reject(new Error('Google Maps JavaScript API could not load.'));
      };
      document.head.append(script);
    }));

  // This function will be replaced by Google's implementation after the script loads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maps.importLibrary = (library: string): Promise<any> => {
    libraries.add(library);
    return load().then(() => {
      // After script loads, Google replaces importLibrary with their implementation
      // So we call it again to get the actual library
      return w.google.maps.importLibrary(library);
    });
  };
}

// Initialize immediately when this module is imported
initGoogleMaps();
