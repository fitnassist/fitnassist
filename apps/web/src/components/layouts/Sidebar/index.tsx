import { useState } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button, TooltipProvider } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SidebarNav } from './SidebarNav';
import { SidebarUserMenu } from './SidebarUserMenu';
import type { SidebarProps } from './Sidebar.types';

export function Sidebar({ navItems, user, onSignOut, currentPath }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'border-r bg-muted/30 hidden lg:flex lg:flex-col transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Collapse toggle */}
        <div className={cn('p-2 flex', isCollapsed ? 'justify-center' : 'justify-end')}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        <SidebarNav items={navItems} currentPath={currentPath} isCollapsed={isCollapsed} />

        <SidebarUserMenu user={user} onSignOut={onSignOut} isCollapsed={isCollapsed} />
      </aside>
    </TooltipProvider>
  );
}

export type { NavItem, SidebarUser, SidebarProps } from './Sidebar.types';
