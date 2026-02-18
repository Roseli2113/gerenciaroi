import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Settings2,
  Link2,
  FileText,
  Bell,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Zap,
  Plug,
  ShoppingCart,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminRole } from '@/hooks/useAdminRole';
import logoImg from '@/assets/Logo_gerencia_roi.png';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'Vendas', path: '/sales' },
  { icon: Target, label: 'Campanhas', path: '/campaigns' },
  { icon: Plug, label: 'Integrações', path: '/integrations' },
  { icon: Settings2, label: 'Regras', path: '/rules' },
  { icon: Link2, label: 'UTMs', path: '/utms' },
  { icon: FileText, label: 'Relatórios', path: '/reports' },
  { icon: Bell, label: 'Notificações', path: '/notifications' },
  { icon: CreditCard, label: 'Assinatura', path: '/subscription' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAdminRole();

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center">
            <img src={logoImg} alt="Gerencia ROI" className="w-12 h-12 object-contain" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in-left">
              <h1 className="font-bold text-lg text-sidebar-foreground">Gerencia ROI</h1>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-primary' : 'group-hover:text-primary'
                )}
              />
              {!collapsed && (
                <span className="font-medium animate-fade-in-left">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}

        {/* Admin area - only visible to admins */}
        {isAdmin && (
          <>
            <div className="my-2 border-t border-sidebar-border" />
            <Link
              to="/admin"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                location.pathname === '/admin'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Shield
                className={cn(
                  'w-5 h-5 transition-colors',
                  location.pathname === '/admin' ? 'text-primary' : 'group-hover:text-primary'
                )}
              />
              {!collapsed && (
                <span className="font-medium animate-fade-in-left">Área Admin</span>
              )}
              {location.pathname === '/admin' && !collapsed && (
                <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          </>
        )}
      </nav>

      {/* Collapse Button */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
