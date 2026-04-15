import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Plus, Target } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Goal } from '@/types';

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  const num = parseInt(digits || '0', 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrencyInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  return parseInt(digits || '0', 10) / 100;
}

export default function GoalsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const prefill = (location.state as any)?.prefill;
  const [desc, setDesc] = useState('');
  const [targetRaw, setTargetRaw] = useState(
    prefill?.target_amount ? formatCurrencyInput(String(Math.round(prefill.target_amount * 100))) : ''
  );
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setGoals((data as Goal[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  useEffect(() => {
    if (prefill) setShowForm(true);
  }, [prefill]);

  const handleCreate = async () => {
    if (!user) return;
    const targetAmount = parseCurrencyInput(targetRaw);
    if (!desc || targetAmount <= 0) { toast.error('Preencha descrição e valor'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        description: desc,
        target_amount: targetAmount,
        current_amount: 0,
        deadline: deadline || null,
        is_completed: false,
      });
      if (error) throw error;

      await supabase.from('app_events').insert({
        user_id: user.id,
        event_type: 'goal_created',
        metadata: {},
        platform: 'web',
      });

      toast.success('Meta criada!');
      setDesc('');
      setTargetRaw('');
      setDeadline('');
      setShowForm(false);
      loadGoals();
    } catch {
      toast.error('Erro ao criar meta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header
        title="Suas metas"
        rightAction={
          <button onClick={() => setShowForm(true)} className="text-primary hover:text-primary/80">
            <Plus size={22} />
          </button>
        }
      />

      <div className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto">
        {/* New goal form */}
        {showForm && (
          <Card className="rounded-2xl p-5 border-primary/30 bg-card">
            <p className="text-sm font-semibold text-foreground mb-3">Nova meta</p>
            <div className="flex flex-col gap-3">
              <Input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="ex: Fundo de emergência"
                className="rounded-xl bg-background"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={targetRaw}
                  onChange={(e) => setTargetRaw(formatCurrencyInput(e.target.value))}
                  placeholder="0,00"
                  className="w-full h-11 rounded-xl bg-background border border-border pl-10 pr-4 text-sm font-semibold text-foreground text-right focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
                />
              </div>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-xl bg-background"
                placeholder="Data limite (opcional)"
              />
              <div className="flex gap-2">
                <Button onClick={() => setShowForm(false)} variant="ghost" className="flex-1 rounded-xl" size="sm">
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={saving} className="flex-1 rounded-xl" size="sm">
                  {saving ? 'Salvando...' : 'Criar meta'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : goals.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Target className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm text-center">
              Você ainda não tem metas.<br />Que tal começar pelo simulador?
            </p>
            <Button onClick={() => navigate('/simulator')} className="rounded-2xl" size="sm">
              Ir ao simulador
            </Button>
          </div>
        ) : (
          goals.map((goal) => {
            const percent = goal.target_amount > 0
              ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
              : 0;
            const remaining = goal.target_amount - goal.current_amount;

            return (
              <Card key={goal.id} className="rounded-2xl p-4 border-border">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-semibold text-foreground">{goal.description}</p>
                  <span className="text-xs font-bold text-primary">{percent}%</span>
                </div>
                <Progress value={percent} className="h-2 mb-2" />
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    Faltam {fmt(remaining > 0 ? remaining : 0)}
                  </span>
                  {goal.deadline && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(goal.deadline), { locale: ptBR, addSuffix: true })}
                    </span>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
