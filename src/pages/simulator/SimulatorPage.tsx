import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { calcWorkDaysCost } from '@/lib/calculations';
import { toast } from 'sonner';

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function SimulatorPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentMonth, currentYear } = useAppStore();

  const [salary, setSalary] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  const [biggestCategory, setBiggestCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Simulation values
  const [extraIncome, setExtraIncome] = useState(0);
  const [cutAmount, setCutAmount] = useState(0);
  const [goalAmountRaw, setGoalAmountRaw] = useState('');

  const goalAmount = parseFloat(goalAmountRaw.replace(/\D/g, '') || '0') / 100;

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: summary } = await supabase
      .from('monthly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('reference_month', currentMonth)
      .eq('reference_year', currentYear)
      .single();

    const { data: income } = await supabase
      .from('incomes')
      .select('salary, extra_income')
      .eq('user_id', user.id)
      .eq('reference_month', currentMonth)
      .eq('reference_year', currentYear)
      .single();

    if (summary) {
      setTotalIncome(summary.total_income as number);
      setTotalExpenses(summary.total_expenses as number);
      setBalance(summary.balance as number);
      setBiggestCategory(summary.biggest_category || '');
    }
    setSalary(income?.salary as number || 0);
    setLoading(false);

    // Track event
    await supabase.from('app_events').insert({
      user_id: user.id,
      event_type: 'simulator_used',
      metadata: {},
      platform: 'web',
    });
  }, [user, currentMonth, currentYear]);

  useEffect(() => { loadData(); }, [loadData]);

  // Derived simulation values
  const newBalanceIncome = balance + extraIncome;
  const incomePercent = totalIncome + extraIncome > 0 ? ((newBalanceIncome) / (totalIncome + extraIncome) * 100) : 0;
  const yearSavingsIncome = extraIncome * 12;

  const newBalanceCut = balance + cutAmount;
  const newExpensesCut = totalExpenses - cutAmount;
  const newWorkDays = calcWorkDaysCost(newExpensesCut > 0 ? newExpensesCut : 0, salary);

  const monthsToGoal = goalAmount > 0 && balance > 0 ? Math.ceil(goalAmount / balance) : 0;
  const monthlyCutNeeded = goalAmount > 0 ? goalAmount / 12 : 0;

  const maxCut = Math.floor(totalExpenses * 0.5);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="E se...?" />

      <div className="px-4 py-4 flex flex-col gap-6 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground text-center">
          Arrasta os sliders e veja o impacto em tempo real
        </p>

        {/* Section 1 — Extra income */}
        <Card className="rounded-2xl p-5 border-border">
          <p className="text-sm font-semibold text-foreground mb-4">E se eu ganhasse mais?</p>
          <Slider
            value={[extraIncome]}
            onValueChange={([v]) => setExtraIncome(v)}
            min={0}
            max={5000}
            step={100}
            className="mb-4"
          />
          <p className="text-xs text-muted-foreground mb-3">+{fmt(extraIncome)}/mês</p>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Novo saldo</span>
              <span className="text-sm font-bold" style={{ color: newBalanceIncome >= 0 ? '#1D9E75' : '#E24B4A' }}>
                {fmt(newBalanceIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Sobra da renda</span>
              <span className="text-sm font-semibold text-foreground">{incomePercent.toFixed(1)}%</span>
            </div>
            {extraIncome > 0 && (
              <p className="text-xs text-primary mt-1">
                Com {fmt(extraIncome)} a mais, você juntaria {fmt(yearSavingsIncome)}/ano
              </p>
            )}
          </div>
        </Card>

        {/* Section 2 — Cut expenses */}
        <Card className="rounded-2xl p-5 border-border">
          <p className="text-sm font-semibold text-foreground mb-4">E se eu cortasse gastos?</p>
          <Slider
            value={[cutAmount]}
            onValueChange={([v]) => setCutAmount(v)}
            min={0}
            max={maxCut > 0 ? maxCut : 1000}
            step={50}
            className="mb-4"
          />
          <p className="text-xs text-muted-foreground mb-3">-{fmt(cutAmount)}/mês</p>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Novo saldo</span>
              <span className="text-sm font-bold" style={{ color: newBalanceCut >= 0 ? '#1D9E75' : '#E24B4A' }}>
                {fmt(newBalanceCut)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Dias trabalhados</span>
              <span className="text-sm font-semibold text-foreground">{newWorkDays.toFixed(1)} dias</span>
            </div>
            {cutAmount > 0 && (
              <p className="text-xs text-primary mt-1">
                Cortando {fmt(cutAmount)}/mês, em 12 meses você teria {fmt(cutAmount * 12)}
              </p>
            )}
          </div>
        </Card>

        {/* Section 3 — Goal simulation */}
        <Card className="rounded-2xl p-5 border-border">
          <p className="text-sm font-semibold text-foreground mb-4">Simular meta específica</p>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={goalAmountRaw}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                const num = parseInt(digits || '0', 10) / 100;
                setGoalAmountRaw(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
              }}
              placeholder="Quero juntar..."
              className="w-full h-12 rounded-xl bg-card border border-border pl-10 pr-4 text-sm font-semibold text-foreground text-right focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </div>

          {goalAmount > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Cortar por mês</span>
                <span className="text-sm font-semibold text-foreground">{fmt(monthlyCutNeeded)}</span>
              </div>
              {biggestCategory && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Categoria para cortar</span>
                  <span className="text-sm font-semibold text-foreground">{biggestCategory}</span>
                </div>
              )}
              {monthsToGoal > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Meses para atingir</span>
                  <span className="text-sm font-semibold text-foreground">{monthsToGoal} meses</span>
                </div>
              )}
              <Button
                onClick={() => navigate('/goals', { state: { prefill: { target_amount: goalAmount } } })}
                variant="outline"
                className="w-full mt-2 rounded-xl text-sm"
              >
                Criar essa meta
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
