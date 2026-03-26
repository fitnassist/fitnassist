import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Menu, LogOut, Settings, UserCircle } from 'lucide-react';
import { routes } from '@/config/routes';
import { cn } from '@/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import type { NavItem } from '@/components/layouts';

interface MobileBottomNavProps {
  navItems: NavItem[];
  currentPath: string;
  user: {
    name: string;
    image: string | null;
    role: string;
  };
  onSignOut: () => void;
  isTrainee: boolean;
}

export const MobileBottomNav = ({
  navItems,
  currentPath,
  user,
  onSignOut,
  isTrainee,
}: MobileBottomNavProps) => {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  // Split nav items: bottom bar vs "more" sheet
  const bottomItems = navItems.filter((item) => item.mobileBottom);
  const moreItems = navItems.filter((item) => !item.mobileBottom);

  const isActive = (href: string) =>
    !href ? false : currentPath === href || (href !== routes.dashboard && currentPath.startsWith(href));

  const renderNavLink = (item: NavItem, variant: 'bottom' | 'sheet') => {
    const active = isActive(item.href);

    if (item.disabled) {
      if (variant === 'bottom') {
        return (
          <button
            key={item.href}
            type="button"
            onClick={() => showToast(item.disabledTooltip ?? 'Upgrade to unlock')}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground/40"
          >
            <span className="relative">
              {item.icon}
              <Lock className="absolute -bottom-0.5 -right-1 h-2.5 w-2.5" />
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      }
      return (
        <button
          key={item.href}
          type="button"
          onClick={() => showToast(item.disabledTooltip ?? 'Upgrade to unlock')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground/40"
        >
          <span className="relative">
            {item.icon}
            <Lock className="absolute -bottom-0.5 -right-1 h-2.5 w-2.5" />
          </span>
          <span className="text-sm font-medium">{item.label}</span>
        </button>
      );
    }

    if (variant === 'bottom') {
      return (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
            active ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <span className="relative">
            {item.icon}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-medium">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium">{item.label}</span>
        </Link>
      );
    }

    // Sheet variant
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={() => setSheetOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
          active
            ? 'text-coral bg-coral-50 dark:bg-coral-950/20'
            : 'text-foreground hover:bg-muted'
        )}
      >
        <span className="relative">
          {item.icon}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-coral text-white rounded-full text-[10px] flex items-center justify-center font-medium">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </span>
        <span className="text-sm font-medium">{item.label}</span>
      </Link>
    );
  };

  // Check if any "more" items have active badges
  const moreBadgeCount = moreItems.reduce((sum, item) => sum + (item.badge ?? 0), 0);

  return (
    <>
      {toast && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-50 bg-foreground text-background text-center text-sm py-2 px-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
        <div className="flex items-center h-16 px-2">
          {/* Bottom bar items */}
          {bottomItems.map((item) => renderNavLink(item, 'bottom'))}

          {/* More button */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors text-muted-foreground',
              sheetOpen && 'text-primary'
            )}
          >
            <span className="relative">
              <Menu className="h-5 w-5" />
              {moreBadgeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-medium">
                  {moreBadgeCount > 9 ? '9+' : moreBadgeCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">More</span>
          </button>

          {/* User avatar menu */}
          <div className="flex flex-col items-center justify-center flex-1 h-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full" aria-label="User menu">
                  <Avatar className="h-7 w-7">
                    {user.image && <AvatarImage src={user.image} alt={user.name} />}
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isTrainee && (
                  <DropdownMenuItem
                    onClick={() => navigate(routes.traineeProfileEdit)}
                    className="cursor-pointer"
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => navigate(routes.dashboardSettings)}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* More sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="px-4 pb-20 max-h-[70vh] overflow-auto">
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="text-base">Menu</SheetTitle>
          </SheetHeader>
          <nav className="space-y-1">
            {moreItems.map((item) => renderNavLink(item, 'sheet'))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
};
