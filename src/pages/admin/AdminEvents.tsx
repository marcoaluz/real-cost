import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  UserPlus, LogIn, Receipt, Eye, Sliders, Share2, Star, Crown, MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EVENT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  signup: { label: 'novo cadastro', icon: UserPlus, color: '#1D9E75' },
  login: { label: 'fez login', icon: LogIn, color: '#378ADD' },
  expense_created: { label: 'adicionou um gasto', icon: Receipt, color: '#EF9F27' },
  income_saved: { label: 'cadastrou renda', icon: Receipt, color: '#1D9E75' },
  result_viewed: { label: 'viu o resultado', icon: Eye, color: '#D4537E' },
  simulator_used: { label: 'usou o simulador', icon: Sliders, color: '#7F77DD' },
  share_card_created: { label: 'compartilhou o resultado', icon: Share2, color: '#5DCAA5' },
  upgrade_clicked: { label: 'clicou em premium', icon: Star, color: '#EF9F27' },
  upgrade_completed: { label: 'virou premium', icon: Crown, color: '#1D9E75' },
  suggestion_sent: { label: 'enviou sugestão', icon: MessageSquare, color: '#378ADD' },
  goal_created: { label: 'criou uma meta', icon: Star, color: '#7F77DD' },
};

const ALL_TYPES = Object.keys(EVENT_META);

export default function AdminEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('app_events')
        .select('*, profiles:user_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);
      setEvents(data || []);
      setLoading(false);
    };
    load();

    // Realtime subscription
    const channel = supabase
      .channel('admin_events_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_events' }, async (payload) => {
        const { data } = await supabase
          .from('app_events')
          .select('*, profiles:user_id(full_name)')
          .eq('id', payload.new.id)
          .single();
        if (data) setEvents((prev) => [data, ...prev].slice(0, 100));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleType = (t: string) => {
    setTypeFilter((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const filtered = typeFilter.length === 0 ? events : events.filter((e) => typeFilter.includes(e.event_type));

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-foreground">Eventos</h1>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        {ALL_TYPES.map((t) => (
          <Button key={t} size="sm" variant={typeFilter.includes(t) ? 'default' : 'outline'}
            onClick={() => toggleType(t)} className="rounded-xl text-[10px] h-7 px-2">
            {EVENT_META[t]?.label || t}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : (
        <div className="flex flex-col gap-1">
          {filtered.map((e) => {
            const meta = EVENT_META[e.event_type] || { label: e.event_type, icon: Eye, color: '#888' };
            const Icon = meta.icon;
            const userName = e.profiles?.full_name || 'Alguém';

            return (
              <div key={e.id} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-muted/20 transition-colors">
                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: meta.color + '20' }}>
                  <Icon size={16} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{userName}</span>{' '}
                    <span className="text-muted-foreground">{meta.label}</span>
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(e.created_at), { locale: ptBR, addSuffix: true })}
                </span>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nenhum evento.</p>}
        </div>
      )}
    </div>
  );
}
