import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

function detectPlatform(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad/i.test(ua)) return 'ios';
  return 'web';
}

async function loadUserExtras(userId: string) {
  try {
    const [{ data: profile }, { data: adminRole }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('admin_roles').select('id').eq('user_id', userId).maybeSingle(),
    ]);

    useAuthStore.getState().setProfile(profile ?? null);
    useAuthStore.getState().setIsAdmin(!!adminRole);

    supabase
      .from('user_sessions')
      .upsert(
        {
          user_id: userId,
          platform: detectPlatform(),
          device_info: navigator.userAgent,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,platform' },
      )
      .then(() => {});
  } catch (err) {
    console.error('[Auth] loadUserExtras error', err);
  }
}

export function useAuth() {
  const { setUser, setProfile, setIsAdmin, setIsLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Listener FIRST (sync only — defer async work to avoid deadlocks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      setIsLoading(false);

      if (user) {
        if (window.location.pathname === '/auth/login' || window.location.pathname === '/auth/callback') {
          navigate('/', { replace: true });
        }
        setTimeout(() => loadUserExtras(user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        if (window.location.pathname !== '/auth/login' && window.location.pathname !== '/auth/callback') {
          navigate('/auth/login', { replace: true });
        }
      }
    });

    // 2. Then check existing session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        const user = session?.user ?? null;
        setUser(user);
        setIsLoading(false);
        if (user) setTimeout(() => loadUserExtras(user.id), 0);
      })
      .catch((err) => {
        console.error('[Auth] getSession error', err);
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [navigate, setUser, setProfile, setIsAdmin, setIsLoading]);

  return useAuthStore();
}
