import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Unlink, Calendar } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Select,
  type SelectOption,
  Badge,
} from '@/components/ui';
import { routes } from '@/config/routes';
import type { ClientStatus } from '@fitnassist/database';

type ActiveClientStatus = 'ONBOARDING' | 'ACTIVE' | 'INACTIVE' | 'ON_HOLD';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const EXPERIENCE_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

const ACTIVITY_LABELS: Record<string, string> = {
  SEDENTARY: 'Sedentary',
  LIGHTLY_ACTIVE: 'Lightly Active',
  MODERATELY_ACTIVE: 'Moderately Active',
  VERY_ACTIVE: 'Very Active',
  EXTREMELY_ACTIVE: 'Extremely Active',
};

interface ClientOverviewProps {
  client: {
    id: string;
    status: ClientStatus;
    createdAt: Date;
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
    };
  };
  onStatusChange: (status: ActiveClientStatus) => void;
  isUpdating: boolean;
  onDisconnect?: () => void;
  isDisconnecting?: boolean;
}

export const ClientOverview = ({ client, onStatusChange, isUpdating, onDisconnect, isDisconnecting }: ClientOverviewProps) => {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const { connection } = client;
  const sender = connection.sender;
  const profile = sender?.traineeProfile;
  const avatarUrl = profile?.avatarUrl || sender?.image;
  const displayName = sender?.name || connection.name;
  const isDisconnected = client.status === 'DISCONNECTED';

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Client info card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Avatar className={`h-16 w-16 flex-shrink-0 ${isDisconnected ? 'opacity-50' : ''}`}>
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="text-lg">{getInitials(displayName)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-xl font-semibold">{displayName}</h2>
                <p className="text-sm text-muted-foreground">{connection.email}</p>
              </div>

              {isDisconnected ? (
                <Badge variant="destructive">
                  Disconnected
                </Badge>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-40">
                    <Select
                      value={STATUS_OPTIONS.find(o => o.value === client.status)}
                      onChange={(opt) => onStatusChange(opt?.value as ActiveClientStatus)}
                      options={STATUS_OPTIONS}
                      isClearable={false}
                      isSearchable={false}
                      isDisabled={isUpdating}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Client since {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                {!isDisconnected && (
                  <>
                    <Link to={routes.dashboardBookingsBookClientWithId(client.id)}>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Session
                      </Button>
                    </Link>
                    <Link to={routes.dashboardMessageThread(connection.id)}>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </Link>
                    {onDisconnect && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDisconnectDialog(true)}
                        disabled={isDisconnecting}
                      >
                        <Unlink className="h-4 w-4 mr-2 text-destructive" />
                        Disconnect
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trainee profile info */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Fitness Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.experienceLevel && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Experience Level</p>
                <p>{EXPERIENCE_LABELS[profile.experienceLevel] || profile.experienceLevel}</p>
              </div>
            )}
            {profile.activityLevel && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activity Level</p>
                <p>{ACTIVITY_LABELS[profile.activityLevel] || profile.activityLevel}</p>
              </div>
            )}
            {profile.fitnessGoals.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Fitness Goals</p>
                <div className="flex flex-wrap gap-1">
                  {profile.fitnessGoals.map((goal) => (
                    <Badge key={goal}>{goal}</Badge>
                  ))}
                </div>
              </div>
            )}
            {!profile.experienceLevel && !profile.activityLevel && profile.fitnessGoals.length === 0 && (
              <p className="text-sm text-muted-foreground">No fitness profile details shared yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {onDisconnect && (
        <ConfirmDialog
          open={showDisconnectDialog}
          onOpenChange={setShowDisconnectDialog}
          title="Disconnect Client"
          description={`Are you sure you want to disconnect from ${displayName}? This will end the connection.`}
          confirmLabel="Disconnect"
          variant="destructive"
          isLoading={isDisconnecting}
          onConfirm={onDisconnect}
        />
      )}
    </div>
  );
};
