interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Carregando...' }: LoadingScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6 px-6">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center">
          <span className="text-xl font-bold text-primary-foreground">$</span>
        </div>
        <h1 className="text-xl font-extrabold text-foreground">Meu Custo Real</h1>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
