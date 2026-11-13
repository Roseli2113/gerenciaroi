import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Receipt, RefreshCw } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';
import { investmentCosts, INVESTMENT_TAX_RATE } from '@/lib/investmentTax';
import { formatBRL } from '@/lib/formatBRL';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Tax() {
  const filters = useDashboardFilters();
  const [refreshing, setRefreshing] = useState(false);
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
  const totals = investmentCosts(rows.reduce((sum, c) => sum + c.spent, 0));
  const refresh = async () => {
    setRefreshing(true);
    try { await fetchCampaigns(); } finally { setRefreshing(false); }
  };

  return (
    <MainLayout title="Imposto">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Imposto Facebook</h1>
          <span className="ml-auto text-sm font-semibold text-primary">{INVESTMENT_TAX_RATE * 100}% sobre o investimento</span>
        </div>
        <DashboardFilters filters={filters} campaignOptions={rawCampaigns} showProductFilter={false} onRefresh={refresh} isRefreshing={refreshing || isLoading} />
        <dl className="grid grid-cols-1 gap-6 border-y border-border py-6 sm:grid-cols-3">
          {[
            { label: 'Investimento sem imposto', value: totals.investment },
            { label: 'Imposto (12%)', value: totals.tax },
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
              <TableHead className="text-right whitespace-nowrap">Imposto (12%)</TableHead>
              <TableHead className="text-right whitespace-nowrap">Gastos com imposto</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map(c => {
                const costs = investmentCosts(c.spent);
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
    </MainLayout>
  );
}