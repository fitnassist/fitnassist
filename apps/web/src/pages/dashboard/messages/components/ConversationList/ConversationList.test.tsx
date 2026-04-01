import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { ConversationList } from './index';
import type { Connection } from '../../messages.types';

// Mock connection data
const createMockConnection = (overrides: Partial<Connection> = {}): Connection => ({
  id: 'conn-1',
  senderId: 'trainee-123',
  name: 'John Trainee',
  email: 'john@example.com',
  phone: null,
  message: null,
  type: 'CONNECTION_REQUEST',
  status: 'ACCEPTED',
  trainerId: 'trainer-1',
  respondedAt: null,
  createdAt: new Date(),
  trainer: {
    id: 'trainer-1',
    userId: 'user-trainer-1',
    displayName: 'Mike Trainer',
    profileImageUrl: 'https://example.com/mike.jpg',
    user: {
      id: 'user-trainer-1',
      name: 'Mike Trainer',
      image: null,
    },
  },
  sender: {
    id: 'trainee-123',
    name: 'John Trainee',
    image: 'https://example.com/john.jpg',
  },
  messages: [],
  unreadCount: 0,
  conversationPreferences: [],
  ...overrides,
} as unknown as Connection);

const defaultProps = {
  archivedConnections: [] as Connection[],
  onArchive: vi.fn(),
  onUnarchive: vi.fn(),
  onDelete: vi.fn(),
};

describe('ConversationList', () => {
  const user = userEvent.setup();

  it('should render empty state when no connections', () => {
    render(
      <ConversationList
        connections={[]}
        userId="user-123"
        onSelect={vi.fn()}
        {...defaultProps}
      />
    );

    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
    expect(screen.getByText(/connect with trainers or trainees to start messaging/i)).toBeInTheDocument();
  });

  it('should render list of connections', () => {
    const connections = [
      createMockConnection({ id: 'conn-1' }),
      createMockConnection({
        id: 'conn-2',
        trainer: {
          id: 'trainer-2',
          userId: 'user-trainer-2',
          displayName: 'Sarah Coach',
          profileImageUrl: null,
          user: { id: 'user-trainer-2', name: 'Sarah Coach', image: null },
        },
      } as unknown as Partial<Connection>),
    ];

    render(
      <ConversationList
        connections={connections}
        userId="trainee-123"
        onSelect={vi.fn()}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Mike Trainer')).toBeInTheDocument();
    expect(screen.getByText('Sarah Coach')).toBeInTheDocument();
  });

  it('should call onSelect when conversation is clicked', async () => {
    const onSelect = vi.fn();
    const connection = createMockConnection();

    render(
      <ConversationList
        connections={[connection]}
        userId="trainee-123"
        onSelect={onSelect}
        {...defaultProps}
      />
    );

    const buttons = screen.getAllByRole('button');
    // First button is the conversation row button
    await user.click(buttons[0]!);

    expect(onSelect).toHaveBeenCalledWith('conn-1');
  });

  it('should highlight active connection', () => {
    const connection = createMockConnection();

    render(
      <ConversationList
        connections={[connection]}
        activeConnectionId="conn-1"
        userId="trainee-123"
        onSelect={vi.fn()}
        {...defaultProps}
      />
    );

    // The parent div has border-r-primary class when active
    const row = screen.getByText('Mike Trainer').closest('.group')!;
    expect(row).toHaveClass('border-r-primary');
  });

  it('should show unread badge when there are unread messages', () => {
    const connection = createMockConnection({ unreadCount: 5 });

    render(
      <ConversationList
        connections={[connection]}
        userId="trainee-123"
        onSelect={vi.fn()}
        {...defaultProps}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show 9+ for more than 9 unread messages', () => {
    const connection = createMockConnection({ unreadCount: 15 });

    render(
      <ConversationList
        connections={[connection]}
        userId="trainee-123"
        onSelect={vi.fn()}
        {...defaultProps}
      />
    );

    // Looking for the badge text, not the badge itself
    const badge = screen.getByText((content) => content.includes('15'));
    expect(badge).toBeInTheDocument();
  });

  it('should show last message preview', () => {
    const connection = createMockConnection({
      messages: [
        {
          id: 'msg-1',
          content: 'Hey, how are you?',
          senderId: 'trainee-123',
          createdAt: new Date(),
        },
      ],
    } as unknown as Partial<Connection>);

    render(
      <ConversationList
        connections={[connection]}
        userId="trainee-123"
        onSelect={vi.fn()}
        {...defaultProps}
      />
    );

    expect(screen.getByText(/you: hey, how are you\?/i)).toBeInTheDocument();
  });

  it('should show "No messages yet" when no messages', () => {
    const connection = createMockConnection({ messages: [] });

    render(
      <ConversationList
        connections={[connection]}
        userId="trainee-123"
        onSelect={vi.fn()}
        {...defaultProps}
      />
    );

    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it('should display initials in avatar fallback', () => {
    const connection = createMockConnection({
      trainer: {
        id: 'trainer-1',
        userId: 'user-trainer-1',
        displayName: 'Mike Trainer',
        profileImageUrl: null, // No image, should show initials
        user: { id: 'user-trainer-1', name: 'Mike Trainer', image: null },
      },
    } as unknown as Partial<Connection>);

    render(
      <ConversationList
        connections={[connection]}
        userId="trainee-123"
        onSelect={vi.fn()}
        {...defaultProps}
      />
    );

    expect(screen.getByText('MT')).toBeInTheDocument();
  });
});
