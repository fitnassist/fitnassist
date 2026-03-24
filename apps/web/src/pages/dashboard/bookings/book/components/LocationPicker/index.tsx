import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input, Label } from '@/components/ui';

interface Location {
  id: string;
  name: string;
  addressLine1?: string | null;
  city?: string | null;
  postcode?: string | null;
}

interface LocationPickerProps {
  locations: Location[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string) => void;
  clientAddress: string;
  onClientAddressChange: (address: string) => void;
  clientPostcode: string;
  onClientPostcodeChange: (postcode: string) => void;
  showClientAddress?: boolean;
}

export const LocationPicker = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  clientAddress,
  onClientAddressChange,
  clientPostcode,
  onClientPostcodeChange,
  showClientAddress,
}: LocationPickerProps) => {
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
          <Input
            value={clientAddress}
            onChange={(e) => onClientAddressChange(e.target.value)}
            placeholder="Your address"
            className="h-8"
          />
          <Input
            value={clientPostcode}
            onChange={(e) => onClientPostcodeChange(e.target.value)}
            placeholder="Postcode"
            className="h-8"
          />
        </div>
      )}
    </div>
  );
};
