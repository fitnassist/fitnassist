import { trpc } from '@/lib/trpc';

export const usePublicProfileData = (handle: string) => {
  return trpc.trainee.getPublicProfileData.useQuery(
    { handle },
    { enabled: !!handle },
  );
};
