import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ChevronDown } from 'lucide-react';
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

const groupItems = (items: NavItem[]) => {
  const groups: { label: string | null; items: NavItem[] }[] = [];
  let currentGroup: string | undefined;

  for (const item of items) {
    const group = item.group ?? null;
    if (groups.length === 0 || group !== currentGroup) {
      groups.push({ label: group, items: [item] });
      currentGroup = group ?? undefined;
    } else {
      groups[groups.length - 1]!.items.push(item);
    }
  }

  return groups;
};

export function SidebarNav({ items, currentPath, isCollapsed }: SidebarNavProps) {
  const groups = groupItems(items);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderItem = (item: NavItem) => {
    const isActive = !item.disabled && (
      currentPath === item.href ||
      (item.href !== '/dashboard' && currentPath.startsWith(item.href))
    );
    const hasBadge = !item.disabled && item.badge !== undefined && item.badge > 0;

    const content = item.disabled ? (
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed opacity-50 overflow-hidden',
        )}
      >
        <span className="relative shrink-0">
          {item.icon}
        </span>
        <span className="flex-1 whitespace-nowrap overflow-hidden">{item.label}</span>
        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </div>
    ) : (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors overflow-hidden',
          isActive
            ? 'text-coral'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <span className="relative shrink-0">
          {item.icon}
          {hasBadge && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-coral text-[10px] font-medium text-white">
              {item.badge! > 9 ? '9+' : item.badge}
            </span>
          )}
        </span>
        <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
      </Link>
    );

    if (isCollapsed || item.disabled) {
      return (
        <Tooltip key={item.href} delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.disabled
              ? item.disabledTooltip ?? `${item.label} (locked)`
              : item.label}
            {hasBadge && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-medium text-white">
                {item.badge! > 9 ? '9+' : item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{content}</div>;
  };

  return (
    <nav className="p-2 flex-1 overflow-y-auto">
      {groups.map((group) => {
        if (!group.label) {
          return (
            <div key="ungrouped" className="space-y-1">
              {group.items.map(renderItem)}
            </div>
          );
        }

        const isGroupCollapsed = collapsed[group.label] ?? false;
        const groupHasBadge = group.items.some(
          (item) => !item.disabled && item.badge !== undefined && item.badge > 0,
        );

        if (isCollapsed) {
          return (
            <div key={group.label} className="mt-3 space-y-1">
              <div className="h-px bg-border mx-2 mb-1" />
              {group.items.map(renderItem)}
            </div>
          );
        }

        return (
          <div key={group.label} className="mt-3">
            <button
              type="button"
              onClick={() => toggleGroup(group.label!)}
              className="flex items-center w-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex-1 text-left">{group.label}</span>
              {groupHasBadge && isGroupCollapsed && (
                <span className="h-1.5 w-1.5 rounded-full bg-coral mr-1.5" />
              )}
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  isGroupCollapsed && '-rotate-90',
                )}
              />
            </button>
            {!isGroupCollapsed && (
              <div className="space-y-1">
                {group.items.map(renderItem)}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
