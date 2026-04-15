import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  novo: '#378ADD',
  pending: '#378ADD',
  em_analise: '#EF9F27',
  reviewed: '#EF9F27',
  implemented: '#1D9E75',
  recusado: '#E24B4A',
};

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  pending: 'Novo',
  em_analise: 'Em análise',
  reviewed: 'Em análise',
  implemented: 'Implementado',
  recusado: 'Recusado',
};

const STATUS_OPTIONS = ['novo', 'em_analise', 'implemented', 'recusado'];
const CATEGORY_OPTIONS = ['Feature', 'Bug', 'Design', 'Outro'];

export default function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_suggestions_ranked').select('*');
    setSuggestions(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openSuggestion = (s: any) => {
    setSelected(s);
    setReplyText(s.admin_reply || '');
    setReplyStatus(s.status);
  };

  const saveReply = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from('suggestions').update({
      status: replyStatus,
      admin_reply: replyText || null,
      replied_at: new Date().toISOString(),
    }).eq('id', selected.id);

    if (error) { toast.error('Erro ao salvar'); }
    else { toast.success('Resposta salva'); setSelected(null); load(); }
    setSaving(false);
  };

  const filtered = suggestions.filter((s) => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter || (statusFilter === 'novo' && s.status === 'pending');
    const matchCat = catFilter === 'all' || s.category?.toLowerCase() === catFilter.toLowerCase();
    return matchStatus && matchCat;
  });

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-foreground">Sugestões</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', ...STATUS_OPTIONS].map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)} className="rounded-xl text-xs">
            {s === 'all' ? 'Todos' : STATUS_LABELS[s] || s}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {['all', ...CATEGORY_OPTIONS].map((c) => (
          <Button key={c} size="sm" variant={catFilter === c ? 'default' : 'outline'} onClick={() => setCatFilter(c)} className="rounded-xl text-xs">
            {c === 'all' ? 'Todas' : c}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((s) => (
            <Card key={s.id} className="rounded-2xl p-4 border-border cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openSuggestion(s)}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm text-foreground flex-1">{s.message}</p>
                <span className="text-xs font-bold shrink-0" style={{ color: STATUS_COLORS[s.status] || '#888' }}>
                  ▲ {s.upvotes}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">{s.category || 'geral'}</Badge>
                <Badge className="text-[10px]" style={{ backgroundColor: STATUS_COLORS[s.status] || '#888', color: '#fff' }}>
                  {STATUS_LABELS[s.status] || s.status}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{s.author_name || 'Anônimo'}</span>
                <span className="text-[10px] text-muted-foreground">
                  {s.created_at ? formatDistanceToNow(new Date(s.created_at), { locale: ptBR, addSuffix: true }) : ''}
                </span>
              </div>
              {s.admin_reply && (
                <div className="mt-2 p-2 rounded-lg bg-primary/10 border-l-2 border-primary">
                  <p className="text-xs text-foreground">{s.admin_reply}</p>
                </div>
              )}
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nenhuma sugestão encontrada.</p>}
        </div>
      )}

      {/* Reply panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-foreground">Responder sugestão</h3>
            <p className="text-sm text-muted-foreground">{selected.message}</p>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((s) => (
                  <Button key={s} size="sm" variant={replyStatus === s ? 'default' : 'outline'} onClick={() => setReplyStatus(s)} className="rounded-xl text-xs">
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>

            <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Escreva uma resposta..." className="rounded-xl bg-background" />

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setSelected(null)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={saveReply} disabled={saving} className="flex-1 rounded-xl">
                {saving ? 'Salvando...' : 'Salvar resposta'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
