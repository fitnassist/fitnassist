import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { Button, Label, Checkbox, Select, type SelectOption, Switch } from '@/components/ui';
import { TRAINER_SERVICES, TRAINER_QUALIFICATIONS } from '@fitnassist/schemas';

const TRAVEL_OPTIONS: SelectOption[] = [
  { value: '', label: 'Any' },
  { value: 'CLIENT_TRAVELS', label: 'Studio/Gym Based' },
  { value: 'TRAINER_TRAVELS', label: 'Mobile Trainer' },
  { value: 'BOTH', label: 'Flexible Location' },
];

interface SearchBarProps {
  location: {
    query: string;
    latitude?: number;
    longitude?: number;
  };
  onLocationChange: (location: {
    query: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  services: string[];
  onServicesChange: (services: string[]) => void;
  qualifications: string[];
  onQualificationsChange: (qualifications: string[]) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
  travelOption: string;
  onTravelOptionChange: (option: string) => void;
  minRate: number | undefined;
  maxRate: number | undefined;
  onMinRateChange: (rate: number | undefined) => void;
  onMaxRateChange: (rate: number | undefined) => void;
  acceptingClients: boolean;
  onAcceptingClientsChange: (accepting: boolean) => void;
}

const RADIUS_OPTIONS = [5, 10, 15, 25, 50];

export const SearchBar = ({
  location,
  onLocationChange,
  services,
  onServicesChange,
  qualifications,
  onQualificationsChange,
  radius,
  onRadiusChange,
  travelOption,
  onTravelOptionChange,
  minRate,
  maxRate,
  onMinRateChange,
  onMaxRateChange,
  acceptingClients,
  onAcceptingClientsChange,
}: SearchBarProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Store callback in ref to avoid effect dependency issues
  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!inputRef.current) return;

    let isMounted = true;

    async function initAutocomplete() {
      const { Autocomplete } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;

      if (!isMounted || !inputRef.current) return;

      const autocomplete = new Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'gb' },
        fields: ['formatted_address', 'geometry'],
        types: ['geocode'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          onLocationChangeRef.current({
            query: place.formatted_address || '',
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          });
        }
      });

      autocompleteRef.current = autocomplete;
    }

    initAutocomplete();

    return () => {
      isMounted = false;
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);


  const handleClearLocation = useCallback(() => {
    onLocationChange({ query: '', latitude: undefined, longitude: undefined });
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onLocationChange]);

  const handleServiceToggle = useCallback((serviceValue: string) => {
    if (services.includes(serviceValue)) {
      onServicesChange(services.filter(s => s !== serviceValue));
    } else {
      onServicesChange([...services, serviceValue]);
    }
  }, [services, onServicesChange]);

  const handleQualificationToggle = useCallback((qualValue: string) => {
    if (qualifications.includes(qualValue)) {
      onQualificationsChange(qualifications.filter(q => q !== qualValue));
    } else {
      onQualificationsChange([...qualifications, qualValue]);
    }
  }, [qualifications, onQualificationsChange]);

  const handleClearFilters = useCallback(() => {
    onServicesChange([]);
    onQualificationsChange([]);
    onRadiusChange(10);
    onTravelOptionChange('');
    onMinRateChange(undefined);
    onMaxRateChange(undefined);
    onAcceptingClientsChange(false);
  }, [onServicesChange, onQualificationsChange, onRadiusChange, onTravelOptionChange, onMinRateChange, onMaxRateChange, onAcceptingClientsChange]);

  const activeFilterCount =
    services.length +
    qualifications.length +
    (radius !== 10 ? 1 : 0) +
    (travelOption ? 1 : 0) +
    (minRate !== undefined ? 1 : 0) +
    (maxRate !== undefined ? 1 : 0) +
    (acceptingClients ? 1 : 0);

  const ukQualifications = TRAINER_QUALIFICATIONS.filter(q => q.region === 'uk');
  const intlQualifications = TRAINER_QUALIFICATIONS.filter(q => q.region === 'international');

  return (
    <div className="border-b bg-background">
      <div className="p-4">
        <div className="flex gap-2">
          {/* Location Search */}
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter a location"
              defaultValue={location.query}
              className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {location.query && (
              <button
                onClick={handleClearLocation}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <SlidersHorizontal className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Search Button (for mobile) */}
          <Button className="md:hidden">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Filters</h3>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Top row: Radius, Travel Option, Price Range, Accepting Clients */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Radius */}
              <div>
                <Label className="mb-2 block">Search radius</Label>
                <div className="flex gap-1 flex-wrap">
                  {RADIUS_OPTIONS.map((r) => (
                    <Button
                      key={r}
                      variant={radius === r ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onRadiusChange(r)}
                    >
                      {r}mi
                    </Button>
                  ))}
                </div>
              </div>

              {/* Travel Option */}
              <div>
                <Label className="mb-2 block">Training location</Label>
                <Select
                  value={TRAVEL_OPTIONS.find(o => o.value === travelOption) || TRAVEL_OPTIONS[0]}
                  onChange={(opt) => onTravelOptionChange(opt?.value || '')}
                  options={TRAVEL_OPTIONS}
                  isClearable={false}
                  isSearchable={false}
                />
              </div>

              {/* Price Range */}
              <div>
                <Label className="mb-2 block">Price range (per hour)</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Min"
                      value={minRate !== undefined ? minRate / 100 : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onMinRateChange(val ? Math.round(parseFloat(val) * 100) : undefined);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-7 pr-2 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <span className="text-muted-foreground">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Max"
                      value={maxRate !== undefined ? maxRate / 100 : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onMaxRateChange(val ? Math.round(parseFloat(val) * 100) : undefined);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-7 pr-2 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
              </div>

              {/* Accepting Clients */}
              <div>
                <Label className="mb-2 block">Availability</Label>
                <label className="flex items-center gap-2 h-10 cursor-pointer">
                  <Switch
                    checked={acceptingClients}
                    onCheckedChange={onAcceptingClientsChange}
                  />
                  <span className="text-sm">Accepting new clients</span>
                </label>
              </div>
            </div>

            {/* Services */}
            <div className="mb-4">
              <Label className="mb-2 block">Services</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {TRAINER_SERVICES.map((service) => (
                  <label
                    key={service.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={services.includes(service.value)}
                      onCheckedChange={() => handleServiceToggle(service.value)}
                    />
                    <span className="text-sm">{service.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Qualifications */}
            <div>
              <Label className="mb-2 block">Qualifications</Label>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">UK</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {ukQualifications.map((qual) => (
                      <label
                        key={qual.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={qualifications.includes(qual.value)}
                          onCheckedChange={() => handleQualificationToggle(qual.value)}
                        />
                        <span className="text-sm">{qual.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">International</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {intlQualifications.map((qual) => (
                      <label
                        key={qual.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={qualifications.includes(qual.value)}
                          onCheckedChange={() => handleQualificationToggle(qual.value)}
                        />
                        <span className="text-sm">{qual.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
