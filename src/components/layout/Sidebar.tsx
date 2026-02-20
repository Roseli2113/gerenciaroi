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
  Plug,
  ShoppingCart,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAdminRole();
  const isMobile = useIsMobile();

  // Mobile: overlay sidebar
  if (isMobile) {
    return (
      <>
        {/* Hamburger button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 p-2 rounded-xl bg-card border border-border shadow-lg"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        {/* Overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full animate-fade-in">
              {/* Close + Logo */}
              <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                  <img src={logoImg} alt="Gerencia ROI" className="w-10 h-10 object-contain" />
                  <h1 className="font-bold text-lg text-sidebar-foreground">Gerencia ROI</h1>
                </Link>
                <button onClick={() => setMobileOpen(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                {isAdmin && (
                  <>
                    <div className="my-2 border-t border-sidebar-border" />
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                        location.pathname === '/admin'
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      )}
                    >
                      <Shield className={cn('w-5 h-5', location.pathname === '/admin' && 'text-primary')} />
                      <span className="font-medium">Área Admin</span>
                    </Link>
                  </>
                )}
              </nav>
            </aside>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="py-2 px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center">
            <img src={logoImg} alt="Gerencia ROI" className="w-14 h-14 object-contain" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in-left">
              <h1 className="font-bold text-lg text-sidebar-foreground">Gerencia ROI</h1>
            </div>
          )}
        </Link>
      </div>

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
            </Link>
          </>
        )}
      </nav>

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
