import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Sale } from '@/hooks/useSales';

interface Props {
  campaigns: { id: string; name: string }[];
  initialCampaignId?: string;
  startDate: Date;
  endDate: Date;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function AssignSaleDialog({ campaigns, initialCampaignId, startDate, endDate, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [campaignId, setCampaignId] = useState(initialCampaignId ?? '');
  const [saleId, setSaleId] = useState('');
  const [search, setSearch] = useState('');
  const [sales, setSales] = useState<Sale[]>([]);
  const [overrides, setOverrides] = useState(new Map<string, string>());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(50);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const rows: Sale[] = [];
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabase.from('sales').select('*')
            .eq('user_id', user.id).gt('amount', 0)
            .gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false }).order('id').range(offset, offset + 999);
          if (error) throw error;
          rows.push(...(data ?? []));
          if (cancelled || !data || data.length < 1000) break;
        }
        const assignments = new Map<string, string>();
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabase.from('manual_sale_attributions')
            .select('sale_id, campaign_name').eq('user_id', user.id).order('sale_id').range(offset, offset + 999);
          if (error) throw error;
          for (const row of data ?? []) assignments.set(row.sale_id, row.campaign_name);
          if (cancelled || !data || data.length < 1000) break;
        }
        if (!cancelled) { setSales(rows); setOverrides(assignments); }
      } catch {
        if (!cancelled) setError('Não foi possível carregar as vendas.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [user?.id, startDate, endDate, reload]);

  const filtered = sales.filter(s => [s.customer_name, s.customer_email, s.product_name, s.transaction_id]
    .some(v => v?.toLowerCase().includes(search.toLowerCase())));
  const selectedSale = sales.find(s => s.id === saleId);
  const campaign = campaigns.find(c => c.id === campaignId);

  async function save(remove = false) {
    if (!user || !selectedSale || (!remove && !campaign)) return;
    setSaving(true);
    try {
      const result = remove
        ? await supabase.from('manual_sale_attributions').delete().eq('sale_id', saleId).eq('user_id', user.id).select('sale_id')
        : await supabase.from('manual_sale_attributions').upsert({ sale_id: saleId, user_id: user.id,
            campaign_id: campaignId, campaign_name: campaign?.name ?? '', updated_at: new Date().toISOString() }).select('sale_id');
      if (result.error || !result.data?.length) throw result.error ?? new Error('Not saved');
      await onSaved();
      toast.success(remove ? 'Atribuição manual removida' : 'Venda atribuída à campanha');
      onClose();
    } catch {
      toast.error('Não foi possível salvar a atribuição. Tente novamente.');
    } finally { setSaving(false); }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader><DialogTitle>Atribuir venda à campanha</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="assignment-campaign">Campanha</Label>
          <Select value={campaignId} onValueChange={setCampaignId} disabled={saving}>
            <SelectTrigger id="assignment-campaign" className="w-full [&>span]:truncate"><SelectValue placeholder="Selecionar campanha" /></SelectTrigger>
            <SelectContent>{campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignment-search">Venda — {startDate.toLocaleDateString('pt-BR')} a {endDate.toLocaleDateString('pt-BR')}</Label>
          <div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input id="assignment-search" className="pl-9" placeholder="Buscar cliente, e-mail, produto ou transação" value={search} onChange={e => { setSearch(e.target.value); setLimit(50); }} />
          </div>
        </div>
        <div className="overflow-y-auto min-h-0 border border-border rounded-md divide-y divide-border" role="radiogroup" aria-label="Selecionar venda">
          {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-5 h-5" /></div>
            : error ? <div className="p-6 text-center space-y-2"><p>{error}</p><Button variant="outline" onClick={() => setReload(v => v + 1)}>Tentar novamente</Button></div>
            : !filtered.length ? <p className="p-6 text-center text-muted-foreground">Nenhuma venda encontrada neste período.</p>
            : filtered.slice(0, limit).map(s => (
              <label key={s.id} className="flex gap-3 p-3 cursor-pointer hover:bg-muted/50 items-start">
                <input type="radio" name="assignment-sale" value={s.id} checked={saleId === s.id} onChange={() => setSaleId(s.id)} disabled={saving} className="mt-1 shrink-0 accent-primary" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-medium break-words">{s.customer_name || s.customer_email || 'Cliente sem nome'}</div>
                  <div className="text-xs text-muted-foreground break-words">{s.product_name || 'Produto sem nome'} · {new Date(s.created_at).toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-muted-foreground break-all">{s.transaction_id || s.id}</div>
                  {overrides.has(s.id) && <Badge variant="secondary" className="max-w-full whitespace-normal break-words">Manual: {overrides.get(s.id)}</Badge>}
                </div>
                <div className="text-right shrink-0 text-sm"><div>{Number(s.amount).toLocaleString('pt-BR', { style: 'currency', currency: s.currency || 'BRL' })}</div>
                  <span className="text-xs text-muted-foreground">{{ approved: 'Aprovada', paid: 'Paga', pending: 'Pendente', refunded: 'Reembolsada', cancelled: 'Cancelada', declined: 'Recusada', chargedback: 'Chargeback' }[s.status] ?? s.status}</span>
                </div>
              </label>
            ))}
          {!loading && filtered.length > limit && <Button variant="ghost" className="w-full" onClick={() => setLimit(v => v + 50)}>Mostrar mais vendas</Button>}
        </div>
        <DialogFooter className="gap-2">
          {overrides.has(saleId) && <Button variant="outline" disabled={saving} onClick={() => save(true)}><Undo2 className="w-4 h-4 mr-2" />Remover atribuição</Button>}
          <Button variant="outline" disabled={saving} onClick={onClose}>Cancelar</Button>
          <Button disabled={loading || saving || !selectedSale || !campaign} onClick={() => save()}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Atribuir venda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}