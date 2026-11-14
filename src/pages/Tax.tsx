import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Pencil, Receipt, RefreshCw } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';
import { useInvestmentTaxRate } from '@/hooks/useInvestmentTaxRate';
import { investmentCosts } from '@/lib/investmentTax';
import { formatBRL } from '@/lib/formatBRL';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formatPercent = (rate: number) =>
  (rate * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export default function Tax() {
  const filters = useDashboardFilters();
  const [refreshing, setRefreshing] = useState(false);
  const { rate, saveRate } = useInvestmentTaxRate();
  const [editing, setEditing] = useState(false);
  const [percentInput, setPercentInput] = useState('');
  const [saving, setSaving] = useState(false);
  const preset = {
    today: 'today', yesterday: 'yesterday', '7days': 'last_7d', '30days': 'last_30d',
    thisMonth: 'this_month', lastMonth: 'last_month', custom: 'today',
  }[filters.selectedPeriod];
  const customRange = useMemo(() => filters.selectedPeriod === 'custom' ? {
    since: format(filters.dateRange.startDate, 'yyyy-MM-dd'),
    until: format(filters.dateRange.endDate, 'yyyy-MM-dd'),
  } : undefined, [filters.selectedPeriod, filters.dateRange]);
  const { rawCampaigns, isLoading, loadErrors, fetchCampaigns } = useMetaCampaigns(preset, customRange);
  const rows = rawCampaigns.filter(c =>
    (filters.selectedAccount === 'all' || c.accountId === filters.selectedAccount) &&
    (filters.selectedCampaign === 'all' || c.id === filters.selectedCampaign));
  const totals = investmentCosts(rows.reduce((sum, c) => sum + c.spent, 0), rate);
  const percentLabel = formatPercent(rate);
  const refresh = async () => {
    setRefreshing(true);
    try { await fetchCampaigns(); } finally { setRefreshing(false); }
  };
  const openEdit = () => {
    setPercentInput(percentLabel);
    setEditing(true);
  };
  const save = async () => {
    const percent = Number(percentInput.replace(',', '.'));
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) return;
    setSaving(true);
    try {
      if (await saveRate(percent)) setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Imposto">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Imposto Facebook</h1>
          <span className="ml-auto flex items-center gap-2 text-sm font-semibold text-primary">
            {percentLabel}% sobre o investimento
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil className="mr-2 h-4 w-4" />Editar
            </Button>
          </span>
        </div>
        <DashboardFilters filters={filters} campaignOptions={rawCampaigns} showProductFilter={false} onRefresh={refresh} isRefreshing={refreshing || isLoading} />
        <dl className="grid grid-cols-1 gap-6 border-y border-border py-6 sm:grid-cols-3">
          {[
            { label: 'Investimento sem imposto', value: totals.investment },
            { label: `Imposto (${percentLabel}%)`, value: totals.tax },
            { label: 'Gastos com imposto', value: totals.total },
          ].map(item => (
            <div key={item.label}>
              <dt className="text-sm text-muted-foreground">{item.label}</dt>
              <dd className="mt-2 break-words text-2xl font-semibold tabular-nums">{formatBRL(item.value)}</dd>
            </div>
          ))}
        </dl>
        {loadErrors.campaigns && <p role="alert" className="text-sm text-destructive">{loadErrors.campaigns}</p>}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead className="text-right whitespace-nowrap">Investimento</TableHead>
              <TableHead className="text-right whitespace-nowrap">Imposto ({percentLabel}%)</TableHead>
              <TableHead className="text-right whitespace-nowrap">Gastos com imposto</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map(c => {
                const costs = investmentCosts(c.spent, rate);
                return <TableRow key={c.id}>
                  <TableCell className="min-w-48 font-medium">{c.name}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">{formatBRL(costs.investment)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">{formatBRL(costs.tax)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">{formatBRL(costs.total)}</TableCell>
                </TableRow>;
              })}
              {!rows.length && <TableRow><TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                {isLoading ? 'Carregando investimentos…' : 'Nenhum investimento encontrado neste período.'}
                {!isLoading && loadErrors.campaigns && <Button variant="outline" className="ml-3" onClick={refresh}><RefreshCw className="mr-2 h-4 w-4" />Tentar novamente</Button>}
              </TableCell></TableRow>}
              {!!rows.length && <TableRow className="font-semibold bg-muted/50">
                <TableCell>Total</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatBRL(totals.investment)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatBRL(totals.tax)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatBRL(totals.total)}</TableCell>
              </TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar imposto</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="tax-rate">Percentual sobre o investimento (%)</Label>
            <Input
              id="tax-rate"
              inputMode="decimal"
              value={percentInput}
              onChange={e => setPercentInput(e.target.value)}
              placeholder="12"
            />
            <p className="text-xs text-muted-foreground">
              Esse percentual entra nas somas de gastos de todo o painel (Campanhas, Dashboard e Relatórios).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
