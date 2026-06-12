import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Loader2, Save } from 'lucide-react';
import { useWebhooks } from '@/hooks/useWebhooks';
import { usePlatformFees, normalizePlatform } from '@/hooks/usePlatformFees';

export function PlatformFeesCard() {
  const { webhooks, loading: whLoading } = useWebhooks();
  const { feeMap, loading: feesLoading, upsertFee } = usePlatformFees();

  const platforms = useMemo(() => {
    const set = new Set<string>();
    webhooks.forEach(w => set.add(normalizePlatform(w.platform)));
    // Include any existing fee platforms (in case webhook removed)
    feeMap.forEach((_, k) => set.add(k));
    return Array.from(set).filter(Boolean).sort();
  }, [webhooks, feeMap]);

  const [draft, setDraft] = useState<Record<string, { sale: string; withdrawal: string; orderbump: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    setDraft(prev => {
      const next = { ...prev };
      platforms.forEach(p => {
        if (!next[p]) {
          const f = feeMap.get(p);
          next[p] = {
            sale: f ? String(f.fee_per_sale) : '0',
            withdrawal: f ? String(f.fee_per_withdrawal) : '0',
            orderbump: f ? String(f.fee_per_orderbump) : '0',
          };
        }
      });
      return next;
    });
  }, [platforms, feeMap]);

  const handleSave = async (p: string) => {
    setSavingId(p);
    const d = draft[p] || { sale: '0', withdrawal: '0', orderbump: '0' };
    await upsertFee(p, parseFloat(d.sale) || 0, parseFloat(d.withdrawal) || 0, parseFloat(d.orderbump) || 0);
    setSavingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Taxas das Plataformas</CardTitle>
          <DollarSign className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure as taxas cobradas por cada plataforma de venda. O Faturamento exibido será descontado da Taxa por Venda.
        </p>

        {(whLoading || feesLoading) ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : platforms.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Crie um webhook para que a plataforma apareça aqui.
          </p>
        ) : (
          <div className="space-y-3">
            {platforms.map(p => {
              const d = draft[p] || { sale: '0', withdrawal: '0', orderbump: '0' };
              return (
                <div key={p} className="p-3 bg-muted/30 rounded-lg space-y-3">
                  <Badge variant="outline" className="capitalize">{p}</Badge>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Taxa por Venda (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={d.sale}
                        onChange={e => setDraft({ ...draft, [p]: { ...d, sale: e.target.value } })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Taxa por Order Bump (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={d.orderbump}
                        onChange={e => setDraft({ ...draft, [p]: { ...d, orderbump: e.target.value } })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Taxa por Saque (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={d.withdrawal}
                        onChange={e => setDraft({ ...draft, [p]: { ...d, withdrawal: e.target.value } })}
                      />
                    </div>
                  </div>
                  <Button size="sm" className="gap-2" onClick={() => handleSave(p)} disabled={savingId === p}>
                    {savingId === p ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
