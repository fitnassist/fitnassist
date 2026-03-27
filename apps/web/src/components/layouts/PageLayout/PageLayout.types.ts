import { ReactNode } from 'react';

export type MaxWidth = '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';

export interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: MaxWidth;
}

export interface BackLink {
  to: string;
  label: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  backLink?: BackLink;
  action?: ReactNode;
}

export interface PageContentProps {
  children: ReactNode;
  className?: string;
}
