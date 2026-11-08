import { useEffect, useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from '@/hooks/useAdminRole';
import { formatBRL } from '@/lib/formatBRL';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { ArrowLeft, CheckCircle2, Loader2, Pencil, Search } from 'lucide-react';
import { PLAN_PRICES, daysUntil, effectivePrice, nextDueDate, paymentStatus } from '@/lib/billing';

interface Profile { user_id: string; display_name: string | null; email: string | null; plan: string | null; plan_status: string | null; created_at: string; }
interface Billing { user_id: string; last_paid_at: string | null; next_due_at: string | null; custom_price: number | null; custom_checkout_url: string | null; notes: string | null; }

const planName: Record<string, string> = { starter: 'Premium', profissional: 'Avançado', enterprise: 'Monster' };
const brl = formatBRL;

export default function AdminBilling() {
  const { isAdmin, isLoading } = useAdminRole();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [billing, setBilling] = useState<Record<string, Billing>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState({ mode: 'none' as 'none' | 'price' | 'discount', price: '', discount: '', dueDate: '', url: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: b }] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, email, plan, plan_status, created_at').neq('plan', 'free').not('plan', 'is', null),
      supabase.from('subscription_billing').select('*'),
    ]);
    setProfiles((p || []) as Profile[]);
    setBilling(Object.fromEntries(((b || []) as Billing[]).map(r => [r.user_id, r])));
    setLoading(false);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const rows = useMemo(() => profiles
    .filter(p => !q || p.email?.toLowerCase().includes(q.toLowerCase()) || p.display_name?.toLowerCase().includes(q.toLowerCase()))
    .map(p => {
      const b = billing[p.user_id];
      const due = nextDueDate({ nextDueAt: b?.next_due_at, lastPaidAt: b?.last_paid_at, createdAt: p.created_at });
      return { p, b, due, days: daysUntil(due), price: effectivePrice(p.plan, b?.custom_price) };
    })
    .sort((a, b) => a.days - b.days), [profiles, billing, q]);

  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const openEdit = (p: Profile) => {
    const b = billing[p.user_id];
    const due = nextDueDate({ nextDueAt: b?.next_due_at, lastPaidAt: b?.last_paid_at, createdAt: p.created_at });
    setForm({ mode: b?.custom_price != null ? 'price' : 'none', price: b?.custom_price != null ? String(b.custom_price).replace('.', ',') : '', discount: '', dueDate: format(due, 'yyyy-MM-dd'), url: b?.custom_checkout_url || '', notes: b?.notes || '' });
    setEditing(p);
  };

  const setPaid = async (p: Profile, due: Date, days: number, paid: boolean) => {
    const nextDue = new Date(due);
    if (paid && days < 0) nextDue.setMonth(nextDue.getMonth() + 1);
    const { error } = await supabase.from('subscription_billing').upsert({
      user_id: p.user_id,
      last_paid_at: paid ? new Date().toISOString() : null,
      next_due_at: nextDue.toISOString(),
    });
    if (error) { toast.error('Erro ao salvar: ' + error.message); return; }
    toast.success(paid ? 'Marcado como pago' : 'Marcado como pendente');
    load();
  };

  const base = editing?.plan ? PLAN_PRICES[editing.plan] ?? 0 : 0;
  const parse = (s: string) => Number(s.replace(',', '.'));
  const computed = form.mode === 'price' ? parse(form.price) : form.mode === 'discount' ? Math.max(0, +(base * (1 - parse(form.discount) / 100)).toFixed(2)) : null;

  const save = async () => {
    if (!editing) return;
    if (computed !== null && (!Number.isFinite(computed) || computed < 0)) { toast.error('Valor inválido'); return; }
    setSaving(true);
    const { error } = await supabase.from('subscription_billing').upsert({
      user_id: editing.user_id,
      custom_price: computed,
      next_due_at: form.dueDate ? new Date(form.dueDate + 'T12:00:00').toISOString() : null,
      custom_checkout_url: form.url.trim() || null,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error('Erro ao salvar: ' + error.message); return; }
    toast.success('Cobrança atualizada');
    setEditing(null);
    load();
  };

  return (
    <MainLayout title="Mensalidades">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild><Link to="/admin"><ArrowLeft className="w-4 h-4 mr-1" />Área Admin</Link></Button>
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nome ou email" value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          {loading ? <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Usuário</TableHead><TableHead>Plano</TableHead><TableHead>Próxima mensalidade</TableHead>
                <TableHead>Faltam</TableHead><TableHead>Status</TableHead><TableHead>Valor</TableHead><TableHead className="text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum assinante encontrado</TableCell></TableRow>}
                {rows.map(({ p, b, due, days, price }) => (
                  <TableRow key={p.user_id}>
                    <TableCell><div className="font-medium">{p.display_name || '—'}</div><div className="text-xs text-muted-foreground">{p.email}</div></TableCell>
                    <TableCell>{planName[p.plan || ''] || p.plan}</TableCell>
                    <TableCell>{format(due, 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <Badge className="whitespace-nowrap" variant={days < 0 ? 'destructive' : days <= 5 ? 'secondary' : 'outline'}>
                        {days < 0 ? `Atrasado ${-days} dia(s)` : days === 0 ? 'Vence hoje' : `${days} dia(s)`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {paymentStatus(b?.last_paid_at, days) === 'pago'
                        ? <Badge className="border-0 bg-success/20 text-success hover:bg-success/20">Pago</Badge>
                        : <Badge className="border-0 bg-destructive/20 text-destructive hover:bg-destructive/20">Pendente</Badge>}
                    </TableCell>
                    <TableCell>
                      {price !== null ? brl(price) : '—'}
                      {b?.custom_price != null && <Badge className="ml-2" variant="secondary">Personalizado</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      {paymentStatus(b?.last_paid_at, days) === 'pago'
                        ? <Button size="sm" variant="outline" onClick={() => setPaid(p, due, days, false)}>Marcar pendente</Button>
                        : <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => setPaid(p, due, days, true)}><CheckCircle2 className="w-4 h-4 mr-1" />Marcar como pago</Button>}
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="w-4 h-4 mr-1" />Editar</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mensalidade de {editing?.display_name || editing?.email}</DialogTitle>
            <DialogDescription>Plano {planName[editing?.plan || ''] || editing?.plan} — preço normal {brl(base)}. O plano continua o mesmo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              {([['none', 'Preço normal'], ['discount', 'Desconto %'], ['price', 'Preço fixo']] as const).map(([m, l]) => (
                <Button key={m} type="button" size="sm" variant={form.mode === m ? 'default' : 'outline'} onClick={() => setForm(f => ({ ...f, mode: m }))}>{l}</Button>
              ))}
            </div>
            {form.mode === 'discount' && <div><Label>Desconto (%)</Label><Input inputMode="decimal" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="Ex: 50" /></div>}
            {form.mode === 'price' && <div><Label>Valor mensal (R$)</Label><Input inputMode="decimal" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Ex: 27,90" /></div>}
            <p className="text-sm">Vai pagar: <strong>{brl(computed !== null && Number.isFinite(computed) ? computed : base)}</strong>/mês</p>
            <div><Label>Data da próxima mensalidade</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            <div>
              <Label>Link de pagamento com esse valor (opcional)</Label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://adsroi.com.br/checkout/..." />
              <p className="text-xs text-muted-foreground mt-1">O usuário verá esse valor e esse link na tela de Assinatura.</p>
            </div>
            <div><Label>Observação</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
