import { Logo } from '@/components/Logo';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui';
import { NotificationBell } from '../NotificationBell';

interface DashboardHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  user?: {
    name: string;
    image: string | null;
    role: string;
  };
  onSignOut?: () => void;
}

export const DashboardHeader = ({ isDark, onToggleTheme }: DashboardHeaderProps) => {
  return (
    <header className="border-b border-white/10 bg-[hsl(230,25%,10%)] sticky top-0 z-50 flex-shrink-0">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Logo />
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <NotificationBell />
          </nav>
        </div>
      </div>
    </header>
  );
};
