import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
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

export default function ResultPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentMonth, currentYear } = useAppStore();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      const { data: existing } = await supabase
        .from('monthly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('reference_month', currentMonth)
        .eq('reference_year', currentYear)
        .maybeSingle();

      if (cancelled) return;

      if (existing) {
        setSummary(existing as MonthlySummary);
        setLoading(false);
        return;
      }

      const [{ data: incomes }, { data: expenses }] = await Promise.all([
        supabase
          .from('incomes')
          .select('salary, extra_income')
          .eq('user_id', user.id)
          .eq('reference_month', currentMonth)
          .eq('reference_year', currentYear),
        supabase
          .from('expenses')
          .select('category, amount')
          .eq('user_id', user.id)
          .eq('reference_month', currentMonth)
          .eq('reference_year', currentYear),
      ]);

      if (cancelled) return;

      const totalIncome =
        (incomes ?? []).reduce(
          (acc, i) => acc + Number(i.salary || 0) + Number(i.extra_income || 0),
          0,
        ) || 0;
      const totalExpenses =
        (expenses ?? []).reduce((acc, e) => acc + Number(e.amount || 0), 0) || 0;

      const byCategory: Record<string, number> = {};
      (expenses ?? []).forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount || 0);
      });
      const biggestCategory =
        Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

      const dailyIncome = totalIncome > 0 ? totalIncome / 30 : 0;
      const workDaysCost = dailyIncome > 0 ? totalExpenses / dailyIncome : 0;

      setSummary({
        id: 'preview',
        user_id: user.id,
        reference_month: currentMonth,
        reference_year: currentYear,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        balance: totalIncome - totalExpenses,
        work_days_cost: workDaysCost,
        biggest_category: biggestCategory,
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, currentMonth, currentYear]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Meu resultado" showBack />

      <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : summary ? (
          <>
            <Card className="p-5 bg-card border-border rounded-2xl space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Saldo do mês
                </p>
                <p
                  className={`text-3xl font-bold ${
                    summary.balance >= 0 ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {formatBRL(summary.balance)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <TrendingUp size={12} /> Renda
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {formatBRL(summary.total_income)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <TrendingDown size={12} /> Gastos
                  </div>
                  <p className="text-lg font-semibold text-destructive">
                    {formatBRL(summary.total_expenses)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-card border-border rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                <Calendar size={12} /> Custo em dias trabalhados
              </div>
              <p className="text-2xl font-bold text-foreground">
                {summary.work_days_cost.toFixed(1)} dias
              </p>
              <p className="text-xs text-muted-foreground">
                Quanto você trabalhou só para pagar os gastos do mês.
              </p>
            </Card>

            {summary.biggest_category && (
              <Card className="p-5 bg-card border-border rounded-2xl space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Maior categoria
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {summary.biggest_category}
                </p>
              </Card>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/expenses')}
            >
              Ver gastos detalhados
            </Button>
          </>
        ) : (
          <Card className="p-6 bg-card border-border rounded-2xl space-y-3">
            <p className="text-sm text-muted-foreground">
              Sem dados suficientes para calcular o resultado.
            </p>
            <Button className="w-full" onClick={() => navigate('/onboarding')}>
              Configurar agora
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
