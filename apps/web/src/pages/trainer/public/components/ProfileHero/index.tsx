import { MapPin, PoundSterling, UserCheck, UserX } from 'lucide-react';
import type { PublicTrainerProfile } from '../../public.types';
import { getPostcodeArea, formatRate } from '../../public.utils';

interface ProfileHeroProps {
  trainer: PublicTrainerProfile;
}

export function ProfileHero({ trainer }: ProfileHeroProps) {
  const locationText = [trainer.city, getPostcodeArea(trainer.postcode)]
    .filter(Boolean)
    .join(' ');
  const rateDisplay = formatRate(trainer.hourlyRateMin, trainer.hourlyRateMax);

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 lg:h-80 w-full overflow-hidden">
        {trainer.coverImageUrl ? (
          <img
            src={trainer.coverImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        )}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Profile Info Overlay */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-24 flex flex-col sm:flex-row sm:items-end sm:gap-6 pb-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {trainer.profileImageUrl ? (
              <img
                src={trainer.profileImageUrl}
                alt={trainer.displayName}
                className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-background object-cover shadow-lg"
              />
            ) : (
              <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-background bg-muted flex items-center justify-center shadow-lg">
                <span className="text-4xl sm:text-5xl font-semibold text-muted-foreground">
                  {trainer.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name and Location */}
          <div className="mt-4 sm:mt-0 sm:pb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              {trainer.displayName}
            </h1>
            {locationText && (
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {locationText}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              {rateDisplay && (
                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <PoundSterling className="h-3.5 w-3.5" />
                  {rateDisplay}
                </span>
              )}
              {trainer.acceptingClients ? (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <UserCheck className="h-3.5 w-3.5" />
                  Accepting clients
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <UserX className="h-3.5 w-3.5" />
                  Not accepting clients
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
