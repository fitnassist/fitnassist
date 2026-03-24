import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { routes } from '@/config/routes';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/components/layouts';

interface MobileBottomNavProps {
  navItems: NavItem[];
  currentPath: string;
}

export const MobileBottomNav = ({ navItems, currentPath }: MobileBottomNavProps) => {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <>
      {toast && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-50 bg-foreground text-background text-center text-sm py-2 px-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = !item.disabled && (
              currentPath === item.href ||
              (item.href !== routes.dashboard && currentPath.startsWith(item.href))
            );

            if (item.disabled) {
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
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
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
          })}
        </div>
      </nav>
    </>
  );
};
