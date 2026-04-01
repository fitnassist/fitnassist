import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, ChevronUp, UserCircle } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { routes } from '@/config/routes';
import type { SidebarUser } from './Sidebar.types';

interface SidebarUserMenuProps {
  user: SidebarUser;
  onSignOut: () => void;
  isCollapsed: boolean;
}

export const SidebarUserMenu = ({ user, onSignOut, isCollapsed }: SidebarUserMenuProps) => {
  const navigate = useNavigate();

  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  const avatarContent = (
    <Avatar className="h-10 w-10 cursor-pointer">
      {user.image && <AvatarImage src={user.image} alt={user.name} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );

  const menuContent = (
    <DropdownMenuContent side="top" align={isCollapsed ? 'start' : 'center'} className="w-56 mb-3">
      <DropdownMenuLabel>
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.role}</p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() =>
          navigate(user.role === 'Trainer' ? routes.trainerProfileEdit : routes.traineeProfileEdit)
        }
        className="cursor-pointer"
      >
        <UserCircle className="mr-2 h-4 w-4" />
        My Profile
      </DropdownMenuItem>
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
  );

  return (
    <div className="border-t overflow-hidden">
      <DropdownMenu>
        <Tooltip delayDuration={0} open={isCollapsed ? undefined : false}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full text-left hover:bg-muted/50 p-3 transition-colors outline-none overflow-hidden">
                <span className="shrink-0">{avatarContent}</span>
                <div className="flex-1 min-w-0 whitespace-nowrap overflow-hidden">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">{user.name}</TooltipContent>
        </Tooltip>
        {menuContent}
      </DropdownMenu>
    </div>
  );
};
