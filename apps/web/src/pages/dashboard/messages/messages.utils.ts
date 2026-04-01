import type { ConnectionBase, Message, OtherPerson } from './messages.types';

export const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const getOtherPerson = (connection: ConnectionBase, userId?: string): OtherPerson => {
  const isTrainee = connection.senderId === userId;
  return isTrainee
    ? {
        name: connection.trainer.displayName,
        image: connection.trainer.profileImageUrl,
        isTrainer: true,
        trainerHandle: connection.trainer.handle,
      }
    : {
        name: connection.sender?.name || connection.name,
        image:
          (connection.sender as { traineeProfile?: { avatarUrl: string | null } | null })
            ?.traineeProfile?.avatarUrl || connection.sender?.image,
        isTrainer: false,
        userId: connection.sender?.id,
      };
};

export const getSenderAvatarUrl = (sender: Message['sender']): string | null | undefined => {
  // Trainers store their profile photo in trainerProfile.profileImageUrl
  // Trainees store their photo in traineeProfile.avatarUrl or image (from User model)
  return sender.trainerProfile?.profileImageUrl || sender.traineeProfile?.avatarUrl || sender.image;
};
