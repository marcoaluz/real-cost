import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingDown, Wallet, Calendar, ChevronRight, BarChart3, Receipt, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { MonthlySummary } from '@/types';

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { currentMonth, currentYear } = useAppStore();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      const { data: sum } = await supabase
        .from('monthly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('reference_month', currentMonth)
        .eq('reference_year', currentYear)
        .maybeSingle();

      if (cancelled) return;

      if (sum) {
        setSummary(sum as MonthlySummary);
        setHasData(true);
      } else {
        const [{ data: incomes }, { data: expenses }] = await Promise.all([
          supabase.from('incomes').select('id').eq('user_id', user.id).limit(1),
          supabase.from('expenses').select('id').eq('user_id', user.id).limit(1),
        ]);
        if (cancelled) return;
        setHasData(!!(incomes?.length || expenses?.length));
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, currentMonth, currentYear]);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'você';

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Meu Custo Real" />

      <div className="px-4 pt-4 space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="text-2xl font-bold text-foreground">{firstName}!</h1>
        </div>

        {loading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : hasData === false ? (
          <Card className="p-6 bg-card border-border space-y-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              <h2 className="font-semibold text-foreground">Vamos começar?</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Cadastre sua renda e seus gastos para descobrir seu custo real.
            </p>
            <Button className="w-full" onClick={() => navigate('/onboarding')}>
              Configurar agora
            </Button>
          </Card>
        ) : summary ? (
          <Card className="p-5 bg-card border-border rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Resumo do mês
              </span>
              <button
                onClick={() => navigate('/result')}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                Ver detalhes <ChevronRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Custo total</p>
                <p className="text-lg font-bold text-destructive">
                  {formatBRL(summary.total_expenses)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Saldo</p>
                <p
                  className={`text-lg font-bold ${
                    summary.balance >= 0 ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {formatBRL(summary.balance)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Dias trabalhados</p>
                <p className="text-lg font-bold text-foreground">
                  {summary.work_days_cost.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Maior categoria</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {summary.biggest_category || '—'}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 bg-card border-border rounded-2xl space-y-3">
            <p className="text-sm text-muted-foreground">
              Sem resumo deste mês ainda. Veja seu resultado para gerá-lo.
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/result')}>
              Calcular agora
            </Button>
          </Card>
        )}

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide px-1">
            Atalhos
          </p>

          <button
            onClick={() => navigate('/result')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingDown className="text-primary" size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Meu resultado</p>
              <p className="text-xs text-muted-foreground">Veja o impacto real</p>
            </div>
            <ChevronRight className="text-muted-foreground" size={16} />
          </button>

          <button
            onClick={() => navigate('/expenses')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="text-primary" size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Gastos</p>
              <p className="text-xs text-muted-foreground">Adicione e veja categorias</p>
            </div>
            <ChevronRight className="text-muted-foreground" size={16} />
          </button>

          <button
            onClick={() => navigate('/simulator')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="text-primary" size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Simulador</p>
              <p className="text-xs text-muted-foreground">E se eu cortasse gastos?</p>
            </div>
            <ChevronRight className="text-muted-foreground" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
