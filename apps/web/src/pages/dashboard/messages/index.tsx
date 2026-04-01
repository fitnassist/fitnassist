import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Skeleton, SkeletonConversationRow } from '@/components/ui';
import { routes } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { DashboardContext } from '@/components/layouts';
import {
  useConnections,
  useConnection,
  useThread,
  useMarkAsRead,
  useSendMessage,
  useArchiveConversation,
  useUnarchiveConversation,
  useDeleteConversation,
} from './hooks';
import { ConversationList, MessageThread, EmptyThread } from './components';
import { getOtherPerson } from './messages.utils';

export const MessagesPage = () => {
  const { connectionId } = useParams<{ connectionId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sseConnected } = useOutletContext<DashboardContext>();

  // Fetch all connections (non-archived)
  const { data: connections, isLoading: connectionsLoading } = useConnections(sseConnected);

  // Fetch archived connections
  const { data: archivedConnections } = useConnections(sseConnected, true);

  // Fetch active connection details
  const { data: activeConnection } = useConnection(connectionId);

  // Fetch messages for active thread
  const { data: messages, isLoading: messagesLoading } = useThread(connectionId, sseConnected);

  // Mark as read when viewing
  useMarkAsRead(connectionId);

  // Send message hook
  const { message, setMessage, handleSend, isPending, error } = useSendMessage(connectionId);

  // Conversation management mutations
  const archiveConversation = useArchiveConversation();
  const unarchiveConversation = useUnarchiveConversation();
  const deleteConversation = useDeleteConversation();

  const handleSelectConversation = (id: string) => {
    navigate(routes.dashboardMessageThread(id));
  };

  const handleBackToList = () => {
    navigate(routes.dashboardMessages);
  };

  const handleArchive = (id: string) => {
    archiveConversation.mutate({ connectionId: id });
    // If archiving the active conversation, navigate back
    if (id === connectionId) {
      navigate(routes.dashboardMessages);
    }
  };

  const handleUnarchive = (id: string) => {
    unarchiveConversation.mutate({ connectionId: id });
  };

  const handleDelete = (id: string) => {
    deleteConversation.mutate({ connectionId: id });
    // If deleting the active conversation, navigate back
    if (id === connectionId) {
      navigate(routes.dashboardMessages);
    }
  };

  if (connectionsLoading) {
    return (
      <div className="h-full flex">
        <div className="w-full md:w-80 lg:w-96 border-r">
          <div className="p-4 border-b">
            <Skeleton className="h-7 w-28" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonConversationRow key={i} />
          ))}
        </div>
        <div className="hidden md:flex flex-1" />
      </div>
    );
  }

  const allConnections = [...(connections ?? []), ...(archivedConnections ?? [])];
  const hasConversations = allConnections.length > 0;
  const activeOtherPerson = activeConnection ? getOtherPerson(activeConnection, user?.id) : null;

  return (
    <div className="h-full flex">
      {/* Conversation List - Desktop: always visible, Mobile: hidden when thread is active */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 border-r flex flex-col',
          connectionId ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>

        <ConversationList
          connections={connections ?? []}
          archivedConnections={archivedConnections ?? []}
          activeConnectionId={connectionId}
          userId={user?.id}
          onSelect={handleSelectConversation}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          onDelete={handleDelete}
        />
      </div>

      {/* Message Thread - Desktop: always visible, Mobile: shown when thread is active */}
      <div className={cn('flex-1 flex flex-col', connectionId ? 'flex' : 'hidden md:flex')}>
        {!connectionId ? (
          <EmptyThread />
        ) : hasConversations && activeConnection ? (
          <MessageThread
            messages={messages}
            isLoading={messagesLoading}
            otherPerson={activeOtherPerson}
            connectedAt={new Date(activeConnection.createdAt)}
            userId={user?.id}
            message={message}
            onMessageChange={setMessage}
            onSend={handleSend}
            onBack={handleBackToList}
            isPending={isPending}
            error={error}
            isDisconnected={activeConnection.status === 'CLOSED'}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
