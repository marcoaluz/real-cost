import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, X, Globe, Smartphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function AdminUsers() {
  const { user: admin } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    supabase.from('admin_users_overview').select('*').order('joined_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, []);

  const loadNotes = async (userId: string) => {
    const { data } = await supabase
      .from('admin_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setNotes(data || []);
  };

  const openUser = (u: any) => {
    setSelectedUser(u);
    loadNotes(u.user_id);
    setNewNote('');
  };

  const saveNote = async () => {
    if (!admin || !selectedUser || !newNote.trim()) return;
    setSavingNote(true);
    await supabase.from('admin_notes').insert({
      user_id: selectedUser.user_id,
      admin_id: admin.id,
      note: newNote.trim(),
    });
    setNewNote('');
    await loadNotes(selectedUser.user_id);
    setSavingNote(false);
    toast.success('Nota salva');
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search || (u.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-foreground">Usuários</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome..." className="pl-9 rounded-xl bg-card" />
        </div>
        <div className="flex gap-2">
          {['all', 'free', 'pro'].map((p) => (
            <Button key={p} size="sm" variant={planFilter === p ? 'default' : 'outline'}
              onClick={() => setPlanFilter(p)} className="rounded-xl text-xs capitalize">
              {p === 'all' ? 'Todos' : p === 'free' ? 'Free' : 'Premium'}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs">
                <th className="text-left py-2 px-2">Usuário</th>
                <th className="text-left py-2 px-2">Plano</th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Plataforma</th>
                <th className="text-left py-2 px-2 hidden md:table-cell">Último acesso</th>
                <th className="text-right py-2 px-2">Gastos</th>
                <th className="text-right py-2 px-2 hidden sm:table-cell">Shares</th>
                <th className="text-right py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.user_id} className="border-b border-border hover:bg-muted/20">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {(u.full_name || '?')[0]?.toUpperCase()}
                      </div>
                      <span className="text-foreground font-medium truncate max-w-[120px]">{u.full_name || 'Sem nome'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={u.plan === 'pro' ? 'default' : 'secondary'} className="text-[10px]">
                      {u.plan === 'pro' ? 'PREMIUM' : 'FREE'}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 hidden sm:table-cell">
                    {u.platform === 'android' || u.platform === 'ios' ? <Smartphone size={14} className="text-muted-foreground" /> : <Globe size={14} className="text-muted-foreground" />}
                  </td>
                  <td className="py-3 px-2 hidden md:table-cell text-xs text-muted-foreground">
                    {u.last_active ? formatDistanceToNow(new Date(u.last_active), { locale: ptBR, addSuffix: true }) : '—'}
                  </td>
                  <td className="py-3 px-2 text-right text-foreground">{u.total_expenses}</td>
                  <td className="py-3 px-2 text-right text-foreground hidden sm:table-cell">{u.total_shares}</td>
                  <td className="py-3 px-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => openUser(u)} className="text-xs text-primary">Ver</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nenhum usuário encontrado.</p>}
        </div>
      )}

      {/* User detail modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">{selectedUser.full_name || 'Sem nome'}</h2>
              <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Plano: <span className="text-foreground font-medium">{selectedUser.plan}</span></p>
              <p>Desde: <span className="text-foreground font-medium">{selectedUser.joined_at ? new Date(selectedUser.joined_at).toLocaleDateString('pt-BR') : '—'}</span></p>
              <p>Gastos: <span className="text-foreground font-medium">{selectedUser.total_expenses}</span></p>
              <p>Shares: <span className="text-foreground font-medium">{selectedUser.total_shares}</span></p>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Anotações</h3>
              <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Escreva uma nota..." className="rounded-xl bg-background mb-2" />
              <Button onClick={saveNote} disabled={savingNote || !newNote.trim()} size="sm" className="rounded-xl">
                {savingNote ? 'Salvando...' : 'Salvar nota'}
              </Button>
              <div className="mt-4 flex flex-col gap-2">
                {notes.map((n: any) => (
                  <div key={n.id} className="rounded-xl bg-background p-3 border border-border">
                    <p className="text-sm text-foreground">{n.note}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { locale: ptBR, addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
