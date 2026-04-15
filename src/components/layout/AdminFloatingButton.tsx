import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

export function AdminFloatingButton() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();

  if (loading || !isAdmin) return null;

  return (
    <button
      onClick={() => navigate('/admin/dashboard')}
      className="fixed top-4 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
    >
      <Shield size={12} />
      Admin ↗
    </button>
  );
}
