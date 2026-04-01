import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import polyline from '@mapbox/polyline';
import 'leaflet/dist/leaflet.css';

interface ActivityMapProps {
  routePolyline: string;
  startLatitude?: number | null;
  startLongitude?: number | null;
  endLatitude?: number | null;
  endLongitude?: number | null;
  className?: string;
}

const startIcon = new L.DivIcon({
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const endIcon = new L.DivIcon({
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const FitBounds = ({ positions }: { positions: L.LatLngExpression[] }) => {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (positions.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [20, 20] });
      fitted.current = true;
    }
  }, [map, positions]);

  return null;
};

export const ActivityMap = ({
  routePolyline: encodedPolyline,
  startLatitude,
  startLongitude,
  endLatitude,
  endLongitude,
  className = '',
}: ActivityMapProps) => {
  const positions = polyline
    .decode(encodedPolyline)
    .map(([lat, lng]: [number, number]) => [lat, lng] as L.LatLngExpression);

  if (positions.length === 0) return null;

  const startPos =
    startLatitude && startLongitude
      ? ([startLatitude, startLongitude] as L.LatLngExpression)
      : positions[0];

  const endPos =
    endLatitude && endLongitude
      ? ([endLatitude, endLongitude] as L.LatLngExpression)
      : positions[positions.length - 1];

  const center = positions[Math.floor(positions.length / 2)] ?? positions[0];

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '240px', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polyline
          positions={positions}
          pathOptions={{ color: 'hsl(var(--primary))', weight: 3, opacity: 0.8 }}
        />
        {startPos && <Marker position={startPos} icon={startIcon} />}
        {endPos && <Marker position={endPos} icon={endIcon} />}
        <FitBounds positions={positions} />
      </MapContainer>
    </div>
  );
};
