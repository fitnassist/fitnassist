import { Link } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback, Badge, Select, StarRating, type SelectOption } from '@/components/ui';
import { routes } from '@/config/routes';
import { getServiceLabel } from '@/pages/trainer/public/public.utils';

export type SortBy = 'distance' | 'recently_active' | 'newest' | 'price_low' | 'price_high';

const SORT_OPTIONS: SelectOption[] = [
  { value: 'distance', label: 'Distance' },
  { value: 'recently_active', label: 'Recently Active' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price (Low-High)' },
  { value: 'price_high', label: 'Price (High-Low)' },
];

interface Trainer {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  profileImageUrl: string | null;
  city: string | null;
  postcode: string | null;
  services: string[];
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  acceptingClients: boolean;
  ratingAverage: number;
  ratingCount: number;
  distance?: number;
}

interface TrainerListProps {
  trainers: Trainer[];
  isLoading: boolean;
  error?: string;
  total: number;
  selectedTrainerId: string | null;
  onTrainerSelect: (trainerId: string | null) => void;
  sortBy: SortBy;
  onSortByChange: (sortBy: SortBy) => void;
  hasLocation: boolean;
}

const formatRate = (min: number | null, max: number | null): string | null => {
  if (min === null && max === null) return null;
  const minPounds = min !== null ? Math.round(min / 100) : null;
  const maxPounds = max !== null ? Math.round(max / 100) : null;
  if (minPounds !== null && maxPounds !== null) {
    if (minPounds === maxPounds) return `£${minPounds}/hr`;
    return `£${minPounds} - £${maxPounds}/hr`;
  }
  if (minPounds !== null) return `From £${minPounds}/hr`;
  if (maxPounds !== null) return `Up to £${maxPounds}/hr`;
  return null;
};

export const TrainerList = ({
  trainers,
  isLoading,
  error,
  total,
  selectedTrainerId,
  onTrainerSelect,
  sortBy,
  onSortByChange,
  hasLocation,
}: TrainerListProps) => {
  // Filter sort options — "Distance" only available with location
  const availableSortOptions = hasLocation
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter(o => o.value !== 'distance');

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-3 w-1/4 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (trainers.length === 0) {
    return (
      <div className="p-8 text-center">
        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg mb-2">No trainers found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search location or filters to find trainers in your area.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Results count + sort */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          <span className="font-medium text-foreground">{total}</span>{' '}
          {total === 1 ? 'trainer' : 'trainers'} found
        </p>
        <div className="w-48">
          <Select
            value={availableSortOptions.find(o => o.value === sortBy) || availableSortOptions[0]}
            onChange={(opt) => onSortByChange((opt?.value as SortBy) || 'newest')}
            options={availableSortOptions}
            isClearable={false}
            isSearchable={false}
            placeholder="Sort by..."
          />
        </div>
      </div>

      {/* Trainer list */}
      <div className="divide-y">
        {trainers.map((trainer) => (
          <TrainerCard
            key={trainer.id}
            trainer={trainer}
            isSelected={selectedTrainerId === trainer.id}
            onSelect={() => onTrainerSelect(trainer.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface TrainerCardProps {
  trainer: Trainer;
  isSelected: boolean;
  onSelect: () => void;
}

const TrainerCard = ({ trainer, isSelected, onSelect }: TrainerCardProps) => {
  const initials = trainer.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const displayedServices = trainer.services.slice(0, 3);
  const moreServices = trainer.services.length - 3;
  const rateDisplay = formatRate(trainer.hourlyRateMin, trainer.hourlyRateMax);

  return (
    <Link
      to={routes.trainerPublicProfile(trainer.handle)}
      className={`block p-4 hover:bg-muted/50 transition-colors ${
        isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''
      }`}
      onMouseEnter={onSelect}
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <Avatar className="h-16 w-16 flex-shrink-0">
          {trainer.profileImageUrl && (
            <AvatarImage src={trainer.profileImageUrl} alt={trainer.displayName} />
          )}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium truncate">{trainer.displayName}</h3>
              {(trainer.city || trainer.postcode) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[trainer.city, trainer.postcode].filter(Boolean).join(', ')}
                  {trainer.distance !== undefined && (
                    <span className="ml-1">
                      ({trainer.distance.toFixed(1)} miles)
                    </span>
                  )}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>

          {/* Rating + Rate + availability */}
          {(rateDisplay || !trainer.acceptingClients || trainer.ratingCount > 0) && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {trainer.ratingCount > 0 && (
                <StarRating rating={trainer.ratingAverage} count={trainer.ratingCount} size="sm" />
              )}
              {rateDisplay && (
                <span className="text-sm font-medium text-foreground">{rateDisplay}</span>
              )}
              {!trainer.acceptingClients && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Not accepting clients
                </span>
              )}
            </div>
          )}

          {/* Bio preview */}
          {trainer.bio && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {trainer.bio}
            </p>
          )}

          {/* Services tags */}
          {displayedServices.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {displayedServices.map((service) => (
                <Badge key={service}>
                  {getServiceLabel(service)}
                </Badge>
              ))}
              {moreServices > 0 && (
                <Badge variant="secondary">
                  +{moreServices} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
