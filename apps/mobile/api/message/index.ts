import { trpc } from '@/lib/trpc';

export const useConnections = (archived?: boolean) => {
  return trpc.message.getConnections.useQuery(
    archived !== undefined ? { archived } : undefined,
  );
};

export const useThread = (connectionId: string) => {
  return trpc.message.getThread.useQuery(
    { connectionId },
    { enabled: !!connectionId },
  );
};

export const useSendMessage = () => {
  const utils = trpc.useUtils();
  return trpc.message.send.useMutation({
    onSuccess: (_data, variables) => {
      utils.message.getThread.invalidate({ connectionId: variables.connectionId });
      utils.message.getConnections.invalidate();
    },
  });
};

export const useMarkAsRead = () => {
  const utils = trpc.useUtils();
  return trpc.message.markAsRead.useMutation({
    onSuccess: () => {
      utils.message.getConnections.invalidate();
      utils.message.getUnreadCount.invalidate();
    },
  });
};

export const useUnreadMessageCount = () => {
  return trpc.message.getUnreadCount.useQuery(undefined, {
    refetchInterval: 5000,
  });
};

export const useArchiveConversation = () => {
  const utils = trpc.useUtils();
  return trpc.message.archiveConversation.useMutation({
    onSuccess: () => {
      utils.message.getConnections.invalidate();
    },
  });
};

export const useDeleteConversation = () => {
  const utils = trpc.useUtils();
  return trpc.message.deleteConversation.useMutation({
    onSuccess: () => {
      utils.message.getConnections.invalidate();
    },
  });
};
