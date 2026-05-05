import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Share2, Sparkles, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  generateImpactPhrases,
  calcWorkDaysCost,
  calcExpenseByCategory,
  calcBalance,
  calcBiggestCategory,
} from '@/lib/calculations';
import type { Income, Expense, MonthlySummary } from '@/types';

const CATEGORY_META: Record<string, { color: string; emoji: string }> = {
  Moradia: { color: '#378ADD', emoji: '🏠' },
  Alimentação: { color: '#1D9E75', emoji: '🍽️' },
  Transporte: { color: '#EF9F27', emoji: '🚗' },
  Lazer: { color: '#D4537E', emoji: '🎉' },
  Dívidas: { color: '#E24B4A', emoji: '💳' },
  Saúde: { color: '#5DCAA5', emoji: '💊' },
  Educação: { color: '#7F77DD', emoji: '📚' },
  Outros: { color: '#888780', emoji: '📦' },
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function genToken() {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

export default function ResultPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentMonth, currentYear } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [salary, setSalary] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      const [{ data: incomes }, { data: exps }] = await Promise.all([
        supabase
          .from('incomes')
          .select('*')
          .eq('user_id', user.id)
          .eq('reference_month', currentMonth)
          .eq('reference_year', currentYear),
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .eq('reference_month', currentMonth)
          .eq('reference_year', currentYear),
      ]);

      if (cancelled) return;

      const incomeList = (incomes ?? []) as Income[];
      const expenseList = (exps ?? []) as Expense[];

      const totalIncome = incomeList.reduce(
        (acc, i) => acc + Number(i.salary || 0) + Number(i.extra_income || 0),
        0,
      );
      const mainSalary = incomeList.reduce((acc, i) => acc + Number(i.salary || 0), 0);
      const totalExpenses = expenseList.reduce((acc, e) => acc + Number(e.amount || 0), 0);
      const balance = calcBalance(totalIncome, totalExpenses);
      const workDaysCost = calcWorkDaysCost(totalExpenses, mainSalary);
      const biggestCategory = calcBiggestCategory(expenseList);

      setSalary(mainSalary);
      setExpenses(expenseList);

      if (incomeList.length === 0 && expenseList.length === 0) {
        setSummary(null);
        setLoading(false);
        return;
      }

      // Upsert monthly summary
      const { data: upserted } = await supabase
        .from('monthly_summaries')
        .upsert(
          {
            user_id: user.id,
            reference_month: currentMonth,
            reference_year: currentYear,
            total_income: totalIncome,
            total_expenses: totalExpenses,
            balance,
            work_days_cost: workDaysCost,
            biggest_category: biggestCategory,
          },
          { onConflict: 'user_id,reference_month,reference_year' },
        )
        .select()
        .single();

      if (!cancelled) {
        setSummary(
          (upserted as MonthlySummary) ?? {
            id: '',
            user_id: user.id,
            reference_month: currentMonth,
            reference_year: currentYear,
            total_income: totalIncome,
            total_expenses: totalExpenses,
            balance,
            work_days_cost: workDaysCost,
            biggest_category: biggestCategory,
          },
        );
        setLoading(false);
      }

      // Track view
      supabase
        .from('app_events')
        .insert({
          user_id: user.id,
          event_type: 'result_viewed',
          platform: 'web',
          metadata: { reference_month: currentMonth, reference_year: currentYear },
        })
        .then(() => {});
    })();

    return () => {
      cancelled = true;
    };
  }, [user, currentMonth, currentYear]);

  const expensesByCategory = useMemo(() => calcExpenseByCategory(expenses), [expenses]);

  const pieData = useMemo(
    () =>
      Object.entries(expensesByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    [expensesByCategory],
  );

  const totalForPie = pieData.reduce((acc, p) => acc + p.value, 0);

  const handleShare = async () => {
    if (!user || !summary) return;
    setSharing(true);
    try {
      const share_token = genToken();
      const { data, error } = await supabase
        .from('share_cards')
        .insert({
          user_id: user.id,
          share_token,
          card_data: {
            summary,
            expensesByCategory,
            salary,
            categories: expensesByCategory,
            total_expenses: summary.total_expenses,
            balance: summary.balance,
            work_days_cost: summary.work_days_cost,
            biggest_category: summary.biggest_category,
          },
        })
        .select('share_token')
        .single();

      if (error) throw error;

      await supabase.from('app_events').insert({
        user_id: user.id,
        event_type: 'share_card_created',
        platform: 'web',
        metadata: { share_token: data.share_token },
      });

      navigate(`/share/${data.share_token}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Não foi possível criar o link. Tente novamente.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Seu resultado" showBack />

      <div className="px-4 pt-2 space-y-6">
        {loading ? (
          <>
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </>
        ) : !summary ? (
          <Card className="p-6 bg-card border-border rounded-2xl space-y-4 text-center mt-10">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="text-primary" size={26} />
              </div>
            </div>
            <h2 className="text-lg font-bold text-foreground">Sem dados ainda</h2>
            <p className="text-sm text-muted-foreground">
              Cadastre sua renda e seus gastos para descobrir o custo real da sua vida.
            </p>
            <Button className="w-full rounded-2xl" onClick={() => navigate('/onboarding')}>
              Começar agora
            </Button>
          </Card>
        ) : (
          <>
            {/* SECTION 1 — Impact phrases */}
            <div className="space-y-3">
              {generateImpactPhrases(summary, salary).map((phrase, i) => {
                const isFirst = i === 0;
                return (
                  <Card
                    key={i}
                    className={`p-5 rounded-2xl border-2 animate-in fade-in slide-in-from-bottom-2 ${
                      isFirst
                        ? summary.balance < 0
                          ? 'border-destructive bg-destructive/10'
                          : 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    }`}
                    style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
                  >
                    <p
                      className={`font-extrabold leading-snug ${
                        isFirst ? 'text-xl' : 'text-base text-foreground'
                      }`}
                      style={
                        isFirst
                          ? { color: summary.balance < 0 ? '#E24B4A' : '#1D9E75' }
                          : undefined
                      }
                    >
                      {phrase}
                    </p>
                  </Card>
                );
              })}
            </div>

            {/* SECTION 2 — Pie chart */}
            {pieData.length > 0 && (
              <Card className="p-5 bg-card border-border rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Gastos por categoria</h3>
                  <span className="text-xs text-muted-foreground">{fmt(totalForPie)}</span>
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={(CATEGORY_META[entry.name] ?? CATEGORY_META.Outros).color}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {pieData.map((entry) => {
                    const meta = CATEGORY_META[entry.name] ?? CATEGORY_META.Outros;
                    const pct = totalForPie > 0 ? (entry.value / totalForPie) * 100 : 0;
                    return (
                      <div
                        key={entry.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: meta.color }}
                          />
                          <span className="text-foreground">
                            {meta.emoji} {entry.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium">{fmt(entry.value)}</span>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* SECTION 3 — Financial summary */}
            <Card className="p-5 bg-card border-border rounded-2xl space-y-4">
              <h3 className="font-semibold text-foreground">Resumo financeiro</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-secondary/40 p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] uppercase tracking-wide">
                    <Wallet size={12} /> Renda
                  </div>
                  <p className="text-lg font-bold text-foreground mt-1">
                    {fmt(summary.total_income)}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary/40 p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] uppercase tracking-wide">
                    <TrendingDown size={12} /> Gastos
                  </div>
                  <p className="text-lg font-bold text-destructive mt-1">
                    {fmt(summary.total_expenses)}
                  </p>
                </div>
                <div className="col-span-2 rounded-xl bg-secondary/40 p-3">
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wide">
                    Saldo do mês
                  </div>
                  <p
                    className={`text-2xl font-extrabold mt-1 ${
                      summary.balance >= 0 ? 'text-primary' : 'text-destructive'
                    }`}
                  >
                    {fmt(summary.balance)}
                  </p>
                </div>
              </div>

              <div
                className={`rounded-2xl p-4 border-2 ${
                  summary.balance < 0
                    ? 'border-destructive bg-destructive/10'
                    : 'border-primary bg-primary/10'
                }`}
              >
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wide">
                  <Calendar size={12} /> Dias de trabalho pra pagar contas
                </div>
                <p
                  className="text-3xl font-extrabold mt-1"
                  style={{ color: summary.balance < 0 ? '#E24B4A' : '#1D9E75' }}
                >
                  {summary.work_days_cost.toFixed(1)} dias
                </p>
              </div>
            </Card>

            {/* SECTION 4 — Share */}
            <Button
              onClick={handleShare}
              disabled={sharing}
              className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
            >
              <Share2 size={18} />
              {sharing ? 'Gerando link...' : 'Compartilhar meu resultado'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
