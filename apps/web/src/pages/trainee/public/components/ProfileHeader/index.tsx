import { MapPin } from "lucide-react";

interface ProfileHeaderProps {
  userName: string;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
}

export const ProfileHeader = ({
  userName,
  handle,
  avatarUrl,
  bio,
  city,
}: ProfileHeaderProps) => {
  return (
    <div className="relative">
      {/* Cover */}
      <div className="relative h-64 sm:h-80 lg:h-96 w-full overflow-hidden">
        <img
          src="/images/trainee-cover.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#20415c] to-[#5a0c30] mix-blend-multiply" />
      </div>

      {/* Profile info */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-8 sm:-mt-10 flex flex-col sm:flex-row sm:items-end sm:gap-6 pb-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-background object-cover shadow-lg"
              />
            ) : (
              <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-background bg-muted flex items-center justify-center shadow-lg">
                <span className="text-3xl sm:text-4xl font-semibold text-muted-foreground">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name + handle */}
          <div className="mt-4 sm:mt-0 sm:pb-2">
            <h1 className="text-2xl sm:text-3xl font-extralight text-foreground uppercase tracking-wider">
              {userName}
            </h1>
            {handle && (
              <p className="text-sm text-muted-foreground">@{handle}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {city && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-muted-foreground whitespace-pre-wrap pb-6">
            {bio}
          </p>
        )}
      </div>
    </div>
  );
};
