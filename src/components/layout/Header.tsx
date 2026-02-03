import { ReactNode } from 'react';
import { Sun, Moon, Bell, User, LogOut } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  headerAction?: ReactNode;
}

export function Header({ title, headerAction }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';
  const userEmail = user?.email || 'Usuário';

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {headerAction}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-xl hover:bg-accent"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-warning" />
          ) : (
            <Moon className="w-5 h-5 text-primary" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl hover:bg-accent relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-3 rounded-xl hover:bg-accent">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium truncate max-w-32">{userEmail}</p>
              </div>
              <Avatar className="w-9 h-9 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell className="w-4 h-4 mr-2" />
              Notificações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
