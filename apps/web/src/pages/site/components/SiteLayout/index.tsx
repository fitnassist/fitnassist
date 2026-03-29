import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import type { PublicWebsite } from '../../site.types';

interface SiteLayoutProps {
  website: PublicWebsite;
  children: ReactNode;
}

export const SiteLayout = ({ website, children }: SiteLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader website={website} />
      <main className="flex-1">{children}</main>
      <SiteFooter trainer={website.trainer} />
    </div>
  );
};
