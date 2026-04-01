import * as React from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Label } from './label';
import { cn } from '@/lib/utils';

export interface AddressDetails {
  addressLine1: string;
  addressLine2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
  placeId: string;
  latitude: number;
  longitude: number;
}

export interface AddressAutocompleteProps {
  value?: Partial<AddressDetails>;
  onChange: (address: AddressDetails | null) => void;
  apiKey: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// Declare google maps types
declare global {
  interface Window {
    google?: typeof google;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  apiKey,
  label = 'Address',
  error,
  disabled,
  className,
}: AddressAutocompleteProps) {
  const [isManualEntry, setIsManualEntry] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);
  const [selectedAddress, setSelectedAddress] = React.useState<AddressDetails | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = React.useRef(onChange);

  // Keep onChange ref up to date
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Manual entry state
  const [manualAddress, setManualAddress] = React.useState({
    addressLine1: value?.addressLine1 || '',
    addressLine2: value?.addressLine2 || '',
    city: value?.city || '',
    county: value?.county || '',
    postcode: value?.postcode || '',
  });

  // Load Google Maps API
  React.useEffect(() => {
    if (window.google?.maps?.places?.Autocomplete) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      const checkLoaded = () => {
        if (window.google?.maps?.places?.Autocomplete) {
          setIsLoaded(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;

    script.onload = () => {
      const checkLoaded = () => {
        if (window.google?.maps?.places?.Autocomplete) {
          setIsLoaded(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    };
    script.onerror = () => setLoadError(true);

    document.head.appendChild(script);
  }, [apiKey]);

  // Set up the autocomplete once loaded
  React.useEffect(() => {
    if (!isLoaded || !inputRef.current || isManualEntry || loadError) return;
    if (autocompleteRef.current) return;

    const autocomplete = new window.google!.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'gb' },
      types: ['address'],
      fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location || !place.address_components) return;

      // Extract structured address components
      let streetNumber = '';
      let route = '';
      let addressLine2 = '';
      let city = '';
      let county = '';
      let postcode = '';

      for (const component of place.address_components) {
        const types = component.types;

        if (types.includes('street_number')) {
          streetNumber = component.long_name;
        }
        if (types.includes('route')) {
          route = component.long_name;
        }
        if (types.includes('subpremise') || types.includes('premise')) {
          addressLine2 = component.long_name;
        }
        if (types.includes('postal_town') || types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_2')) {
          county = component.long_name;
        }
        if (types.includes('postal_code')) {
          postcode = component.long_name;
        }
      }

      const addressLine1 = streetNumber ? `${streetNumber} ${route}` : route;

      const addressDetails: AddressDetails = {
        addressLine1,
        addressLine2,
        city,
        county,
        postcode,
        country: 'GB',
        placeId: place.place_id || '',
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      };

      setSelectedAddress(addressDetails);
      onChangeRef.current(addressDetails);
    });

    autocompleteRef.current = autocomplete;

    // Set initial value in input if we have one
    if (value?.addressLine1 && inputRef.current) {
      const parts = [
        value.addressLine1,
        value.addressLine2,
        value.city,
        value.county,
        value.postcode,
      ].filter(Boolean);
      inputRef.current.value = parts.join(', ');
    }

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, isManualEntry, loadError]);

  const handleManualChange = (field: keyof typeof manualAddress, fieldValue: string) => {
    const updated = { ...manualAddress, [field]: fieldValue };
    setManualAddress(updated);
  };

  const handleManualSubmit = () => {
    if (!manualAddress.postcode) return;

    const addressDetails: AddressDetails = {
      addressLine1: manualAddress.addressLine1,
      addressLine2: manualAddress.addressLine2,
      city: manualAddress.city,
      county: manualAddress.county,
      postcode: manualAddress.postcode,
      country: 'GB',
      placeId: '',
      latitude: 0,
      longitude: 0,
    };

    setSelectedAddress(addressDetails);
    onChange(addressDetails);
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setSelectedAddress(null);
    setManualAddress({
      addressLine1: '',
      addressLine2: '',
      city: '',
      county: '',
      postcode: '',
    });
    onChange(null);
  };

  // Use selectedAddress if we have one, otherwise fall back to value prop
  const displayAddress = selectedAddress || value;

  // Show manual entry form if Google Maps fails to load or user prefers it
  if (loadError || isManualEntry) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          {!loadError && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsManualEntry(false)}>
              Use address lookup
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="manual-line1" className="text-sm">
              Address Line 1 *
            </Label>
            <Input
              id="manual-line1"
              placeholder="e.g., 123 High Street"
              value={manualAddress.addressLine1}
              onChange={(e) => handleManualChange('addressLine1', e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-line2" className="text-sm">
              Address Line 2
            </Label>
            <Input
              id="manual-line2"
              placeholder="e.g., Flat 4, Building Name"
              value={manualAddress.addressLine2}
              onChange={(e) => handleManualChange('addressLine2', e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="manual-city" className="text-sm">
                City *
              </Label>
              <Input
                id="manual-city"
                placeholder="e.g., London"
                value={manualAddress.city}
                onChange={(e) => handleManualChange('city', e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-county" className="text-sm">
                County
              </Label>
              <Input
                id="manual-county"
                placeholder="e.g., Greater London"
                value={manualAddress.county}
                onChange={(e) => handleManualChange('county', e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-postcode" className="text-sm">
              Postcode *
            </Label>
            <Input
              id="manual-postcode"
              placeholder="e.g., SW1A 1AA"
              value={manualAddress.postcode}
              onChange={(e) => handleManualChange('postcode', e.target.value.toUpperCase())}
              disabled={disabled}
              className="max-w-[200px]"
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleManualSubmit}
            disabled={
              !manualAddress.addressLine1 ||
              !manualAddress.city ||
              !manualAddress.postcode ||
              disabled
            }
          >
            Confirm address
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <p className="text-xs text-muted-foreground">
          Only your postcode area will be shown publicly on your profile map.
        </p>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className={cn('space-y-3', className)}>
        <Label>{label}</Label>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading address lookup...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsManualEntry(true)}>
          Enter manually
        </Button>
      </div>

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Start typing your address..."
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'pl-10',
          )}
        />

        {displayAddress?.addressLine1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={handleClear}
          >
            Clear
          </Button>
        )}
      </div>

      {displayAddress?.addressLine1 && (
        <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
          <p className="font-medium">{displayAddress.addressLine1}</p>
          {displayAddress.addressLine2 && <p>{displayAddress.addressLine2}</p>}
          <p className="text-muted-foreground">
            {[displayAddress.city, displayAddress.county, displayAddress.postcode]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Your full address is private. Only your postcode area will be shown publicly on the map.
      </p>
    </div>
  );
}
