import { Header } from '@/components/layout/Header';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title={title} showBack />
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Em construção...</p>
      </div>
    </div>
  );
}
