import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { StepDots } from './OnboardingWelcome';
import { toast } from 'sonner';

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  const num = parseInt(digits || '0', 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrencyInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  return parseInt(digits || '0', 10) / 100;
}

export default function OnboardingIncome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentMonth, currentYear } = useAppStore();

  const [salaryRaw, setSalaryRaw] = useState('');
  const [hasExtra, setHasExtra] = useState(false);
  const [extraRaw, setExtraRaw] = useState('');
  const [saving, setSaving] = useState(false);

  const salary = parseCurrencyInput(salaryRaw);
  const extra = parseCurrencyInput(extraRaw);
  const isValid = salary >= 100;

  const handleSave = async () => {
    if (!user || !isValid) return;
    setSaving(true);

    try {
      const { error } = await supabase.from('incomes').insert({
        user_id: user.id,
        salary,
        extra_income: hasExtra ? extra : 0,
        reference_month: currentMonth,
        reference_year: currentYear,
      });

      if (error) throw error;

      // Track event
      await supabase.from('app_events').insert({
        user_id: user.id,
        event_type: 'income_saved',
        metadata: {},
        platform: 'web',
      });

      navigate('/onboarding/expenses');
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        <h1 className="text-2xl font-extrabold text-foreground text-center">
          Quanto você ganha por mês?
        </h1>

        {/* Salary input */}
        <div className="w-full">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-semibold">
              R$
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={salaryRaw}
              onChange={(e) => setSalaryRaw(formatCurrencyInput(e.target.value))}
              placeholder="0,00"
              className="w-full h-16 rounded-2xl bg-card border border-border pl-12 pr-4 text-2xl font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </div>
          {salaryRaw && salary < 100 && (
            <p className="text-destructive text-xs mt-2 text-center">Mínimo de R$ 100,00</p>
          )}
        </div>

        {/* Extra income toggle */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="extra-toggle" className="text-sm text-foreground">
              Tenho renda extra
            </Label>
            <Switch id="extra-toggle" checked={hasExtra} onCheckedChange={setHasExtra} />
          </div>

          {hasExtra && (
            <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-semibold">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={extraRaw}
                onChange={(e) => setExtraRaw(formatCurrencyInput(e.target.value))}
                placeholder="0,00"
                className="w-full h-14 rounded-2xl bg-card border border-border pl-12 pr-4 text-xl font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
              />
            </div>
          )}
        </div>

        {/* Continue button */}
        <Button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          {saving ? 'Salvando...' : 'Continuar →'}
        </Button>

        <StepDots current={2} />
      </div>
    </div>
  );
}
