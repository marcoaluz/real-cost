import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Activity,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Usuários', path: '/admin/users', icon: Users },
  { label: 'Sugestões', path: '/admin/suggestions', icon: MessageSquare, badge: true },
  { label: 'Eventos', path: '/admin/events', icon: Activity },
  { label: 'Métricas', path: '/admin/metrics', icon: BarChart3 },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newSuggestions, setNewSuggestions] = useState(0);

  useEffect(() => {
    supabase
      .from('suggestions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['novo', 'pending'])
      .then(({ count }) => setNewSuggestions(count || 0));
  }, [location.pathname]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-border">
        <h2 className="text-sm font-bold text-foreground">Admin</h2>
        <p className="text-[10px] text-muted-foreground">Meu Custo Real</p>
      </div>
      <nav className="flex-1 px-2 py-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left',
                active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badge && newSuggestions > 0 && (
                <span className="h-5 min-w-[20px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1.5">
                  {newSuggestions}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0D0F18' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card/50 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card/30">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu size={22} />
          </button>
          <span className="text-sm font-bold text-foreground">Admin</span>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
