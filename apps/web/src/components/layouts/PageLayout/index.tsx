import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MaxWidth, PageLayoutProps, PageHeaderProps, PageContentProps } from './PageLayout.types';

const maxWidthClasses: Record<MaxWidth, string> = {
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  'full': 'max-w-full',
};

const PageHeader = ({ title, description, icon, backLink, action }: PageHeaderProps) => (
  <div className="mb-4 sm:mb-8">
    {backLink && (
      <Link
        to={backLink.to}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLink.label}
      </Link>
    )}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          {icon}
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  </div>
);

const PageContent = ({ children, className }: PageContentProps) => (
  <div className={cn('space-y-4 sm:space-y-6', className)}>{children}</div>
);

export const PageLayout = ({ children, maxWidth = '4xl' }: PageLayoutProps) => (
  <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8', maxWidthClasses[maxWidth])}>
    {children}
  </div>
);

PageLayout.Header = PageHeader;
PageLayout.Content = PageContent;

export type { PageLayoutProps, PageHeaderProps, PageContentProps, MaxWidth } from './PageLayout.types';
