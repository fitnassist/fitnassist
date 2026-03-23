import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

export const useSendMessage = (connectionId: string | undefined) => {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [message, setMessage] = useState('');

  const mutation = trpc.message.send.useMutation({
    onMutate: async (newMessage) => {
      await utils.message.getThread.cancel({ connectionId: newMessage.connectionId });
      await utils.message.getConnections.cancel();

      const previousMessages = utils.message.getThread.getData({
        connectionId: newMessage.connectionId,
      });

      if (user) {
        utils.message.getThread.setData(
          { connectionId: newMessage.connectionId },
          (old) => {
            if (!old) return old;
            return [
              ...old,
              {
                id: `temp-${Date.now()}`,
                connectionId: newMessage.connectionId,
                senderId: user.id,
                content: newMessage.content,
                isRead: false,
                readAt: null,
                createdAt: new Date(),
                sender: {
                  id: user.id,
                  name: user.name || 'You',
                  image: user.image || null,
                  trainerProfile: null,
                  traineeProfile: null,
                },
              },
            ];
          }
        );
      }

      setMessage('');
      return { previousMessages };
    },
    onError: (_err, newMessage, context) => {
      if (context?.previousMessages) {
        utils.message.getThread.setData(
          { connectionId: newMessage.connectionId },
          context.previousMessages
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      utils.message.getThread.invalidate({ connectionId: variables.connectionId });
      utils.message.getConnections.invalidate();
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !connectionId) return;

    mutation.mutate({
      connectionId,
      content: trimmedMessage,
    });
  };

  return {
    message,
    setMessage,
    handleSend,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
