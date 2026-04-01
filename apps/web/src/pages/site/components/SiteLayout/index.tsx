import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import type { PublicWebsite } from '../../site.types';

interface SiteLayoutProps {
  website: PublicWebsite;
  children: ReactNode;
  onNavigateBlog?: () => void;
  onNavigateHome?: () => void;
  onNavigateShop?: () => void;
  onOpenCart?: () => void;
  cartItemCount?: number;
  hasBlogPosts?: boolean;
  hasProducts?: boolean;
  isHomePage?: boolean;
}

export const SiteLayout = ({
  website,
  children,
  onNavigateBlog,
  onNavigateHome,
  onNavigateShop,
  onOpenCart,
  cartItemCount,
  hasBlogPosts,
  hasProducts,
  isHomePage,
}: SiteLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        website={website}
        onNavigateBlog={onNavigateBlog}
        onNavigateHome={onNavigateHome}
        onNavigateShop={onNavigateShop}
        onOpenCart={onOpenCart}
        cartItemCount={cartItemCount}
        hasBlogPosts={hasBlogPosts}
        hasProducts={hasProducts}
        isHomePage={isHomePage}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter trainer={website.trainer} />
    </div>
  );
};
