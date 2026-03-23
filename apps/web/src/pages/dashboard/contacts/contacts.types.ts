import type { ContactRequestStatus } from '@fitnassist/database';

export type TabValue = 'connected' | 'pending' | 'declined';

export type UserType = 'trainer' | 'trainee';

export interface TrainerInfo {
  id: string;
  handle: string;
  displayName: string;
  profileImageUrl: string | null;
}

export interface UserInfo {
  id: string;
  name: string;
  image: string | null;
  traineeProfile?: {
    avatarUrl: string | null;
  } | null;
}

// Contact from trainee perspective (they see the trainer)
export interface TraineeContact {
  id: string;
  status: ContactRequestStatus;
  message: string | null;
  createdAt: Date;
  respondedAt: Date | null;
  trainer: TrainerInfo;
}

// Contact from trainer perspective (they see the trainee/sender)
export interface TrainerContact {
  id: string;
  status: ContactRequestStatus;
  name: string;
  email: string;
  message: string | null;
  createdAt: Date;
  respondedAt: Date | null;
  sender: UserInfo | null;
}

// Union type for contacts
export type Contact = TraineeContact | TrainerContact;

// Type guard to check if contact is from trainee perspective
export const isTraineeContact = (contact: Contact): contact is TraineeContact => {
  return 'trainer' in contact;
};

export interface ContactCounts {
  pending: number;
  accepted: number;
  declined: number;
}
