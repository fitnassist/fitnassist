import { CheckCircle, Clock, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  ResponsiveTabs,
  TabsContent,
} from '@/components/ui';
import { useTabParam } from '@/hooks';
import { useDisconnectByConnection, useTraineeDisconnect } from '@/api/client-roster';
import { ContactCard } from '../ContactCard';
import { DEFAULT_TAB, TAB_CONFIG } from '../../contacts.constants';
import type { Contact, TabValue, ContactCounts, UserType } from '../../contacts.types';

interface ContactsTabsProps {
  pendingContacts: Contact[];
  acceptedContacts: Contact[];
  declinedContacts: Contact[];
  counts: ContactCounts;
  userType: UserType;
}

export const ContactsTabs = ({
  pendingContacts,
  acceptedContacts,
  declinedContacts,
  counts,
  userType,
}: ContactsTabsProps) => {
  const [activeTab, setActiveTab] = useTabParam<TabValue>(DEFAULT_TAB);
  const trainerDisconnect = useDisconnectByConnection();
  const traineeDisconnect = useTraineeDisconnect();

  const handleDisconnect = (connectionId: string) => {
    if (userType === 'trainer') {
      trainerDisconnect.mutate({ connectionId });
    } else {
      traineeDisconnect.mutate({ connectionId });
    }
  };

  const isDisconnecting = trainerDisconnect.isPending || traineeDisconnect.isPending;

  const renderTabContent = (contacts: Contact[], variant: TabValue) => {
    if (contacts.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {TAB_CONFIG[variant].emptyMessage}
          </CardContent>
        </Card>
      );
    }

    return contacts.map((contact) => (
      <ContactCard
        key={contact.id}
        contact={contact}
        variant={variant}
        onDisconnect={variant === 'connected' ? handleDisconnect : undefined}
        isDisconnecting={isDisconnecting}
      />
    ));
  };

  // Trainers only see connected contacts (no pending/declined - those are in Requests)
  if (userType === 'trainer') {
    return (
      <div className="space-y-4">
        {acceptedContacts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {TAB_CONFIG.connected.emptyMessage}
            </CardContent>
          </Card>
        ) : (
          acceptedContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              variant="connected"
              onDisconnect={handleDisconnect}
              isDisconnecting={isDisconnecting}
            />
          ))
        )}
      </div>
    );
  }

  // Trainees see all tabs
  return (
    <ResponsiveTabs
      value={activeTab}
      onValueChange={setActiveTab}
      options={[
        { value: 'connected', label: `Connected (${counts.accepted})`, icon: <CheckCircle className="h-4 w-4" /> },
        { value: 'pending', label: `Pending (${counts.pending})`, icon: <Clock className="h-4 w-4" /> },
        { value: 'declined', label: `Declined (${counts.declined})`, icon: <XCircle className="h-4 w-4" /> },
      ]}
      className="space-y-4"
    >
      <TabsContent value="connected" className="space-y-4">
        {renderTabContent(acceptedContacts, 'connected')}
      </TabsContent>

      <TabsContent value="pending" className="space-y-4">
        {renderTabContent(pendingContacts, 'pending')}
      </TabsContent>

      <TabsContent value="declined" className="space-y-4">
        {renderTabContent(declinedContacts, 'declined')}
      </TabsContent>
    </ResponsiveTabs>
  );
};

export default ContactsTabs;
