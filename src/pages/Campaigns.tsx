import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Settings, 
  ArrowDown, 
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
  Building2,
  LayoutGrid,
  Layers,
  FileText,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'contas' | 'campanhas' | 'conjuntos' | 'anuncios';

interface Campaign {
  id: string;
  name: string;
  status: boolean;
  budget: number | null;
  budgetType: 'daily' | 'total' | null;
  spent: number;
  sales: number;
  revenue: number;
  profit: number;
  cpa: number | null;
  roi: number | null;
}

const mockCampaigns: Campaign[] = [
  { 
    id: '1', 
    name: 'LOVE/ ABO 05/01/26 - TOP ✅', 
    status: true,
    budget: null, 
    budgetType: null,
    spent: 27.05, 
    sales: 5,
    revenue: 46.90,
    profit: 19.85,
    cpa: 5.41,
    roi: 1.73
  },
  { 
    id: '2', 
    name: 'LOVE/ ABO 05/01/26 - TOP ✅ – Cópia', 
    status: true,
    budget: null, 
    budgetType: null,
    spent: 0.00, 
    sales: 0,
    revenue: 0.00,
    profit: 0.00,
    cpa: null,
    roi: 0.00
  },
  { 
    id: '3', 
    name: 'LOVE/ ABO 05/01/26 - TOP ✅ – Cópia', 
    status: true,
    budget: null, 
    budgetType: null,
    spent: 0.00, 
    sales: 0,
    revenue: 0.00,
    profit: 0.00,
    cpa: null,
    roi: 0.00
  },
  { 
    id: '4', 
    name: 'LIMPEZA/ CBO- 31/12/25', 
    status: true,
    budget: 10.00, 
    budgetType: 'daily',
    spent: 0.00, 
    sales: 0,
    revenue: 0.00,
    profit: 0.00,
    cpa: null,
    roi: null
  },
];

const Campaigns = () => {
  const [activeTab, setActiveTab] = useState<TabType>('campanhas');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [lastUpdated] = useState('30 segundos');

  const toggleCampaignSelection = (id: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const toggleAllCampaigns = () => {
    if (selectedCampaigns.length === mockCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(mockCampaigns.map(c => c.id));
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatROI = (value: number | null) => {
    if (value === null) return 'N/A';
    return value.toFixed(2).replace('.', ',');
  };

  // Calculate totals
  const totals = mockCampaigns.reduce((acc, campaign) => ({
    budget: acc.budget + (campaign.budget || 0),
    spent: acc.spent + campaign.spent,
    sales: acc.sales + campaign.sales,
    revenue: acc.revenue + campaign.revenue,
    profit: acc.profit + campaign.profit,
  }), { budget: 0, spent: 0, sales: 0, revenue: 0, profit: 0 });

  const totalCPA = totals.sales > 0 ? totals.spent / totals.sales : 0;
  const totalROI = totals.spent > 0 ? totals.revenue / totals.spent : 0;

  return (
    <MainLayout title="Campanhas">
      <div className="space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="bg-card border border-border h-auto p-0 w-full grid grid-cols-4">
            <TabsTrigger 
              value="contas" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2"
            >
              <Building2 className="w-4 h-4" />
              Contas
            </TabsTrigger>
            <TabsTrigger 
              value="campanhas" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger 
              value="conjuntos" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2"
            >
              <Layers className="w-4 h-4" />
              Conjuntos
            </TabsTrigger>
            <TabsTrigger 
              value="anuncios" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2"
            >
              <FileText className="w-4 h-4" />
              Anúncios
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowDown className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowUpDown className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Badge className="bg-success text-success-foreground border-0 ml-2">
              ✓ Todas as vendas trackeadas
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Atualizado há {lastUpdated}
            </span>
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent bg-muted/30">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedCampaigns.length === mockCampaigns.length}
                    onCheckedChange={toggleAllCampaigns}
                  />
                </TableHead>
                <TableHead className="text-center font-semibold">STATUS</TableHead>
                <TableHead className="font-semibold">CAMPANHA</TableHead>
                <TableHead className="text-center font-semibold">ORÇAMENTO</TableHead>
                <TableHead className="text-center font-semibold">GASTOS</TableHead>
                <TableHead className="text-center font-semibold">VENDAS</TableHead>
                <TableHead className="text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    FATURAMENTO
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total de receita gerada</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    LUCRO
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Faturamento - Gastos</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    CPA
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Custo por Aquisição</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    ROI
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Retorno sobre Investimento</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCampaigns.map((campaign) => (
                <TableRow key={campaign.id} className="border-border">
                  <TableCell>
                    <Checkbox 
                      checked={selectedCampaigns.includes(campaign.id)}
                      onCheckedChange={() => toggleCampaignSelection(campaign.id)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch 
                      checked={campaign.status}
                      className="data-[state=checked]:bg-primary"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-center">
                    {campaign.name}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {campaign.budget ? (
                      <div>
                        <span>{formatCurrency(campaign.budget)}</span>
                        <span className="text-xs block">
                          {campaign.budgetType === 'daily' ? 'Diário' : 'Total'}
                        </span>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatCurrency(campaign.spent)}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.sales}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatCurrency(campaign.revenue)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-center font-medium",
                    campaign.profit > 0 ? "text-success" : campaign.profit < 0 ? "text-destructive" : ""
                  )}>
                    {formatCurrency(campaign.profit)}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.cpa !== null ? formatCurrency(campaign.cpa) : 'N/A'}
                  </TableCell>
                  <TableCell className={cn(
                    "text-center font-medium",
                    campaign.roi !== null && campaign.roi > 1 
                      ? "text-primary" 
                      : campaign.roi !== null && campaign.roi > 0 && campaign.roi < 1 
                        ? "text-destructive" 
                        : ""
                  )}>
                    {formatROI(campaign.roi)}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Totals Row */}
              <TableRow className="border-border bg-muted/50 font-semibold">
                <TableCell>N/A</TableCell>
                <TableCell className="text-center">N/A</TableCell>
                <TableCell className="text-center">{mockCampaigns.length} CAMPANHAS</TableCell>
                <TableCell className="text-center">
                  {totals.budget > 0 ? formatCurrency(totals.budget) : 'N/A'}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(totals.spent)}
                </TableCell>
                <TableCell className="text-center">
                  {totals.sales}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(totals.revenue)}
                </TableCell>
                <TableCell className={cn(
                  "text-center",
                  totals.profit > 0 ? "text-success" : totals.profit < 0 ? "text-destructive" : ""
                )}>
                  {formatCurrency(totals.profit)}
                </TableCell>
                <TableCell className="text-center">
                  {totalCPA > 0 ? formatCurrency(totalCPA) : 'N/A'}
                </TableCell>
                <TableCell className={cn(
                  "text-center",
                  totalROI > 1 ? "text-primary" : totalROI > 0 && totalROI < 1 ? "text-destructive" : ""
                )}>
                  {formatROI(totalROI)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Campaigns;
