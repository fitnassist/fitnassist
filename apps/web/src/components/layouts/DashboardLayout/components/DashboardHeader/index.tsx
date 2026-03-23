import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Settings } from 'lucide-react';
import { routes } from '@/config/routes';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';

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

export const DashboardHeader = ({ isDark, onToggleTheme, user, onSignOut }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="border-b bg-background sticky top-0 z-50 flex-shrink-0">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link to={routes.dashboard} className="text-xl font-bold text-primary">
            Fitnassist
          </Link>
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {user && onSignOut && (
              <div className="lg:hidden flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full" aria-label="User menu">
                      <Avatar className="h-8 w-8">
                        {user.image && <AvatarImage src={user.image} alt={user.name} />}
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
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
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
