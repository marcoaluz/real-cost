import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';

function fmt(n: number) { return n.toLocaleString('pt-BR'); }

const tooltipStyle = { backgroundColor: '#1A1D27', border: '1px solid #2a2d37', borderRadius: 12, fontSize: 12 };

export default function AdminMetrics() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('admin_metrics_30d').select('*').order('day', { ascending: true })
      .then(({ data }) => { setMetrics(data || []); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Funnel data
  const totals = metrics.reduce((acc, d) => ({
    new_users: acc.new_users + d.new_users,
    active_users: acc.active_users + d.active_users,
    expenses_created: acc.expenses_created + d.expenses_created,
    share_cards_created: acc.share_cards_created + d.share_cards_created,
    result_viewed: acc.result_viewed + d.result_viewed,
    simulator_used: acc.simulator_used + d.simulator_used,
    upgrade_clicked: acc.upgrade_clicked + d.upgrade_clicked,
    upgrade_completed: acc.upgrade_completed + d.upgrade_completed,
  }), { new_users: 0, active_users: 0, expenses_created: 0, share_cards_created: 0, result_viewed: 0, simulator_used: 0, upgrade_clicked: 0, upgrade_completed: 0 });

  const funnelData = [
    { name: 'Viu resultado', value: totals.result_viewed },
    { name: 'Usou simulador', value: totals.simulator_used },
    { name: 'Clicou premium', value: totals.upgrade_clicked },
    { name: 'Converteu', value: totals.upgrade_completed },
  ];

  const funnelRates = funnelData.map((item, i) => {
    if (i === 0) return { ...item, rate: '—' };
    const prev = funnelData[i - 1].value;
    return { ...item, rate: prev > 0 ? `${((item.value / prev) * 100).toFixed(1)}%` : '0%' };
  });

  // Most frequent event
  const eventTotals: Record<string, number> = {};
  metrics.forEach((d) => {
    eventTotals['Gastos criados'] = (eventTotals['Gastos criados'] || 0) + d.expenses_created;
    eventTotals['Resultado visto'] = (eventTotals['Resultado visto'] || 0) + d.result_viewed;
    eventTotals['Simulador usado'] = (eventTotals['Simulador usado'] || 0) + d.simulator_used;
    eventTotals['Cards compartilhados'] = (eventTotals['Cards compartilhados'] || 0) + d.share_cards_created;
  });
  const mostFrequent = Object.entries(eventTotals).sort((a, b) => b[1] - a[1])[0];

  const convRate = totals.active_users > 0 ? ((totals.upgrade_completed / totals.active_users) * 100).toFixed(2) : '0';

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-extrabold text-foreground">Métricas — últimos 30 dias</h1>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl p-4 border-border">
          <p className="text-xs text-muted-foreground">Novos usuários</p>
          <p className="text-2xl font-extrabold text-foreground">{fmt(totals.new_users)}</p>
        </Card>
        <Card className="rounded-2xl p-4 border-border">
          <p className="text-xs text-muted-foreground">Conversão free→premium</p>
          <p className="text-2xl font-extrabold text-foreground">{convRate}%</p>
        </Card>
        <Card className="rounded-2xl p-4 border-border">
          <p className="text-xs text-muted-foreground">Cards compartilhados</p>
          <p className="text-2xl font-extrabold text-foreground">{fmt(totals.share_cards_created)}</p>
        </Card>
        <Card className="rounded-2xl p-4 border-border">
          <p className="text-xs text-muted-foreground">Ação mais frequente</p>
          <p className="text-lg font-bold text-foreground">{mostFrequent?.[0] || '—'}</p>
        </Card>
      </div>

      {/* Chart 1 — User growth */}
      <Card className="rounded-2xl p-5 border-border">
        <h2 className="text-sm font-semibold text-foreground mb-4">Crescimento de usuários</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={metrics}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8A8A9A' }} tickFormatter={(v) => new Date(v).getDate().toString()} />
            <YAxis tick={{ fontSize: 10, fill: '#8A8A9A' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="new_users" stroke="#1D9E75" fill="#1D9E75" fillOpacity={0.15} strokeWidth={2} name="Novos" />
            <Area type="monotone" dataKey="active_users" stroke="#378ADD" fill="#378ADD" fillOpacity={0.1} strokeWidth={2} name="Ativos" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Chart 2 — Funnel */}
      <Card className="rounded-2xl p-5 border-border">
        <h2 className="text-sm font-semibold text-foreground mb-4">Funil de conversão</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={funnelRates}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8A8A9A' }} />
            <YAxis tick={{ fontSize: 10, fill: '#8A8A9A' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#1D9E75" radius={[8, 8, 0, 0]} name="Total" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3">
          {funnelRates.slice(1).map((f) => (
            <span key={f.name} className="text-[10px] text-muted-foreground">
              {f.name}: <span className="text-foreground font-semibold">{f.rate}</span>
            </span>
          ))}
        </div>
      </Card>

      {/* Chart 3 — Engagement */}
      <Card className="rounded-2xl p-5 border-border">
        <h2 className="text-sm font-semibold text-foreground mb-4">Engajamento</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={metrics}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8A8A9A' }} tickFormatter={(v) => new Date(v).getDate().toString()} />
            <YAxis tick={{ fontSize: 10, fill: '#8A8A9A' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="expenses_created" stroke="#EF9F27" strokeWidth={2} dot={false} name="Gastos criados" />
            <Line type="monotone" dataKey="share_cards_created" stroke="#D4537E" strokeWidth={2} dot={false} name="Cards compartilhados" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
