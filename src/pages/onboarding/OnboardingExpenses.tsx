import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { StepDots } from './OnboardingWelcome';
import { calcBalance, calcWorkDaysCost, calcBiggestCategory } from '@/lib/calculations';
import { toast } from 'sonner';
import type { Expense } from '@/types';

const CATEGORIES = [
  { key: 'moradia', label: 'Moradia', emoji: '🏠', hint: 'aluguel, financiamento' },
  { key: 'alimentacao', label: 'Alimentação', emoji: '🛒', hint: 'mercado, refeições' },
  { key: 'transporte', label: 'Transporte', emoji: '🚗', hint: 'combustível, Uber, ônibus' },
  { key: 'lazer', label: 'Lazer', emoji: '🎮', hint: 'streaming, saídas, delivery' },
  { key: 'dividas', label: 'Dívidas', emoji: '💳', hint: 'cartão, empréstimo' },
  { key: 'outros', label: 'Outros', emoji: '➕', hint: '' },
];

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  const num = parseInt(digits || '0', 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrencyInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  return parseInt(digits || '0', 10) / 100;
}

export default function OnboardingExpenses() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentMonth, currentYear } = useAppStore();

  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, raw: string) => {
    setValues((prev) => ({ ...prev, [key]: formatCurrencyInput(raw) }));
  };

  const filledCategories = CATEGORIES.filter(
    (c) => parseCurrencyInput(values[c.key] || '') > 0
  );
  const isValid = filledCategories.length >= 1;

  const handleSave = async () => {
    if (!user || !isValid) return;
    setSaving(true);

    try {
      // Build expense rows
      const expenseRows = filledCategories.map((c) => ({
        user_id: user.id,
        category: c.label,
        description: c.label,
        amount: parseCurrencyInput(values[c.key] || ''),
        reference_month: currentMonth,
        reference_year: currentYear,
      }));

      const { error: expError } = await supabase.from('expenses').insert(expenseRows);
      if (expError) throw expError;

      // Get income for summary
      const { data: income } = await supabase
        .from('incomes')
        .select('salary, extra_income')
        .eq('user_id', user.id)
        .eq('reference_month', currentMonth)
        .eq('reference_year', currentYear)
        .single();

      const totalIncome = (income?.salary || 0) + (income?.extra_income || 0);
      const totalExpenses = expenseRows.reduce((sum, e) => sum + e.amount, 0);
      const balance = calcBalance(totalIncome, totalExpenses);
      const workDaysCost = calcWorkDaysCost(totalExpenses, income?.salary || 0);

      const expenses: Expense[] = expenseRows.map((e, i) => ({
        id: String(i),
        ...e,
      }));
      const biggestCategory = calcBiggestCategory(expenses);

      // Save monthly summary
      await supabase.from('monthly_summaries').insert({
        user_id: user.id,
        reference_month: currentMonth,
        reference_year: currentYear,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        balance,
        work_days_cost: workDaysCost,
        biggest_category: biggestCategory,
      });

      // Track event
      await supabase.from('app_events').insert({
        user_id: user.id,
        event_type: 'expense_created',
        metadata: { source: 'onboarding' },
        platform: 'web',
      });

      navigate('/result', { replace: true });
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-12">
      <div className="flex flex-col gap-8 w-full max-w-sm mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-foreground">Agora seus gastos fixos</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Só os principais. Pode mudar depois.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-4">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[130px]">
                <span className="text-lg">{cat.emoji}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{cat.label}</span>
                  {cat.hint && (
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {cat.hint}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={values[cat.key] || ''}
                  onChange={(e) => handleChange(cat.key, e.target.value)}
                  placeholder="0,00"
                  className="w-full h-11 rounded-xl bg-card border border-border pl-10 pr-3 text-sm font-semibold text-foreground text-right focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          {saving ? 'Calculando...' : 'Ver meu resultado →'}
        </Button>

        <div className="flex justify-center">
          <StepDots current={3} />
        </div>
      </div>
    </div>
  );
}
