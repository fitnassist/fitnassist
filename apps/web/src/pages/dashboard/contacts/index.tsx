import { Navigate } from 'react-router-dom';
import { SkeletonHeader, SkeletonTabs, SkeletonCardList } from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useAuth } from '@/hooks';
import { routes } from '@/config/routes';
import { useContacts } from './hooks';
import { EmptyContacts, ContactsTabs } from './components';

export const ContactsPage = () => {
  const { isTrainer } = useAuth();
  const {
    isLoading,
    hasAnyContacts,
    pendingContacts,
    acceptedContacts,
    declinedContacts,
    counts,
    userType,
  } = useContacts();

  if (isTrainer) {
    return <Navigate to={routes.dashboardClients} replace />;
  }

  if (isLoading) {
    return (
      <PageLayout>
        <PageLayout.Content>
          <SkeletonHeader />
          <SkeletonTabs count={3} />
          <SkeletonCardList count={3} />
        </PageLayout.Content>
      </PageLayout>
    );
  }

  const description = userType === 'trainer'
    ? 'View and message your connected trainees.'
    : 'View your connection requests and connected trainers.';

  return (
    <PageLayout>
      <PageLayout.Header
        title="My Contacts"
        description={description}
      />
      <PageLayout.Content>
        {!hasAnyContacts ? (
          <EmptyContacts userType={userType} />
        ) : (
          <ContactsTabs
            pendingContacts={pendingContacts}
            acceptedContacts={acceptedContacts}
            declinedContacts={declinedContacts}
            counts={counts}
            userType={userType}
          />
        )}
      </PageLayout.Content>
    </PageLayout>
  );
};

export default ContactsPage;
