import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import type {
  Contact,
  ContactCounts,
  UserType,
  TraineeContact,
  TrainerContact,
} from '../contacts.types';

export const useContacts = () => {
  const { isTrainer } = useAuth();
  const userType: UserType = isTrainer ? 'trainer' : 'trainee';

  // Trainee: fetch sent requests (contacts they initiated)
  const { data: traineeData, isLoading: traineeLoading } = trpc.contact.getSentRequests.useQuery(
    undefined,
    {
      enabled: !isTrainer,
    },
  );

  // Trainer: fetch their requests (only accepted connection requests)
  const { data: trainerData, isLoading: trainerLoading } = trpc.contact.getMyRequests.useQuery(
    undefined,
    {
      enabled: isTrainer,
    },
  );

  const isLoading = isTrainer ? trainerLoading : traineeLoading;

  // Process trainee contacts
  const traineeContacts = (traineeData || []) as TraineeContact[];
  const traineePending = traineeContacts.filter((r) => r.status === 'PENDING');
  const traineeAccepted = traineeContacts.filter((r) => r.status === 'ACCEPTED');
  const traineeDeclined = traineeContacts.filter((r) => r.status === 'DECLINED');

  // Process trainer contacts (only accepted connection requests)
  const trainerContacts = ((trainerData || []) as TrainerContact[]).filter(
    (r) => r.status === 'ACCEPTED',
  );

  // Select the right data based on user type
  const pendingContacts: Contact[] = isTrainer ? [] : traineePending;
  const acceptedContacts: Contact[] = isTrainer ? trainerContacts : traineeAccepted;
  const declinedContacts: Contact[] = isTrainer ? [] : traineeDeclined;

  const counts: ContactCounts = {
    pending: pendingContacts.length,
    accepted: acceptedContacts.length,
    declined: declinedContacts.length,
  };

  const hasAnyContacts =
    acceptedContacts.length > 0 || pendingContacts.length > 0 || declinedContacts.length > 0;

  return {
    isLoading,
    hasAnyContacts,
    pendingContacts,
    acceptedContacts,
    declinedContacts,
    counts,
    userType,
  };
};
