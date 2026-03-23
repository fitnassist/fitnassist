import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { NavItem } from './Sidebar.types';

interface SidebarNavProps {
  items: NavItem[];
  currentPath: string;
  isCollapsed: boolean;
}

export function SidebarNav({ items, currentPath, isCollapsed }: SidebarNavProps) {
  return (
    <nav className="p-2 space-y-1 flex-1">
      {items.map((item) => {
        const isActive = currentPath === item.href ||
          (item.href !== '/dashboard' && currentPath.startsWith(item.href));
        const hasBadge = item.badge !== undefined && item.badge > 0;

        const linkContent = (
          <Link
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isCollapsed && 'justify-center px-2',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span className="relative">
              {item.icon}
              {/* Badge - always positioned on the icon */}
              {hasBadge && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {item.badge! > 9 ? '9+' : item.badge}
                </span>
              )}
            </span>
            {!isCollapsed && (
              <span>{item.label}</span>
            )}
          </Link>
        );

        if (isCollapsed) {
          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                {linkContent}
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                {item.label}
                {hasBadge && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                    {item.badge! > 9 ? '9+' : item.badge}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={item.href}>{linkContent}</div>;
      })}
    </nav>
  );
}
