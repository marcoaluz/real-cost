import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_COLORS: Record<string, string> = {
  Moradia: '#378ADD', Alimentação: '#1D9E75', Transporte: '#EF9F27',
  Lazer: '#D4537E', Dívidas: '#E24B4A', Saúde: '#5DCAA5',
  Educação: '#7F77DD', Outros: '#888780',
};

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }

    const load = async () => {
      const { data, error } = await supabase
        .from('share_cards')
        .select('*')
        .eq('share_token', token)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }

      setCard(data);
      setLoading(false);

      // Increment views
      await supabase.rpc('increment_share_views', { token });
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center px-6 py-10 gap-6 max-w-sm mx-auto">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 w-full">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <span className="text-3xl">🔍</span>
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Link não encontrado</h1>
          <p className="text-sm text-muted-foreground text-center">
            Esse resultado não existe ou foi removido.
          </p>
        </div>
        <Button onClick={() => navigate('/auth/login')} className="rounded-2xl">
          Criar minha conta →
        </Button>
      </div>
    );
  }

  const d = card.card_data || {};
  const isNegative = (d.balance || 0) < 0;

  // Build pie data from card_data categories if available
  const categories = d.categories || {};
  const pieData = Object.entries(categories).map(([name, value]) => ({ name, value: value as number }));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-8 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-sm font-bold text-primary-foreground">$</span>
        </div>
        <span className="text-sm font-bold text-foreground">Meu Custo Real</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-extrabold text-foreground text-center mb-2">
        O custo real da minha vida
      </h1>

      {/* Hero phrase */}
      <div
        className={`w-full rounded-2xl p-5 border-2 text-center mb-6 ${
          isNegative ? 'border-destructive bg-destructive/10' : 'border-primary bg-primary/10'
        }`}
      >
        <p className="text-lg font-extrabold" style={{ color: isNegative ? '#E24B4A' : '#1D9E75' }}>
          {d.work_days_cost
            ? `Trabalho ${Number(d.work_days_cost).toFixed(1)} dias só pra pagar as contas`
            : `Meu estilo de vida custa ${fmt(d.total_expenses || 0)}/mês`}
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 w-full mb-6">
        <Card className="rounded-2xl p-3 border-border text-center">
          <p className="text-lg font-extrabold text-foreground">{fmt(d.total_expenses || 0)}</p>
          <p className="text-[10px] text-muted-foreground">custo total</p>
        </Card>
        <Card className="rounded-2xl p-3 border-border text-center">
          <p className="text-lg font-extrabold" style={{ color: isNegative ? '#E24B4A' : '#1D9E75' }}>
            {fmt(Math.abs(d.balance || 0))}
          </p>
          <p className="text-[10px] text-muted-foreground">{isNegative ? 'falta todo mês' : 'sobra todo mês'}</p>
        </Card>
        <Card className="rounded-2xl p-3 border-border text-center">
          <p className="text-lg font-extrabold text-foreground">{Number(d.work_days_cost || 0).toFixed(1)} dias</p>
          <p className="text-[10px] text-muted-foreground">pra pagar as contas</p>
        </Card>
        <Card className="rounded-2xl p-3 border-border text-center">
          <p className="text-lg font-extrabold text-foreground">{d.biggest_category || '—'}</p>
          <p className="text-[10px] text-muted-foreground">maior gasto</p>
        </Card>
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="w-full mb-6">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS.Outros} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer */}
      <div className="w-full mt-auto pt-6 border-t border-border flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground">Descubra o seu em meuCustoReal.app</p>
        <Button onClick={() => navigate('/auth/login')} className="w-full h-12 rounded-2xl text-sm font-semibold">
          Calcular o meu →
        </Button>
      </div>
    </div>
  );
}
