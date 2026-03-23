import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { CONNECTIONS_POLL_INTERVAL, MESSAGE_POLL_INTERVAL } from '../messages.constants';

export const useConnections = (sseConnected: boolean, archived?: boolean) => {
  return trpc.message.getConnections.useQuery(
    archived !== undefined ? { archived } : undefined,
    {
      refetchInterval: sseConnected ? false : CONNECTIONS_POLL_INTERVAL,
    }
  );
};

export const useConnection = (connectionId: string | undefined) => {
  return trpc.message.getConnection.useQuery(
    { connectionId: connectionId! },
    { enabled: !!connectionId }
  );
};

export const useThread = (connectionId: string | undefined, sseConnected: boolean) => {
  const utils = trpc.useUtils();
  const prevMessageCountRef = useRef<number>(0);

  const query = trpc.message.getThread.useQuery(
    { connectionId: connectionId! },
    {
      enabled: !!connectionId,
      refetchInterval: sseConnected ? false : MESSAGE_POLL_INTERVAL,
    }
  );

  // When new messages arrive via polling, invalidate unread counts
  useEffect(() => {
    if (query.data && connectionId) {
      const currentCount = query.data.length;
      if (prevMessageCountRef.current !== currentCount && prevMessageCountRef.current > 0) {
        utils.message.getUnreadCount.invalidate();
        utils.message.getConnections.invalidate();
      }
      prevMessageCountRef.current = currentCount;
    }
  }, [query.data, connectionId, utils]);

  return query;
};

export const useMarkAsRead = (connectionId: string | undefined) => {
  const utils = trpc.useUtils();

  const mutation = trpc.message.markAsRead.useMutation({
    onSuccess: () => {
      utils.message.getUnreadCount.invalidate();
      utils.message.getConnections.invalidate();
    },
  });

  useEffect(() => {
    if (connectionId) {
      mutation.mutate({ connectionId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  return mutation;
};

export const useArchiveConversation = () => {
  const utils = trpc.useUtils();
  return trpc.message.archiveConversation.useMutation({
    onSuccess: () => {
      utils.message.getConnections.invalidate();
      utils.message.getUnreadCount.invalidate();
    },
  });
};

export const useUnarchiveConversation = () => {
  const utils = trpc.useUtils();
  return trpc.message.unarchiveConversation.useMutation({
    onSuccess: () => {
      utils.message.getConnections.invalidate();
      utils.message.getUnreadCount.invalidate();
    },
  });
};

export const useDeleteConversation = () => {
  const utils = trpc.useUtils();
  return trpc.message.deleteConversation.useMutation({
    onSuccess: () => {
      utils.message.getConnections.invalidate();
      utils.message.getUnreadCount.invalidate();
    },
  });
};
