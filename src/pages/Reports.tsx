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
import { FileText, Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const reportData = [
  { name: 'Conversão - Produto Premium', impressions: 45230, clicks: 1245, ctr: 2.75, spent: 342.50, revenue: 1840, roi: 437, cpa: 8.50 },
  { name: 'Tráfego - Blog Posts', impressions: 32150, clicks: 890, ctr: 2.77, spent: 156.80, revenue: 438, roi: 179, cpa: 12.30 },
  { name: 'Remarketing - Carrinho', impressions: 18920, clicks: 654, ctr: 3.46, spent: 98.40, revenue: 512, roi: 420, cpa: 5.20 },
  { name: 'Lead Generation', impressions: 28340, clicks: 756, ctr: 2.67, spent: 180.20, revenue: 558, roi: 210, cpa: 9.80 },
];

const Reports = () => {
  const exportCSV = () => {
    const headers = ['Campanha', 'Impressões', 'Cliques', 'CTR', 'Gastos', 'Receita', 'ROI', 'CPA'];
    const rows = reportData.map(r => [
      r.name,
      r.impressions,
      r.clicks,
      r.ctr + '%',
      'R$ ' + r.spent.toFixed(2),
      'R$ ' + r.revenue.toFixed(2),
      r.roi + '%',
      'R$ ' + r.cpa.toFixed(2)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-campanhas.csv';
    a.click();
  };

  return (
    <MainLayout title="Relatórios">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Select defaultValue="30days">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="30days">Últimos 30 dias</SelectItem>
                    <SelectItem value="90days">Últimos 90 dias</SelectItem>
                    <SelectItem value="thisMonth">Este mês</SelectItem>
                    <SelectItem value="lastMonth">Mês passado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Agrupar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as campanhas</SelectItem>
                  <SelectItem value="campaign">Por Campanha</SelectItem>
                  <SelectItem value="product">Por Produto</SelectItem>
                  <SelectItem value="utm">Por UTM</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                className="ml-auto gap-2"
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
              <p className="text-2xl font-bold text-foreground">R$ 777,90</p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3" />
                -12% vs período anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold text-success">R$ 3.348,00</p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +24% vs período anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">ROI Médio</p>
              <p className="text-2xl font-bold text-primary">330%</p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +18% vs período anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">CPA Médio</p>
              <p className="text-2xl font-bold text-foreground">R$ 8,95</p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3" />
                -8% vs período anterior
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row, index) => (
                  <TableRow key={index} className="border-border">
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.impressions.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.clicks.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">{row.ctr}%</TableCell>
                    <TableCell className="text-right">R$ {row.spent.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium text-success">
                      R$ {row.revenue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        'font-medium',
                        row.roi > 200 ? 'text-success' : row.roi < 100 ? 'text-destructive' : 'text-warning'
                      )}>
                        {row.roi}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        'font-medium',
                        row.cpa < 8 ? 'text-success' : row.cpa > 10 ? 'text-warning' : 'text-foreground'
                      )}>
                        R$ {row.cpa.toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Reports;
