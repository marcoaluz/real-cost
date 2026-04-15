import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MetricDay {
  day: string;
  new_users: number;
  active_users: number;
  expenses_created: number;
  share_cards_created: number;
  upgrade_clicked: number;
  upgrade_completed: number;
}

function fmt(n: number) { return n.toLocaleString('pt-BR'); }

function MetricCard({ label, value, prev }: { label: string; value: number; prev: number }) {
  const diff = value - prev;
  return (
    <Card className="rounded-2xl p-4 border-border">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-extrabold text-foreground">{fmt(value)}</span>
        {diff > 0 && <ArrowUp size={16} className="text-primary mb-1" />}
        {diff < 0 && <ArrowDown size={16} className="text-destructive mb-1" />}
        {diff === 0 && <Minus size={16} className="text-muted-foreground mb-1" />}
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<MetricDay[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [newSuggestions, setNewSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: m }, { data: u }, { data: s }] = await Promise.all([
        supabase.from('admin_metrics_30d').select('*').order('day', { ascending: true }),
        supabase.from('admin_users_overview').select('*').order('joined_at', { ascending: false }).limit(5),
        supabase.from('admin_suggestions_ranked').select('*').in('status', ['novo', 'pending']).limit(5),
      ]);
      setMetrics((m as MetricDay[]) || []);
      setRecentUsers(u || []);
      setNewSuggestions(s || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const today = metrics[metrics.length - 1];
  const yesterday = metrics[metrics.length - 2];

  const t = today || { new_users: 0, active_users: 0, expenses_created: 0, share_cards_created: 0, upgrade_clicked: 0, upgrade_completed: 0 };
  const y = yesterday || { new_users: 0, active_users: 0, expenses_created: 0, share_cards_created: 0, upgrade_clicked: 0, upgrade_completed: 0 };

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-foreground">Painel Admin — Meu Custo Real</h1>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard label="Novos cadastros" value={t.new_users} prev={y.new_users} />
        <MetricCard label="Usuários ativos" value={t.active_users} prev={y.active_users} />
        <MetricCard label="Gastos criados" value={t.expenses_created} prev={y.expenses_created} />
        <MetricCard label="Cards compartilhados" value={t.share_cards_created} prev={y.share_cards_created} />
        <MetricCard label="Cliques premium" value={t.upgrade_clicked} prev={y.upgrade_clicked} />
        <MetricCard label="Conversões premium" value={t.upgrade_completed} prev={y.upgrade_completed} />
      </div>

      {/* Growth chart */}
      <Card className="rounded-2xl p-5 border-border">
        <h2 className="text-sm font-semibold text-foreground mb-4">Crescimento — últimos 30 dias</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={metrics}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8A8A9A' }} tickFormatter={(v) => new Date(v).getDate().toString()} />
            <YAxis tick={{ fontSize: 10, fill: '#8A8A9A' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1A1D27', border: '1px solid #2a2d37', borderRadius: 12, fontSize: 12 }} />
            <Line type="monotone" dataKey="new_users" stroke="#1D9E75" strokeWidth={2} dot={false} name="Novos usuários" />
            <Line type="monotone" dataKey="active_users" stroke="#378ADD" strokeWidth={2} dot={false} name="Ativos" />
            <Line type="monotone" dataKey="upgrade_completed" stroke="#EF9F27" strokeWidth={2} dot={false} name="Conversões" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent users */}
      <Card className="rounded-2xl p-5 border-border">
        <h2 className="text-sm font-semibold text-foreground mb-3">Últimos cadastros</h2>
        <div className="flex flex-col gap-2">
          {recentUsers.map((u: any) => (
            <div key={u.user_id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {(u.full_name || '?')[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{u.full_name || 'Sem nome'}</p>
                  <p className="text-[10px] text-muted-foreground">{u.plan} · {u.platform || 'web'}</p>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {u.joined_at ? formatDistanceToNow(new Date(u.joined_at), { locale: ptBR, addSuffix: true }) : ''}
              </span>
            </div>
          ))}
          {recentUsers.length === 0 && <p className="text-xs text-muted-foreground">Nenhum usuário ainda.</p>}
        </div>
      </Card>

      {/* New suggestions */}
      <Card className="rounded-2xl p-5 border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Sugestões novas</h2>
          <button onClick={() => navigate('/admin/suggestions')} className="text-xs text-primary hover:underline">Ver todas</button>
        </div>
        <div className="flex flex-col gap-2">
          {newSuggestions.map((s: any) => (
            <div key={s.id} className="py-2 border-b border-border last:border-b-0">
              <p className="text-sm text-foreground line-clamp-1">{s.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground">{s.author_name || 'Anônimo'}</span>
                <span className="text-[10px] text-muted-foreground">▲ {s.upvotes}</span>
              </div>
            </div>
          ))}
          {newSuggestions.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma sugestão nova.</p>}
        </div>
      </Card>
    </div>
  );
}
