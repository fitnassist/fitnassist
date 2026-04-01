import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageCircle,
  User,
  MoreVertical,
  Circle,
  PauseCircle,
  XCircle,
  Check,
  ClipboardCheck,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
} from '@/components/ui';
import { routes } from '@/config/routes';
import type { ClientStatus } from '@fitnassist/database';

type ActiveClientStatus = 'ONBOARDING' | 'ACTIVE' | 'INACTIVE' | 'ON_HOLD';

interface ClientCardProps {
  client: {
    id: string;
    status: ClientStatus;
    updatedAt: Date;
    connection: {
      id: string;
      name: string;
      email: string;
      createdAt: Date;
      sender: {
        id: string;
        name: string;
        image: string | null;
        traineeProfile: {
          avatarUrl: string | null;
          experienceLevel: string | null;
          fitnessGoals: string[];
          activityLevel: string | null;
        } | null;
      } | null;
      messages: { createdAt: Date }[];
    };
  };
  onStatusChange: (id: string, status: ActiveClientStatus) => void;
}

const STATUS_BADGES: Record<
  ClientStatus,
  { label: string; variant: 'info' | 'success' | 'warning' | 'secondary' | 'destructive' }
> = {
  ONBOARDING: { label: 'Onboarding', variant: 'info' },
  ACTIVE: { label: 'Active', variant: 'success' },
  ON_HOLD: { label: 'On Hold', variant: 'warning' },
  INACTIVE: { label: 'Inactive', variant: 'secondary' },
  DISCONNECTED: { label: 'Disconnected', variant: 'destructive' },
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const EXPERIENCE_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export const ClientCard = ({ client, onStatusChange }: ClientCardProps) => {
  const { connection } = client;
  const sender = connection.sender;
  const avatarUrl = sender?.traineeProfile?.avatarUrl || sender?.image;
  const displayName = sender?.name || connection.name;
  const experienceLevel = sender?.traineeProfile?.experienceLevel;
  const fitnessGoals = sender?.traineeProfile?.fitnessGoals || [];
  const lastMessageDate = connection.messages[0]?.createdAt;
  const statusBadge = STATUS_BADGES[client.status];
  const isDisconnected = client.status === 'DISCONNECTED';

  const statusOptions: {
    value: ActiveClientStatus;
    label: string;
    icon: typeof Circle;
  }[] = [
    { value: 'ONBOARDING', label: 'Onboarding', icon: ClipboardCheck },
    { value: 'ACTIVE', label: 'Active', icon: Circle },
    { value: 'ON_HOLD', label: 'On Hold', icon: PauseCircle },
    { value: 'INACTIVE', label: 'Inactive', icon: XCircle },
  ];

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    to={routes.dashboardClientDetail(client.id)}
                    className="font-medium truncate hover:underline"
                  >
                    {displayName}
                  </Link>
                  <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  {experienceLevel && (
                    <span>{EXPERIENCE_LABELS[experienceLevel] || experienceLevel}</span>
                  )}
                  {experienceLevel && lastMessageDate && <span>·</span>}
                  {lastMessageDate && (
                    <span>
                      Last message{' '}
                      {formatDistanceToNow(new Date(lastMessageDate), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {sender && (
                  <Link to={routes.traineeProfileView(sender.id)}>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Profile</span>
                    </Button>
                  </Link>
                )}
                {!isDisconnected && (
                  <>
                    <Link to={routes.dashboardMessageThread(connection.id)}>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Message</span>
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {statusOptions.map(({ value, label, icon: Icon }) => (
                          <DropdownMenuItem
                            key={value}
                            onClick={() => onStatusChange(client.id, value)}
                            disabled={client.status === value}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {label}
                            {client.status === value && <Check className="h-4 w-4 ml-auto" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>

            {fitnessGoals.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {fitnessGoals.slice(0, 3).map((goal) => (
                  <Badge key={goal}>{goal}</Badge>
                ))}
                {fitnessGoals.length > 3 && (
                  <Badge variant="secondary">+{fitnessGoals.length - 3} more</Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
