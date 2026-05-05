import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href)
      .then(({ error }) => {
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/auth/login', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6 px-6">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-primary" />
        <h1 className="text-2xl font-bold text-foreground">Verificando sua sessão...</h1>
      </div>
    </div>
  );
}
