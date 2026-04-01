import { trpc } from '@/lib/trpc';

export const useMyWebsite = () => {
  return trpc.website.getMyWebsite.useQuery();
};

export const useWebsitePreview = () => {
  return trpc.website.getPreview.useQuery(undefined, {
    staleTime: 0,
    gcTime: 0,
  });
};

export const usePublicWebsite = (subdomain: string) => {
  return trpc.website.getBySubdomain.useQuery({ subdomain }, { enabled: !!subdomain });
};
