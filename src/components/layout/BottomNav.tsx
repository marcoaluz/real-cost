import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Receipt, BarChart3, SlidersHorizontal, Target } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Casa', path: '/dashboard' },
  { icon: Receipt, label: 'Gastos', path: '/expenses' },
  { icon: BarChart3, label: 'Resultado', path: '/result' },
  { icon: SlidersHorizontal, label: 'Simulador', path: '/simulator' },
  { icon: Target, label: 'Metas', path: '/goals' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const hiddenPrefixes = ['/admin', '/auth', '/onboarding', '/share'];
  const shouldHide = hiddenPrefixes.some((p) => location.pathname.startsWith(p));
  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
