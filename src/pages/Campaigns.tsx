import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Play, Pause, Search, Filter, TrendingUp, TrendingDown, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused';
  objective: string;
  budget: number;
  budgetType: 'daily' | 'total';
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpa: number;
  roi: number;
  sales: number;
}

const campaigns: Campaign[] = [
  { 
    id: '1', 
    name: 'Conversão - Produto Premium', 
    status: 'active',
    objective: 'Conversões',
    budget: 500, 
    budgetType: 'daily',
    spent: 342.50, 
    impressions: 45230,
    clicks: 1245,
    ctr: 2.75,
    cpa: 8.50, 
    roi: 245, 
    sales: 42 
  },
  { 
    id: '2', 
    name: 'Tráfego - Blog Posts', 
    status: 'active',
    objective: 'Tráfego',
    budget: 200, 
    budgetType: 'daily',
    spent: 156.80, 
    impressions: 32150,
    clicks: 890,
    ctr: 2.77,
    cpa: 12.30, 
    roi: 180, 
    sales: 28 
  },
  { 
    id: '3', 
    name: 'Remarketing - Carrinho Abandonado', 
    status: 'paused',
    objective: 'Conversões',
    budget: 300, 
    budgetType: 'total',
    spent: 0, 
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpa: 5.20, 
    roi: 320, 
    sales: 0 
  },
  { 
    id: '4', 
    name: 'Awareness - Lançamento', 
    status: 'active',
    objective: 'Alcance',
    budget: 150, 
    budgetType: 'daily',
    spent: 98.40, 
    impressions: 89450,
    clicks: 1520,
    ctr: 1.70,
    cpa: 18.90, 
    roi: 95, 
    sales: 12 
  },
  { 
    id: '5', 
    name: 'Lead Generation - Ebook', 
    status: 'active',
    objective: 'Leads',
    budget: 250, 
    budgetType: 'daily',
    spent: 180.20, 
    impressions: 28340,
    clicks: 756,
    ctr: 2.67,
    cpa: 9.80, 
    roi: 210, 
    sales: 35 
  },
];

const Campaigns = () => {
  return (
    <MainLayout title="Campanhas">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar campanhas..."
              className="pl-10 bg-card border-border"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-40 bg-card">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12"></TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead className="text-right">Orçamento</TableHead>
                <TableHead className="text-right">Gastos</TableHead>
                <TableHead className="text-right">Impressões</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">CPA</TableHead>
                <TableHead className="text-right">ROI</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id} className="border-border">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'rounded-full w-8 h-8',
                        campaign.status === 'active'
                          ? 'bg-success/20 text-success hover:bg-success/30'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {campaign.status === 'active' ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{campaign.name}</p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs mt-1',
                          campaign.status === 'active' 
                            ? 'bg-success/20 text-success border-0' 
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {campaign.status === 'active' ? 'Ativa' : 'Pausada'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {campaign.objective}
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p className="font-medium">R$ {campaign.budget.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.budgetType === 'daily' ? '/dia' : 'total'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {campaign.spent.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {campaign.impressions.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {campaign.clicks.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {campaign.ctr.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      'font-medium',
                      campaign.cpa < 10 ? 'text-success' : campaign.cpa > 15 ? 'text-destructive' : 'text-warning'
                    )}>
                      R$ {campaign.cpa.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn(
                      'flex items-center justify-end gap-1 font-medium',
                      campaign.roi > 150 ? 'text-success' : campaign.roi < 100 ? 'text-destructive' : 'text-warning'
                    )}>
                      {campaign.roi > 150 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {campaign.roi}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {campaign.sales}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Campaigns;
