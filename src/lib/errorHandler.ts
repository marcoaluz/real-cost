import { toast } from 'sonner';

export function handleSupabaseError(error: any): null {
  const message = error?.message || 'Erro inesperado. Tente novamente.';
  console.error('[Supabase Error]', error);

  if (message.includes('JWT')) {
    toast.error('Sua sessão expirou. Faça login novamente.');
  } else if (message.includes('permission') || message.includes('RLS')) {
    toast.error('Você não tem permissão para essa ação.');
  } else if (message.includes('duplicate')) {
    toast.error('Esse registro já existe.');
  } else if (message.includes('network') || message.includes('fetch')) {
    toast.error('Erro de conexão. Verifique sua internet.');
  } else {
    toast.error(message);
  }

  return null;
}
