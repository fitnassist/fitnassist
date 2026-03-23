import { trpc } from '@/lib/trpc';

export const useClientNotes = (clientRosterId: string) => {
  return trpc.clientRoster.getNotes.useQuery(
    { clientRosterId },
    { enabled: !!clientRosterId }
  );
};

export const useAddClientNote = () => {
  const utils = trpc.useUtils();
  return trpc.clientRoster.addNote.useMutation({
    onSuccess: (_data, variables) => {
      utils.clientRoster.getNotes.invalidate({ clientRosterId: variables.clientRosterId });
    },
  });
};

export const useDeleteClientNote = () => {
  const utils = trpc.useUtils();
  return trpc.clientRoster.deleteNote.useMutation({
    onSuccess: () => {
      utils.clientRoster.getNotes.invalidate();
    },
  });
};
