import { Outlet, Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { routes } from '@/config/routes';
import { Button } from '@/components/ui';
import { useTheme } from '@/providers';

export function AuthLayout() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-muted/50">
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to={routes.home} className="text-xl font-bold text-primary">
              Fitnassist
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <Outlet />
      </main>
    </div>
  );
}
