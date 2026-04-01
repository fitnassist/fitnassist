import { useEffect, useRef, useState } from 'react';
import { routes } from '@/config/routes';

interface Trainer {
  id: string;
  handle: string;
  displayName: string;
  profileImageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  services: string[];
}

interface TrainerMapProps {
  trainers: Trainer[];
  center?: { lat: number; lng: number };
  radiusMiles: number;
  selectedTrainerId: string | null;
  onTrainerSelect: (trainerId: string | null) => void;
}

// Default to UK center
const DEFAULT_CENTER = { lat: 54.5, lng: -2 };
const DEFAULT_ZOOM = 6;

// Calculate zoom level based on radius in miles
// Approximate formula: zoom = 14 - log2(radius)
function getZoomForRadius(radiusMiles: number): number {
  // Map radius to appropriate zoom levels
  // 5 miles -> zoom 11
  // 10 miles -> zoom 10
  // 15 miles -> zoom 9.5
  // 25 miles -> zoom 9
  // 50 miles -> zoom 8
  const zoom = Math.round(14 - Math.log2(radiusMiles));
  return Math.max(7, Math.min(13, zoom)); // Clamp between 7 and 13
}

// Brand colors (coral)
const COLORS = {
  light: {
    primary: '#d8345b', // coral
    primaryHover: '#c22d50',
  },
  dark: {
    primary: '#d8345b',
    primaryHover: '#c22d50',
  },
};

function getThemeColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? COLORS.dark : COLORS.light;
}

// Round coordinates to ~1km precision for privacy (postcode level)
function roundCoordinate(coord: number): number {
  return Math.round(coord * 100) / 100; // ~1.1km precision
}

export function TrainerMap({
  trainers,
  center,
  radiusMiles,
  selectedTrainerId,
  onTrainerSelect,
}: TrainerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map using importLibrary
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    let isMounted = true;

    async function initMap() {
      try {
        const { Map, InfoWindow } = (await google.maps.importLibrary(
          'maps',
        )) as google.maps.MapsLibrary;

        if (!isMounted || !mapRef.current) return;

        googleMapRef.current = new Map(mapRef.current, {
          center: center || DEFAULT_CENTER,
          zoom: center ? getZoomForRadius(radiusMiles) : DEFAULT_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        infoWindowRef.current = new InfoWindow();

        // Inject styles to fix Google Maps info window padding
        const styleId = 'gmap-infowindow-styles';
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
            .gm-style-iw-c { padding: 0 !important; padding-top: 0 !important; }
            .gm-style-iw-d { overflow: hidden !important; }
            .gm-style-iw-chr { display: none !important; }
            .gm-style-iw { padding: 0 !important; }
            .gm-style .gm-style-iw-c { padding: 0 !important; }
            .gm-style .gm-style-iw-t::after { display: none; }
          `;
          document.head.appendChild(style);
        }

        setIsLoaded(true);
      } catch (error) {
        console.error('TrainerMap: Error initializing map:', error);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [center]);

  // Update center and zoom when they change
  useEffect(() => {
    if (!googleMapRef.current || !center) return;

    googleMapRef.current.panTo(center);
    googleMapRef.current.setZoom(getZoomForRadius(radiusMiles));
  }, [center, radiusMiles]);

  // Update markers when trainers change
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return;

    let isMounted = true;

    async function updateMarkers() {
      const { Marker } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;

      if (!isMounted || !googleMapRef.current) return;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      // Create new markers
      const bounds = new google.maps.LatLngBounds();
      let hasValidMarkers = false;

      trainers.forEach((trainer) => {
        if (trainer.latitude === null || trainer.longitude === null) return;

        hasValidMarkers = true;
        // Round coordinates for privacy (postcode-level precision)
        const position = {
          lat: roundCoordinate(trainer.latitude),
          lng: roundCoordinate(trainer.longitude),
        };
        bounds.extend(position);

        const isSelected = trainer.id === selectedTrainerId;
        const colors = getThemeColors();

        const marker = new Marker({
          position,
          map: googleMapRef.current!,
          title: trainer.displayName,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 12 : 8,
            fillColor: isSelected ? colors.primaryHover : colors.primary,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
          zIndex: isSelected ? 1000 : 1,
        });

        // Click handler
        marker.addListener('click', () => {
          onTrainerSelect(trainer.id);
          const themeColors = getThemeColors();

          const content = `
            <div style="padding: 12px 16px; min-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                ${
                  trainer.profileImageUrl
                    ? `<img src="${trainer.profileImageUrl}" alt="" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />`
                    : `<div style="width: 48px; height: 48px; border-radius: 50%; background: ${themeColors.primary}; display: flex; align-items: center; justify-content: center; font-weight: 600; color: white; font-size: 18px; flex-shrink: 0;">${trainer.displayName.charAt(0)}</div>`
                }
                <div style="min-width: 0;">
                  <div style="font-weight: 600; font-size: 15px; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${trainer.displayName}</div>
                  ${trainer.city ? `<div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${trainer.city}</div>` : ''}
                </div>
              </div>
              <a href="${routes.trainerPublicProfile(trainer.handle)}"
                 style="display: block; padding: 10px 16px; background: ${themeColors.primary}; color: white; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; text-align: center;"
                 onmouseover="this.style.background='${themeColors.primaryHover}'"
                 onmouseout="this.style.background='${themeColors.primary}'">
                View Profile
              </a>
            </div>
          `;

          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open(googleMapRef.current!, marker);
        });

        markersRef.current.push(marker);
      });

      // Fit bounds if we have markers and no specific center
      if (hasValidMarkers && !center && googleMapRef.current) {
        googleMapRef.current.fitBounds(bounds, 50);
      }
    }

    updateMarkers();

    return () => {
      isMounted = false;
    };
  }, [trainers, isLoaded, selectedTrainerId, onTrainerSelect, center]);

  // Update marker appearance when selection changes
  useEffect(() => {
    const colors = getThemeColors();

    markersRef.current.forEach((marker, index) => {
      const trainersWithCoords = trainers.filter(
        (t) => t.latitude !== null && t.longitude !== null,
      );
      const currentTrainer = trainersWithCoords[index];
      if (!currentTrainer) return;

      const isSelected = currentTrainer.id === selectedTrainerId;

      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 12 : 8,
        fillColor: isSelected ? colors.primaryHover : colors.primary,
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      });
      marker.setZIndex(isSelected ? 1000 : 1);
    });
  }, [selectedTrainerId, trainers]);

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-pulse text-muted-foreground">Loading map...</div>
        </div>
      )}
    </div>
  );
}
