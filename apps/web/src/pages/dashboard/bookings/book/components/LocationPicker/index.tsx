import { useState } from 'react';
import { MapPin, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Label, AddressAutocomplete, type AddressDetails } from '@/components/ui';
import { env } from '@/config/env';

interface Location {
  id: string;
  name: string;
  addressLine1?: string | null;
  city?: string | null;
  postcode?: string | null;
}

interface TraineeAddress {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  county?: string | null;
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
}

interface LocationPickerProps {
  locations: Location[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string) => void;
  onClientAddressChange: (address: AddressDetails | null) => void;
  traineeAddress?: TraineeAddress | null;
  showClientAddress?: boolean;
}

export const LocationPicker = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  onClientAddressChange,
  traineeAddress,
  showClientAddress,
}: LocationPickerProps) => {
  const [usedMyAddress, setUsedMyAddress] = useState(false);

  const hasTraineeAddress = traineeAddress?.addressLine1 && traineeAddress.addressLine1.length > 0;

  const handleUseMyAddress = () => {
    if (!traineeAddress) return;
    const address: AddressDetails = {
      addressLine1: traineeAddress.addressLine1 || '',
      addressLine2: traineeAddress.addressLine2 || '',
      city: traineeAddress.city || '',
      county: traineeAddress.county || '',
      postcode: traineeAddress.postcode || '',
      country: 'GB',
      placeId: traineeAddress.placeId || '',
      latitude: traineeAddress.latitude || 0,
      longitude: traineeAddress.longitude || 0,
    };
    onClientAddressChange(address);
    setUsedMyAddress(true);
  };

  return (
    <div className="space-y-4">
      {locations.length > 0 && (
        <div>
          <Label className="text-sm mb-2 block">Trainer's locations</Label>
          <div className="space-y-2">
            {locations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => onSelectLocation(loc.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  selectedLocationId === loc.id
                    ? 'bg-primary/5 border-primary'
                    : 'hover:bg-muted/50'
                )}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <span className="font-medium text-sm">{loc.name}</span>
                    {(loc.addressLine1 || loc.city) && (
                      <p className="text-xs text-muted-foreground">
                        {[loc.addressLine1, loc.city, loc.postcode].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showClientAddress && (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
          <Label className="text-sm">Or enter your address</Label>

          {hasTraineeAddress && !usedMyAddress && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleUseMyAddress}
            >
              <Home className="h-4 w-4 mr-2" />
              Use my address ({[traineeAddress?.addressLine1, traineeAddress?.postcode].filter(Boolean).join(', ')})
            </Button>
          )}

          {usedMyAddress ? (
            <div className="rounded-md bg-background p-3 text-sm space-y-1">
              <p className="font-medium">{traineeAddress?.addressLine1}</p>
              <p className="text-muted-foreground">
                {[traineeAddress?.city, traineeAddress?.postcode].filter(Boolean).join(', ')}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs p-0 h-auto"
                onClick={() => {
                  setUsedMyAddress(false);
                  onClientAddressChange(null);
                }}
              >
                Change address
              </Button>
            </div>
          ) : (
            <AddressAutocomplete
              apiKey={env.GOOGLE_MAPS_API_KEY}
              label=""
              onChange={onClientAddressChange}
            />
          )}
        </div>
      )}
    </div>
  );
};
