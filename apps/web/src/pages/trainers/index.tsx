import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useDebounce } from '@/hooks';
import { SearchBar } from './components/SearchBar';
import { TrainerList, type SortBy } from './components/TrainerList';
import { TrainerMap } from './components/TrainerMap';

export const TrainersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search state
  const [location, setLocation] = useState({
    query: searchParams.get('location') || '',
    latitude: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
    longitude: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
  });
  const [services, setServices] = useState<string[]>(
    searchParams.get('services')?.split(',').filter(Boolean) || [],
  );
  const [qualifications, setQualifications] = useState<string[]>(
    searchParams.get('qualifications')?.split(',').filter(Boolean) || [],
  );
  const [radius, setRadius] = useState(
    searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : 10,
  );
  const [travelOption, setTravelOption] = useState(searchParams.get('travelOption') || '');
  const [minRate, setMinRate] = useState<number | undefined>(
    searchParams.get('minRate') ? parseInt(searchParams.get('minRate')!) : undefined,
  );
  const [maxRate, setMaxRate] = useState<number | undefined>(
    searchParams.get('maxRate') ? parseInt(searchParams.get('maxRate')!) : undefined,
  );
  const [acceptingClients, setAcceptingClients] = useState(
    searchParams.get('accepting') === 'true',
  );

  const hasLocation = !!(location.latitude && location.longitude);
  const defaultSort: SortBy = hasLocation ? 'distance' : 'newest';
  const [sortBy, setSortBy] = useState<SortBy>((searchParams.get('sort') as SortBy) || defaultSort);

  // Debounce location and rate inputs for API calls
  const debouncedLocation = useDebounce(location, 300);
  const debouncedMinRate = useDebounce(minRate, 500);
  const debouncedMaxRate = useDebounce(maxRate, 500);

  // Fetch trainers
  const { data, isLoading, error } = trpc.trainer.search.useQuery({
    latitude: debouncedLocation.latitude,
    longitude: debouncedLocation.longitude,
    radiusMiles: radius,
    services: services.length > 0 ? services : undefined,
    qualifications: qualifications.length > 0 ? qualifications : undefined,
    travelOption: travelOption
      ? (travelOption as 'CLIENT_TRAVELS' | 'TRAINER_TRAVELS' | 'BOTH')
      : undefined,
    minRate: debouncedMinRate,
    maxRate: debouncedMaxRate,
    acceptingClients: acceptingClients || undefined,
    sortBy,
    page: 1,
    limit: 50,
  });

  // Selected trainer for map highlight
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);

  // URL param updater helper
  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (value) {
            params.set(key, value);
          } else {
            params.delete(key);
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Handle location change from search bar
  const handleLocationChange = useCallback(
    (newLocation: { query: string; latitude?: number; longitude?: number }) => {
      setLocation({
        query: newLocation.query,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });

      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (newLocation.query) {
            params.set('location', newLocation.query);
          } else {
            params.delete('location');
          }
          if (newLocation.latitude && newLocation.longitude) {
            params.set('lat', newLocation.latitude.toString());
            params.set('lng', newLocation.longitude.toString());
          } else {
            params.delete('lat');
            params.delete('lng');
          }
          return params;
        },
        { replace: true },
      );

      // Switch to distance sort when location is set, newest when cleared
      if (newLocation.latitude && newLocation.longitude) {
        setSortBy('distance');
        updateParam('sort', 'distance');
      } else {
        setSortBy('newest');
        updateParam('sort', undefined);
      }
    },
    [setSearchParams, updateParam],
  );

  const handleServicesChange = useCallback(
    (newServices: string[]) => {
      setServices(newServices);
      updateParam('services', newServices.length > 0 ? newServices.join(',') : undefined);
    },
    [updateParam],
  );

  const handleQualificationsChange = useCallback(
    (newQualifications: string[]) => {
      setQualifications(newQualifications);
      updateParam(
        'qualifications',
        newQualifications.length > 0 ? newQualifications.join(',') : undefined,
      );
    },
    [updateParam],
  );

  const handleRadiusChange = useCallback(
    (newRadius: number) => {
      setRadius(newRadius);
      updateParam('radius', newRadius.toString());
    },
    [updateParam],
  );

  const handleTravelOptionChange = useCallback(
    (option: string) => {
      setTravelOption(option);
      updateParam('travelOption', option || undefined);
    },
    [updateParam],
  );

  const handleMinRateChange = useCallback(
    (rate: number | undefined) => {
      setMinRate(rate);
      updateParam('minRate', rate !== undefined ? rate.toString() : undefined);
    },
    [updateParam],
  );

  const handleMaxRateChange = useCallback(
    (rate: number | undefined) => {
      setMaxRate(rate);
      updateParam('maxRate', rate !== undefined ? rate.toString() : undefined);
    },
    [updateParam],
  );

  const handleAcceptingClientsChange = useCallback(
    (accepting: boolean) => {
      setAcceptingClients(accepting);
      updateParam('accepting', accepting ? 'true' : undefined);
    },
    [updateParam],
  );

  const handleSortByChange = useCallback(
    (newSortBy: SortBy) => {
      setSortBy(newSortBy);
      updateParam('sort', newSortBy !== defaultSort ? newSortBy : undefined);
    },
    [updateParam, defaultSort],
  );

  const trainers = data?.trainers || [];

  return (
    <div className="flex flex-col min-h-screen md:h-screen pt-16">
      <h1 className="sr-only">Find a Trainer</h1>
      {/* Search Bar */}
      <SearchBar
        location={location}
        onLocationChange={handleLocationChange}
        services={services}
        onServicesChange={handleServicesChange}
        qualifications={qualifications}
        onQualificationsChange={handleQualificationsChange}
        radius={radius}
        onRadiusChange={handleRadiusChange}
        travelOption={travelOption}
        onTravelOptionChange={handleTravelOptionChange}
        minRate={minRate}
        maxRate={maxRate}
        onMinRateChange={handleMinRateChange}
        onMaxRateChange={handleMaxRateChange}
        acceptingClients={acceptingClients}
        onAcceptingClientsChange={handleAcceptingClientsChange}
      />

      {/* Split Screen: List | Map */}
      <div className="flex-1 flex md:overflow-hidden">
        {/* Trainer List */}
        <div className="w-full md:w-1/2 lg:w-2/5 md:overflow-y-auto border-r">
          <TrainerList
            trainers={trainers}
            isLoading={isLoading}
            error={error?.message}
            total={data?.total || 0}
            selectedTrainerId={selectedTrainerId}
            onTrainerSelect={setSelectedTrainerId}
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
            hasLocation={hasLocation}
          />
        </div>

        {/* Map */}
        <div className="hidden md:block md:w-1/2 lg:w-3/5">
          <TrainerMap
            trainers={trainers}
            center={
              location.latitude && location.longitude
                ? { lat: location.latitude, lng: location.longitude }
                : undefined
            }
            radiusMiles={radius}
            selectedTrainerId={selectedTrainerId}
            onTrainerSelect={setSelectedTrainerId}
          />
        </div>
      </div>
    </div>
  );
};

export default TrainersPage;
