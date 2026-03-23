import { MapPin, Car, Home, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { getPostcodeArea, getTravelOptionDisplay } from '../../public.utils';
import { env } from '@/config/env';

interface ProfileLocationProps {
  postcode: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  travelOption: string;
}

export function ProfileLocation({
  postcode,
  city,
  latitude,
  longitude,
  travelOption,
}: ProfileLocationProps) {
  const postcodeArea = getPostcodeArea(postcode);
  const travelDisplay = getTravelOptionDisplay(travelOption);

  const TravelIcon = {
    CLIENT_TRAVELS: Home,
    TRAINER_TRAVELS: Car,
    BOTH: ArrowLeftRight,
  }[travelOption] || MapPin;

  // Generate static map URL (showing general area, not exact location)
  const mapUrl = latitude && longitude
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=12&size=400x200&scale=2&maptype=roadmap&key=${env.GOOGLE_MAPS_API_KEY}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map */}
        {mapUrl && (
          <div className="overflow-hidden rounded-lg border">
            <img
              src={mapUrl}
              alt={`Map showing ${postcodeArea} area`}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Location Text */}
        <div className="space-y-1">
          {city && (
            <p className="font-medium">{city}</p>
          )}
          {postcodeArea && (
            <p className="text-sm text-muted-foreground">
              {postcodeArea} area
            </p>
          )}
        </div>

        {/* Travel Option */}
        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
          <TravelIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium text-sm">{travelDisplay.label}</p>
            <p className="text-xs text-muted-foreground">{travelDisplay.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
