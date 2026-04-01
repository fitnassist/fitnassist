import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { MessageThread } from './index';
import type { Message, OtherPerson } from '../../messages.types';

// Mock scrollIntoView which is not available in jsdom
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// Mock date-fns to avoid flaky time-based output
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    formatDistanceToNow: () => '2 days ago',
  };
});

const baseDate = new Date('2026-03-20T10:00:00Z');

const mockOtherPerson: OtherPerson = {
  name: 'John Trainer',
  image: 'https://example.com/john.jpg',
  isTrainer: true,
  trainerHandle: 'john-trainer',
};

const mockMessages = [
  {
    id: 'msg-1',
    content: 'Hey, how are you?',
    senderId: 'other-user',
    createdAt: baseDate,
    sender: {
      id: 'other-user',
      name: 'John Trainer',
      image: 'https://example.com/john.jpg',
      trainerProfile: { profileImageUrl: 'https://example.com/john.jpg' },
      traineeProfile: null,
    },
  },
  {
    id: 'msg-2',
    content: 'I am doing great, thanks!',
    senderId: 'current-user',
    createdAt: new Date('2026-03-20T10:05:00Z'),
    sender: {
      id: 'current-user',
      name: 'Me',
      image: null,
      trainerProfile: null,
      traineeProfile: null,
    },
  },
] as Message[];

const defaultProps = {
  messages: mockMessages,
  isLoading: false,
  otherPerson: mockOtherPerson,
  connectedAt: baseDate,
  userId: 'current-user',
  message: '',
  onMessageChange: vi.fn(),
  onSend: vi.fn(),
  onBack: vi.fn(),
  isPending: false,
  error: null,
};

describe('MessageThread', () => {
  it('should render messages with correct alignment (own vs other)', () => {
    render(<MessageThread {...defaultProps} />);

    expect(screen.getByText('Hey, how are you?')).toBeInTheDocument();
    expect(screen.getByText('I am doing great, thanks!')).toBeInTheDocument();

    // Own message container should have flex-row-reverse class
    const ownMessage = screen.getByText('I am doing great, thanks!').closest('.flex');
    expect(ownMessage).toHaveClass('flex-row-reverse');

    // Other person's message should not have flex-row-reverse
    const otherMessage = screen.getByText('Hey, how are you?').closest('.flex');
    expect(otherMessage).not.toHaveClass('flex-row-reverse');
  });

  it('should show other person name in header', () => {
    render(<MessageThread {...defaultProps} />);

    expect(screen.getByText('John Trainer')).toBeInTheDocument();
  });

  it('should disable send button when message is empty', () => {
    render(<MessageThread {...defaultProps} message="" />);

    const submitButton = document.querySelector('button[type="submit"]');
    expect(submitButton).toBeDisabled();
  });

  it('should enable send button when message has content', () => {
    render(<MessageThread {...defaultProps} message="Hello there" />);

    const submitButton = document.querySelector('button[type="submit"]');
    expect(submitButton).not.toBeDisabled();
  });

  it('should disable send button when isPending is true', () => {
    render(<MessageThread {...defaultProps} message="Hello" isPending={true} />);

    const submitButton = document.querySelector('button[type="submit"]');
    expect(submitButton).toBeDisabled();
  });

  it('should render empty state when no messages', () => {
    render(<MessageThread {...defaultProps} messages={[]} />);

    expect(
      screen.getByText('Start the conversation by sending a message below.'),
    ).toBeInTheDocument();
  });

  it('should render empty state when messages is undefined', () => {
    render(<MessageThread {...defaultProps} messages={undefined} />);

    expect(
      screen.getByText('Start the conversation by sending a message below.'),
    ).toBeInTheDocument();
  });

  it('should call onMessageChange when typing in textarea', async () => {
    const onMessageChange = vi.fn();
    const user = userEvent.setup();

    render(<MessageThread {...defaultProps} onMessageChange={onMessageChange} />);

    const textarea = screen.getByPlaceholderText('Type a message...');
    await user.type(textarea, 'H');

    expect(onMessageChange).toHaveBeenCalled();
  });

  it('should display error message when error is provided', () => {
    render(<MessageThread {...defaultProps} error={{ message: 'Failed to send message' }} />);

    expect(screen.getByText('Failed to send message')).toBeInTheDocument();
  });

  it('should link to trainer profile when other person is a trainer', () => {
    render(<MessageThread {...defaultProps} />);

    const profileLink = screen.getByRole('link');
    expect(profileLink).toHaveAttribute('href', '/trainers/john-trainer');
  });

  it('should show non-trainer other person without profile link', () => {
    const nonTrainerPerson: OtherPerson = {
      name: 'Alice Trainee',
      image: null,
      isTrainer: false,
    };

    render(<MessageThread {...defaultProps} otherPerson={nonTrainerPerson} />);

    expect(screen.getByText('Alice Trainee')).toBeInTheDocument();
    // No link wrapping the header since no trainerHandle and no userId
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
