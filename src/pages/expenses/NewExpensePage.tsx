import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { calcBalance, calcWorkDaysCost, calcBiggestCategory } from '@/lib/calculations';
import { toast } from 'sonner';
import type { Expense } from '@/types';

const CATEGORIES = [
  { key: 'Moradia', emoji: '🏠' },
  { key: 'Alimentação', emoji: '🛒' },
  { key: 'Transporte', emoji: '🚗' },
  { key: 'Lazer', emoji: '🎮' },
  { key: 'Dívidas', emoji: '💳' },
  { key: 'Saúde', emoji: '🏥' },
  { key: 'Educação', emoji: '📚' },
  { key: 'Outros', emoji: '➕' },
];

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  const num = parseInt(digits || '0', 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrencyInput(digits: string): number {
  return parseInt(digits || '0', 10) / 100;
}

export default function NewExpensePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentMonth, currentYear } = useAppStore();

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [saving, setSaving] = useState(false);

  const amount = parseCurrencyInput(amountRaw);
  const isValid = category && amount > 0;

  const handleSave = async () => {
    if (!user || !isValid) return;
    setSaving(true);

    try {
      // Insert expense
      const { error } = await supabase.from('expenses').insert({
        user_id: user.id,
        category,
        description: description || category,
        amount,
        reference_month: currentMonth,
        reference_year: currentYear,
      });
      if (error) throw error;

      // Recalculate summary
      const { data: allExpenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('reference_month', currentMonth)
        .eq('reference_year', currentYear);

      const { data: income } = await supabase
        .from('incomes')
        .select('salary, extra_income')
        .eq('user_id', user.id)
        .eq('reference_month', currentMonth)
        .eq('reference_year', currentYear)
        .single();

      const expList = (allExpenses || []) as Expense[];
      const totalIncome = (income?.salary || 0) + (income?.extra_income || 0);
      const totalExpenses = expList.reduce((s, e) => s + e.amount, 0);

      const summaryData = {
        user_id: user.id,
        reference_month: currentMonth,
        reference_year: currentYear,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        balance: calcBalance(totalIncome, totalExpenses),
        work_days_cost: calcWorkDaysCost(totalExpenses, income?.salary || 0),
        biggest_category: calcBiggestCategory(expList),
      };

      // Upsert summary
      const { data: existing } = await supabase
        .from('monthly_summaries')
        .select('id')
        .eq('user_id', user.id)
        .eq('reference_month', currentMonth)
        .eq('reference_year', currentYear)
        .single();

      if (existing) {
        await supabase.from('monthly_summaries').update(summaryData).eq('id', existing.id);
      } else {
        await supabase.from('monthly_summaries').insert(summaryData);
      }

      // Track event
      await supabase.from('app_events').insert({
        user_id: user.id,
        event_type: 'expense_created',
        metadata: {},
        platform: 'web',
      });

      toast.success('Gasto salvo!');
      navigate('/expenses', { replace: true });
    } catch {
      toast.error('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Novo Gasto" showBack />

      <div className="px-4 py-4 flex flex-col gap-6 max-w-lg mx-auto">
        {/* Category selector */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">Categoria</p>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                  category === cat.key
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{cat.key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="relative z-10">
          <p className="text-sm font-medium text-foreground mb-2">Descrição</p>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ex: Aluguel"
            autoComplete="off"
            className="rounded-xl bg-card relative z-10"
          />
        </div>

        {/* Amount */}
        <div className="relative z-10">
          <p className="text-sm font-medium text-foreground mb-2">Valor</p>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-semibold z-10">R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={amountRaw ? formatCurrencyInput(amountRaw) : ''}
              onChange={(e) => setAmountRaw(e.target.value.replace(/\D/g, ''))}
              placeholder="0,00"
              autoComplete="off"
              className="relative w-full h-16 rounded-2xl bg-card border border-border pl-12 pr-4 text-2xl font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          {saving ? 'Salvando...' : 'Salvar gasto'}
        </Button>
      </div>
    </div>
  );
}
