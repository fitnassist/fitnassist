import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Skeleton,
  SkeletonAvatar,
  SkeletonText,
  Textarea,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { routes } from '@/config/routes';
import { getInitials, getSenderAvatarUrl } from '../../messages.utils';
import type { Message, OtherPerson } from '../../messages.types';

interface MessageThreadProps {
  messages: Message[] | undefined;
  isLoading: boolean;
  otherPerson: OtherPerson | null;
  connectedAt: Date;
  userId?: string;
  message: string;
  onMessageChange: (value: string) => void;
  onSend: (e: React.FormEvent) => void;
  onBack: () => void;
  isPending: boolean;
  error: { message: string } | null;
  isDisconnected?: boolean;
}

export const MessageThread = ({
  messages,
  isLoading,
  otherPerson,
  connectedAt,
  userId,
  message,
  onMessageChange,
  onSend,
  onBack,
  isPending,
  error,
  isDisconnected,
}: MessageThreadProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const connectionStatus = isDisconnected
    ? 'Disconnected'
    : `Connected ${formatDistanceToNow(connectedAt, { addSuffix: true })}`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <>
        <div className="p-4 border-b flex items-center gap-3">
          <SkeletonAvatar />
          <div className="space-y-2">
            <SkeletonText className="w-32" />
            <SkeletonText className="w-20" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn('flex gap-3', i % 2 === 0 && 'flex-row-reverse')}>
              <SkeletonAvatar className="h-8 w-8" />
              <Skeleton className={cn('h-16 rounded-lg', i % 2 === 0 ? 'w-1/2' : 'w-2/3')} />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Thread Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {otherPerson?.isTrainer && otherPerson.trainerHandle ? (
          <Link
            to={routes.trainerPublicProfile(otherPerson.trainerHandle)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar>
              {otherPerson.image && <AvatarImage src={otherPerson.image} alt={otherPerson.name} />}
              <AvatarFallback>{getInitials(otherPerson.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold hover:underline">{otherPerson.name}</p>
              <p className="text-xs text-muted-foreground">{connectionStatus}</p>
            </div>
          </Link>
        ) : otherPerson?.userId ? (
          <Link
            to={routes.traineeProfileView(otherPerson.userId)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar>
              {otherPerson.image && <AvatarImage src={otherPerson.image} alt={otherPerson.name} />}
              <AvatarFallback>{getInitials(otherPerson.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold hover:underline">{otherPerson.name}</p>
              <p className="text-xs text-muted-foreground">{connectionStatus}</p>
            </div>
          </Link>
        ) : (
          <>
            <Avatar>
              {otherPerson?.image && <AvatarImage src={otherPerson.image} alt={otherPerson.name} />}
              <AvatarFallback>{otherPerson ? getInitials(otherPerson.name) : '?'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{otherPerson?.name}</p>
              <p className="text-xs text-muted-foreground">{connectionStatus}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!messages || messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">
              Start the conversation by sending a message below.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.senderId === userId;
            const senderInitials = getInitials(msg.sender.name);
            const senderAvatarUrl = getSenderAvatarUrl(msg.sender);

            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];
            const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
            const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex items-end gap-2',
                  isOwn && 'flex-row-reverse',
                  !isFirstInGroup && '-mt-2',
                )}
              >
                {/* Avatar: visible only on first message in group, invisible spacer otherwise */}
                {isFirstInGroup ? (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {senderAvatarUrl && <AvatarImage src={senderAvatarUrl} alt={msg.sender.name} />}
                    <AvatarFallback className="text-xs">{senderInitials}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}

                <div>
                  <div
                    className={cn(
                      'w-fit rounded-2xl px-3 py-1.5',
                      isOwn ? 'bg-coral text-white ml-auto' : 'bg-muted',
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {isLastInGroup && (
                    <p
                      className={cn(
                        'text-xs mt-2 px-3 text-muted-foreground',
                        isOwn && 'text-right',
                      )}
                    >
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isDisconnected ? (
        <div className="border-t p-4 text-center">
          <p className="text-sm text-muted-foreground">
            This connection has been disconnected. Messages are read-only.
          </p>
        </div>
      ) : (
        <div className="border-t p-4">
          <form onSubmit={onSend} className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Type a message..."
              rows={1}
              className="resize-none min-h-[40px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend(e);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={!message.trim() || isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          {error && <p className="text-sm text-destructive mt-2">{error.message}</p>}
        </div>
      )}
    </>
  );
};
