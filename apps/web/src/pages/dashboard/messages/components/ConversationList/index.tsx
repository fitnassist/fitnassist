import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageCircle,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  ConfirmDialog,
  Button,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { getInitials, getOtherPerson } from '../../messages.utils';
import type { Connection } from '../../messages.types';

interface ConversationListProps {
  connections: Connection[];
  archivedConnections: Connection[];
  activeConnectionId?: string;
  userId?: string;
  onSelect: (id: string) => void;
  onArchive: (connectionId: string) => void;
  onUnarchive: (connectionId: string) => void;
  onDelete: (connectionId: string) => void;
}

interface ConversationRowProps {
  connection: Connection;
  isActive: boolean;
  userId?: string;
  onSelect: (id: string) => void;
  onArchive?: (connectionId: string) => void;
  onUnarchive?: (connectionId: string) => void;
  onDelete: (connectionId: string) => void;
}

const ConversationRow = ({
  connection,
  isActive,
  userId,
  onSelect,
  onArchive,
  onUnarchive,
  onDelete,
}: ConversationRowProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const otherPerson = getOtherPerson(connection, userId);
  const initials = getInitials(otherPerson.name);
  const lastMessage = connection.messages?.[0];
  const isDisconnected = connection.status === 'CLOSED';

  return (
    <>
      <div
        className={cn(
          'w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left border-b group',
          isActive && 'border-r-2 border-r-primary',
        )}
      >
        <button
          onClick={() => onSelect(connection.id)}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="relative flex-shrink-0">
            <Avatar>
              {otherPerson.image && <AvatarImage src={otherPerson.image} alt={otherPerson.name} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            {connection.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-gray-900 rounded-full text-xs flex items-center justify-center font-medium">
                {connection.unreadCount}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={cn('font-medium truncate', isDisconnected && 'text-muted-foreground')}>
                {otherPerson.name}
              </p>
              {lastMessage && (
                <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {formatDistanceToNow(new Date(lastMessage.createdAt), {
                    addSuffix: false,
                  })}
                </p>
              )}
            </div>
            {lastMessage ? (
              <p className="text-sm text-muted-foreground truncate text-left">
                {lastMessage.senderId === userId ? 'You: ' : ''}
                {lastMessage.content}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No messages yet</p>
            )}
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onArchive && (
              <DropdownMenuItem onClick={() => onArchive(connection.id)}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
            {onUnarchive && (
              <DropdownMenuItem onClick={() => onUnarchive(connection.id)}>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Unarchive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Conversation"
        description="This will clear all messages in this conversation for you. The other person will still see their messages. New messages can still be sent."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => onDelete(connection.id)}
      />
    </>
  );
};

export const ConversationList = ({
  connections,
  archivedConnections,
  activeConnectionId,
  userId,
  onSelect,
  onArchive,
  onUnarchive,
  onDelete,
}: ConversationListProps) => {
  const [showArchived, setShowArchived] = useState(false);

  if (connections.length === 0 && archivedConnections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No conversations yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Connect with trainers or trainees to start messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {connections.map((connection) => (
        <ConversationRow
          key={connection.id}
          connection={connection}
          isActive={connection.id === activeConnectionId}
          userId={userId}
          onSelect={onSelect}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      ))}

      {archivedConnections.length > 0 && (
        <div className="border-t">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full p-3 flex items-center justify-between text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archived Chats ({archivedConnections.length})
            </span>
            {showArchived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showArchived &&
            archivedConnections.map((connection) => (
              <ConversationRow
                key={connection.id}
                connection={connection}
                isActive={connection.id === activeConnectionId}
                userId={userId}
                onSelect={onSelect}
                onUnarchive={onUnarchive}
                onDelete={onDelete}
              />
            ))}
        </div>
      )}
    </div>
  );
};
