import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Clock, XCircle, User, Unlink, Calendar } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
} from '@/components/ui';
import { routes } from '@/config/routes';
import type { Contact, TabValue } from '../../contacts.types';
import { isTraineeContact } from '../../contacts.types';
import { getInitials } from '../../contacts.utils';

interface ContactCardProps {
  contact: Contact;
  variant: TabValue;
  onDisconnect?: (connectionId: string) => void;
  isDisconnecting?: boolean;
}

export const ContactCard = ({
  contact,
  variant,
  onDisconnect,
  isDisconnecting,
}: ContactCardProps) => {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const isTrainee = isTraineeContact(contact);

  // Get display info based on user type
  const displayName = isTrainee
    ? contact.trainer.displayName
    : contact.sender?.name || contact.name;

  const avatarUrl = isTrainee
    ? contact.trainer.profileImageUrl
    : contact.sender?.traineeProfile?.avatarUrl || contact.sender?.image;

  const profileHandle = isTrainee ? contact.trainer.handle : null;
  const traineeUserId = !isTrainee ? contact.sender?.id : null;

  const renderActions = () => {
    if (variant === 'pending') {
      return (
        <Badge variant="warning" className="gap-1">
          <Clock className="h-3 w-3" />
          Awaiting response
        </Badge>
      );
    }
    if (variant === 'declined') {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Declined
        </Badge>
      );
    }
    // Connected state
    return (
      <div className="flex items-center gap-2">
        {profileHandle && (
          <Link to={routes.trainerPublicProfile(profileHandle)}>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">View Profile</span>
            </Button>
          </Link>
        )}
        {traineeUserId && (
          <Link to={routes.traineeProfileView(traineeUserId)}>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">View Profile</span>
            </Button>
          </Link>
        )}
        <Link to={routes.dashboardMessageThread(contact.id)}>
          <Button size="sm">
            <MessageCircle className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Message</span>
          </Button>
        </Link>
        {isTrainee && (
          <Link to={routes.dashboardBookingsBook(contact.trainer.id)}>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Book</span>
            </Button>
          </Link>
        )}
        {onDisconnect && (
          <Button
            variant="outline"
            size="sm"
            disabled={isDisconnecting}
            onClick={() => setShowDisconnectDialog(true)}
          >
            <Unlink className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    );
  };

  const getTimestamp = () => {
    const respondedAt = contact.respondedAt;
    const createdAt = contact.createdAt;

    if (variant === 'connected') {
      return `Connected ${formatDistanceToNow(new Date(respondedAt || createdAt), { addSuffix: true })}`;
    }
    if (variant === 'pending') {
      return `Sent ${formatDistanceToNow(new Date(createdAt), { addSuffix: true })}`;
    }
    return `Declined ${formatDistanceToNow(new Date(respondedAt || createdAt), { addSuffix: true })}`;
  };

  return (
    <>
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar
              className={`h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 ${variant === 'declined' ? 'opacity-50' : ''}`}
            >
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={`font-medium truncate ${variant === 'declined' ? 'text-muted-foreground' : ''}`}
                  >
                    {displayName}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{getTimestamp()}</p>
                </div>
                {renderActions()}
              </div>
            </div>
          </div>
          {variant === 'pending' && contact.message && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {isTrainee ? 'Your message:' : 'Their message:'}
              </p>
              <p className="text-sm mt-1">{contact.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {onDisconnect && (
        <ConfirmDialog
          open={showDisconnectDialog}
          onOpenChange={setShowDisconnectDialog}
          title="Disconnect"
          description={`Are you sure you want to disconnect from ${displayName}? This will end the connection.`}
          confirmLabel="Disconnect"
          variant="destructive"
          isLoading={isDisconnecting}
          onConfirm={() => onDisconnect(contact.id)}
        />
      )}
    </>
  );
};

export default ContactCard;
