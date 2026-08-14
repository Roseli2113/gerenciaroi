import { useState, useMemo } from 'react';
import { endOfDay, format, startOfDay, startOfMonth, subDays, subMonths, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Download, Calendar as CalendarIcon, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';
import { normalizeAttributionName, useSalesAttribution } from '@/hooks/useSalesAttribution';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date>();
  const [customDateTo, setCustomDateTo] = useState<Date>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [localCampaigns, setLocalCampaigns] = useState<typeof campaigns | null>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    if (selectedPeriod === 'custom' && customDateFrom && customDateTo) {
      return { startDate: startOfDay(customDateFrom), endDate: endOfDay(customDateTo) };
    }
    switch (selectedPeriod) {
      case 'yesterday': {
        const yesterday = subDays(now, 1);
        return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
      }
      case '7days': return { startDate: startOfDay(subDays(now, 6)), endDate: endOfDay(now) };
      case '30days': return { startDate: startOfDay(subDays(now, 29)), endDate: endOfDay(now) };
      case '90days': return { startDate: startOfDay(subDays(now, 89)), endDate: endOfDay(now) };
      case 'thisMonth': return { startDate: startOfMonth(now), endDate: endOfDay(now) };
      case 'lastMonth': {
        const previousMonth = subMonths(now, 1);
        return { startDate: startOfMonth(previousMonth), endDate: endOfMonth(previousMonth) };
      }
      default: return { startDate: startOfDay(now), endDate: endOfDay(now) };
    }
  }, [selectedPeriod, customDateFrom, customDateTo]);

  const metaDatePreset = useMemo(() => {
    const presets: Record<string, string> = {
      today: 'today', yesterday: 'yesterday', '7days': 'last_7d',
      '30days': 'last_30d', thisMonth: 'this_month', lastMonth: 'last_month',
    };
    return presets[selectedPeriod] ?? 'today';
  }, [selectedPeriod]);

  const customMetaRange = useMemo(() => {
    if (selectedPeriod !== 'custom' && selectedPeriod !== '90days') return undefined;
    return {
      since: format(dateRange.startDate, 'yyyy-MM-dd'),
      until: format(dateRange.endDate, 'yyyy-MM-dd'),
    };
  }, [selectedPeriod, dateRange]);

  const { campaigns, isLoading: campaignsLoading, refreshAll } = useMetaCampaigns(metaDatePreset, customMetaRange);
  const { metrics: salesMetrics, refreshSales, loading: salesLoading } = useSales({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const { attribution, loading: attributionLoading, refreshAttribution } = useSalesAttribution(dateRange.startDate, dateRange.endDate);

  // Use local campaigns if available (after deletions), otherwise use fetched campaigns
  const baseCampaigns = localCampaigns ?? campaigns;

  const uniqueCampaignNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const campaign of baseCampaigns) {
      const name = normalizeAttributionName(campaign.name);
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return counts;
  }, [baseCampaigns]);

  // Merge only real webhook sales into campaign data. Pixel purchases are not revenue.
  const displayCampaigns = useMemo(() => {
    return baseCampaigns.map(c => {
      const normalizedName = normalizeAttributionName(c.name);
      const byId = attribution.byCampaignId.get(c.id);
      const byUniqueName = normalizedName && uniqueCampaignNames.get(normalizedName) === 1
        ? attribution.byCampaignName.get(normalizedName)
        : undefined;
      const salesData = byId ?? byUniqueName;
      const revenue = salesData?.revenue ?? 0;
      const salesCount = salesData?.sales ?? 0;
      const profit = revenue - c.spent;
      const roi = c.spent > 0 ? revenue / c.spent : null;
      const cpa = salesCount > 0 ? c.spent / salesCount : null;
      return { ...c, revenue, sales: salesCount, profit, roi, cpa };
    }).filter(c => selectedCampaign === 'all' || c.id === selectedCampaign);
  }, [baseCampaigns, attribution, uniqueCampaignNames, selectedCampaign]);

  // Calculate totals from real data
  const totalSpent = displayCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalRevenue = selectedCampaign === 'all'
    ? salesMetrics.totalRevenue
    : displayCampaigns.reduce((sum, c) => sum + c.revenue, 0);
  const avgROI = totalSpent > 0 ? (totalRevenue / totalSpent) * 100 : 0;
  const totalSales = selectedCampaign === 'all'
    ? salesMetrics.approvedSales
    : displayCampaigns.reduce((sum, c) => sum + c.sales, 0);
  const avgCPA = totalSales > 0 ? totalSpent / totalSales : 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshAll(), refreshSales(), refreshAttribution()]);
      toast.success('Relatório atualizado com sucesso');
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportCSV = () => {
    if (displayCampaigns.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }
    const headers = ['Campanha', 'Impressões', 'Cliques', 'CTR', 'Gastos', 'Receita', 'ROI', 'CPA'];
    const rows = displayCampaigns.map(c => [
      c.name,
      c.impressions,
      c.clicks,
      (c.ctr ?? 0).toFixed(2) + '%',
      'R$ ' + c.spent.toFixed(2),
      'R$ ' + c.revenue.toFixed(2),
      ((c.roi ?? 0) * 100).toFixed(0) + '%',
      'R$ ' + (c.cpa ?? 0).toFixed(2)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-campanhas.csv';
    a.click();
  };

  const handleDelete = () => {
    if (deleteIndex !== null) {
      const newCampaigns = [...displayCampaigns];
      newCampaigns.splice(deleteIndex, 1);
      setLocalCampaigns(newCampaigns);
      toast.success('Registro removido do relatório');
      setDeleteIndex(null);
    }
  };

  return (
    <MainLayout title="Relatórios">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="yesterday">Ontem</SelectItem>
                    <SelectItem value="7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="30days">Últimos 30 dias</SelectItem>
                    <SelectItem value="90days">Últimos 90 dias</SelectItem>
                    <SelectItem value="thisMonth">Este mês</SelectItem>
                    <SelectItem value="lastMonth">Mês passado</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Campanha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as campanhas</SelectItem>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPeriod === 'custom' && (
                <div className="flex flex-wrap items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateFrom ? format(customDateFrom, 'dd/MM/yyyy') : 'Data inicial'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} disabled={date => date > new Date()} locale={ptBR} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateTo ? format(customDateTo, 'dd/MM/yyyy') : 'Data final'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} disabled={date => date > new Date() || (customDateFrom ? date < customDateFrom : false)} locale={ptBR} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <Button 
                variant="outline" 
                className="ml-auto gap-2"
                onClick={handleRefresh}
                disabled={isRefreshing || campaignsLoading || salesLoading || attributionLoading}
              >
                <RefreshCw className={cn('w-4 h-4', (isRefreshing || campaignsLoading || salesLoading || attributionLoading) && 'animate-spin')} />
                Atualizar
              </Button>

              <Button 
                variant="outline" 
                className="gap-2"
                onClick={exportCSV}
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total de Gastos</p>
              <p className="text-2xl font-bold text-foreground">
                R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold text-success">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">ROI Médio</p>
              <p className="text-2xl font-bold text-primary">{avgROI.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">CPA Médio</p>
              <p className="text-2xl font-bold text-foreground">
                R$ {avgCPA.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Relatório Detalhado</CardTitle>
                <CardDescription>
                  Performance de todas as campanhas no período selecionado
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Campanha</TableHead>
                  <TableHead className="text-right">Impressões</TableHead>
                  <TableHead className="text-right">Cliques</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Gastos</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(campaignsLoading || salesLoading || attributionLoading) ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : displayCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhum dado disponível
                    </TableCell>
                  </TableRow>
                ) : displayCampaigns.map((row, index) => (
                  <TableRow key={index} className="border-border">
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.impressions.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.clicks.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">{(row.ctr ?? 0).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">R$ {row.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-medium text-success">
                      R$ {row.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const roiPercent = (row.roi ?? 0) * 100;
                        return (
                          <span className={cn(
                            'font-medium',
                            roiPercent > 200 ? 'text-success' : roiPercent < 100 ? 'text-destructive' : 'text-warning'
                          )}>
                            {roiPercent.toFixed(0)}%
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const cpaValue = row.cpa ?? 0;
                        return (
                          <span className={cn(
                            'font-medium',
                            cpaValue < 8 ? 'text-success' : cpaValue > 10 ? 'text-warning' : 'text-foreground'
                          )}>
                            R$ {cpaValue.toFixed(2)}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteIndex(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir do Relatório</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este item do relatório? Esta ação afeta apenas a visualização atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Reports;
