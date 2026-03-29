import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@fitnassist/api/src/routers';

type RouterOutput = inferRouterOutputs<AppRouter>;

// The public website data returned by website.getBySubdomain
export type PublicWebsite = NonNullable<RouterOutput['website']['getBySubdomain']>;

export type PublicSection = PublicWebsite['sections'][number];

export type PublicTrainer = PublicWebsite['trainer'];
