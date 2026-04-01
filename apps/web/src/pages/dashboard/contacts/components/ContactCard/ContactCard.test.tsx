import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { ContactCard } from './index';
import type { TraineeContact, TrainerContact } from '../../contacts.types';

const baseDate = new Date('2026-03-20T10:00:00Z');

const mockTraineeConnectedContact: TraineeContact = {
  id: 'contact-1',
  status: 'ACCEPTED',
  message: null,
  createdAt: baseDate,
  respondedAt: baseDate,
  trainer: {
    id: 'trainer-1',
    handle: 'john-smith',
    displayName: 'John Smith',
    profileImageUrl: 'https://example.com/john.jpg',
  },
};

const mockTraineePendingContact: TraineeContact = {
  id: 'contact-2',
  status: 'PENDING',
  message: 'Hi, I would like to train with you!',
  createdAt: baseDate,
  respondedAt: null,
  trainer: {
    id: 'trainer-2',
    handle: 'jane-doe',
    displayName: 'Jane Doe',
    profileImageUrl: null,
  },
};

const mockTraineeDeclinedContact: TraineeContact = {
  id: 'contact-3',
  status: 'DECLINED',
  message: null,
  createdAt: baseDate,
  respondedAt: baseDate,
  trainer: {
    id: 'trainer-3',
    handle: 'bob-jones',
    displayName: 'Bob Jones',
    profileImageUrl: null,
  },
};

const mockTrainerConnectedContact: TrainerContact = {
  id: 'contact-4',
  status: 'ACCEPTED',
  name: 'Alice Trainee',
  email: 'alice@example.com',
  message: null,
  createdAt: baseDate,
  respondedAt: baseDate,
  sender: {
    id: 'user-1',
    name: 'Alice Trainee',
    image: 'https://example.com/alice.jpg',
    traineeProfile: { avatarUrl: null },
  },
};

describe('ContactCard', () => {
  it('should render connected contact with message button', () => {
    render(<ContactCard contact={mockTraineeConnectedContact} variant="connected" />);

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /message/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view profile/i })).toBeInTheDocument();
  });

  it('should render pending contact with correct status', () => {
    render(<ContactCard contact={mockTraineePendingContact} variant="pending" />);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Awaiting response')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /message/i })).not.toBeInTheDocument();
  });

  it('should render pending contact message when present', () => {
    render(<ContactCard contact={mockTraineePendingContact} variant="pending" />);

    expect(screen.getByText('Your message:')).toBeInTheDocument();
    expect(screen.getByText('Hi, I would like to train with you!')).toBeInTheDocument();
  });

  it('should render declined contact', () => {
    render(<ContactCard contact={mockTraineeDeclinedContact} variant="declined" />);

    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('Declined')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /message/i })).not.toBeInTheDocument();
  });

  it('should display avatar with initials as fallback', () => {
    render(<ContactCard contact={mockTraineePendingContact} variant="pending" />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should show trainer name and timestamp info', () => {
    render(<ContactCard contact={mockTraineeConnectedContact} variant="connected" />);

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });

  it('should render trainer perspective connected contact with message button', () => {
    render(<ContactCard contact={mockTrainerConnectedContact} variant="connected" />);

    expect(screen.getByText('Alice Trainee')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /message/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view profile/i })).toBeInTheDocument();
  });
});
