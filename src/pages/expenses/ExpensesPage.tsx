import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Expense } from '@/types';

const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  Moradia: { emoji: '🏠', color: '#378ADD' },
  Alimentação: { emoji: '🛒', color: '#1D9E75' },
  Transporte: { emoji: '🚗', color: '#EF9F27' },
  Lazer: { emoji: '🎮', color: '#D4537E' },
  Dívidas: { emoji: '💳', color: '#E24B4A' },
  Saúde: { emoji: '🏥', color: '#5DCAA5' },
  Educação: { emoji: '📚', color: '#7F77DD' },
  Outros: { emoji: '➕', color: '#888780' },
};

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ExpensesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [refDate, setRefDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const month = refDate.getMonth() + 1;
  const year = refDate.getFullYear();

  const loadExpenses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('reference_month', month)
      .eq('reference_year', year)
      .order('created_at', { ascending: false });
    setExpenses((data as Expense[]) || []);
    setLoading(false);
  }, [user, month, year]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) { toast.error('Erro ao deletar'); return; }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast.success('Gasto removido');
  };

  // Group by category
  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    acc[e.category] = acc[e.category] || [];
    acc[e.category].push(e);
    return acc;
  }, {});

  const monthLabel = format(refDate, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header
        title="Seus gastos"
        rightAction={
          <div className="flex items-center gap-2">
            <button onClick={() => setRefDate(subMonths(refDate, 1))} className="p-1 text-muted-foreground hover:text-foreground">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium text-foreground capitalize min-w-[140px] text-center">{monthLabel}</span>
            <button onClick={() => setRefDate(addMonths(refDate, 1))} className="p-1 text-muted-foreground hover:text-foreground">
              <ChevronRight size={20} />
            </button>
          </div>
        }
      />

      <div className="px-4 py-2 flex flex-col gap-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Nenhum gasto neste mês.</p>
            <Button onClick={() => navigate('/expenses/new')} className="mt-4 rounded-2xl" size="sm">
              Adicionar gasto
            </Button>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => {
            const meta = CATEGORY_META[category] || CATEGORY_META.Outros;
            const total = items.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={category} className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <span className="text-sm font-semibold text-foreground">{category}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: meta.color }}>{fmt(total)}</span>
                </div>
                {items.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
                    <div>
                      <p className="text-sm text-foreground">{expense.description || category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">{fmt(expense.amount)}</span>
                      <button onClick={() => handleDelete(expense.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/expenses/new')}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-50"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
