import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DollarSign, List, BarChart3 } from 'lucide-react';

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map((step) => (
        <div
          key={step}
          className={`h-2 rounded-full transition-all ${
            step === current ? 'w-6 bg-primary' : 'w-2 bg-muted'
          }`}
        />
      ))}
    </div>
  );
}

export { StepDots };

export default function OnboardingWelcome() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-10 w-full max-w-sm">
        {/* Title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-2xl font-extrabold text-foreground leading-tight">
            Vamos descobrir quanto custa sua vida?
          </h1>
          <p className="text-muted-foreground text-sm">
            Responde 2 perguntas rápidas. Prometo que vai ser um choque.
          </p>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
              <DollarSign className="h-7 w-7 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Renda</span>
          </div>
          <div className="h-px w-6 bg-muted" />
          <div className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
              <List className="h-7 w-7 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Gastos</span>
          </div>
          <div className="h-px w-6 bg-muted" />
          <div className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Resultado</span>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={() => navigate('/onboarding/income')}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          Bora lá →
        </Button>

        {/* Step indicator */}
        <StepDots current={1} />
      </div>
    </div>
  );
}
