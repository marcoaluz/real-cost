// AUTH TEMPORARIAMENTE DESATIVADA - libera acesso a todas as rotas
export function PrivateRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
