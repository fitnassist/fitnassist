import type { ReactNode } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
  disabled?: boolean;
  disabledTooltip?: string;
}

export interface SidebarUser {
  name: string;
  image: string | null;
  role: 'Trainer' | 'Trainee';
}

export interface SidebarProps {
  navItems: NavItem[];
  user: SidebarUser;
  onSignOut: () => void;
  currentPath: string;
}
