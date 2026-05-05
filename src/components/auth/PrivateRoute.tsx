import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LoadingScreen } from '@/components/layout/LoadingScreen';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen message="Verificando sua sessão..." />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}
