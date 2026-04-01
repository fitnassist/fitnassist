import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui';

interface UserCardProps {
  name: string;
  handle?: string | null;
  avatarUrl?: string | null;
  profileUrl?: string;
  children?: React.ReactNode;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const UserCard = ({ name, handle, avatarUrl, profileUrl, children }: UserCardProps) => {
  const avatarContent = (
    <Avatar className="h-10 w-10">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );

  const nameContent = (
    <div className="min-w-0">
      <p className="text-sm font-medium truncate">{name}</p>
      {handle && <p className="text-xs text-muted-foreground truncate">@{handle}</p>}
    </div>
  );

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      {profileUrl ? (
        <Link to={profileUrl} className="shrink-0">
          {avatarContent}
        </Link>
      ) : (
        <div className="shrink-0">{avatarContent}</div>
      )}

      {profileUrl ? (
        <Link to={profileUrl} className="min-w-0 flex-1 hover:underline">
          {nameContent}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{nameContent}</div>
      )}

      {children && <div className="ml-auto flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
};
