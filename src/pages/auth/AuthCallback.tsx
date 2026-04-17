import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // PKCE: troca o code pela session
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) {
          navigate('/auth/login', { replace: true });
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate('/auth/login', { replace: true });
          return;
        }

        const { data: income } = await supabase
          .from('incomes')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle();

        navigate(income ? '/dashboard' : '/onboarding', { replace: true });
      } catch {
        navigate('/auth/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Autenticando...</p>
      </div>
    </div>
  );
}
