import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import type { PublicWebsite } from '../../site.types';

interface SiteLayoutProps {
  website: PublicWebsite;
  children: ReactNode;
  onNavigateBlog?: () => void;
  onNavigateHome?: () => void;
}

export const SiteLayout = ({ website, children, onNavigateBlog, onNavigateHome }: SiteLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader website={website} onNavigateBlog={onNavigateBlog} onNavigateHome={onNavigateHome} />
      <main className="flex-1">{children}</main>
      <SiteFooter trainer={website.trainer} />
    </div>
  );
};
