import './lib/sentry';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import App from './App';
import { SiteRenderer } from '@/pages/site';
import { trpc, createTRPCClient } from '@/lib/trpc';
import './styles/globals.css';
import './lib/google-maps'; // Initialize Google Maps bootstrap loader

// Subdomain detection
const hostname = window.location.hostname;
const siteDomain = (import.meta.env.VITE_SITE_DOMAIN || 'sites.fitnassist.co').trim();
const isSubdomain =
  hostname.endsWith(`.${siteDomain}`) &&
  hostname !== siteDomain &&
  hostname !== `www.${siteDomain}`;
const siteHandle = isSubdomain ? hostname.split('.')[0] : null;

// Dev fallback: ?site=handle
const urlParams = new URLSearchParams(window.location.search);
const devSiteHandle = urlParams.get('site');
const finalHandle = siteHandle || devSiteHandle;

const SiteApp = ({ handle }: { handle: string }) => {
  const [trpcClient] = useState(() => createTRPCClient());
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={qc}>
      <QueryClientProvider client={qc}>
        <SiteRenderer handle={handle} />
      </QueryClientProvider>
    </trpc.Provider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{finalHandle ? <SiteApp handle={finalHandle} /> : <App />}</React.StrictMode>,
);
