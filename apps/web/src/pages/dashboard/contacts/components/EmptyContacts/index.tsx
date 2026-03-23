import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { routes } from '@/config/routes';
import type { UserType } from '../../contacts.types';

interface EmptyContactsProps {
  userType: UserType;
}

export const EmptyContacts = ({ userType }: EmptyContactsProps) => {
  const isTrainer = userType === 'trainer';

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
        <p className="text-muted-foreground text-center mb-4">
          {isTrainer
            ? 'When trainees connect with you, they will appear here.'
            : 'Find trainers and send connection requests to start messaging.'}
        </p>
        {!isTrainer && (
          <Link to={routes.trainers}>
            <Button>Find Trainers</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyContacts;
