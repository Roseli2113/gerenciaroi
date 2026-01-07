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
  Info,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';
import { Link } from 'react-router-dom';

type TabType = 'contas' | 'campanhas' | 'conjuntos' | 'anuncios';

const Campaigns = () => {
  const [activeTab, setActiveTab] = useState<TabType>('campanhas');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  
  const {
    campaigns,
    isLoading,
    fetchCampaigns,
    toggleCampaignStatus,
    getLastUpdatedText,
    hasActiveAccount
  } = useMetaCampaigns();

  const toggleCampaignSelection = (id: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const toggleAllCampaigns = () => {
    if (selectedCampaigns.length === campaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(campaigns.map(c => c.id));
    }
  };

  const handleToggleStatus = async (campaignId: string, currentStatus: boolean) => {
    setTogglingIds(prev => new Set(prev).add(campaignId));
    await toggleCampaignStatus(campaignId, !currentStatus);
    setTogglingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(campaignId);
      return newSet;
    });
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatROI = (value: number | null) => {
    if (value === null) return 'N/A';
    return value.toFixed(2).replace('.', ',');
  };

  // Calculate totals
  const totals = campaigns.reduce((acc, campaign) => ({
    budget: acc.budget + (campaign.budget || 0),
    spent: acc.spent + campaign.spent,
    sales: acc.sales + campaign.sales,
    revenue: acc.revenue + campaign.revenue,
    profit: acc.profit + campaign.profit,
  }), { budget: 0, spent: 0, sales: 0, revenue: 0, profit: 0 });

  const totalCPA = totals.sales > 0 ? totals.spent / totals.sales : 0;
  const totalROI = totals.spent > 0 ? totals.revenue / totals.spent : 0;

  if (!hasActiveAccount) {
    return (
      <MainLayout title="Campanhas">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Nenhuma conta de anúncios ativa
          </h2>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Para visualizar suas campanhas, primeiro conecte e ative uma conta de anúncios do Meta Ads na página de Integrações.
          </p>
          <Button asChild>
            <Link to="/integrations">Ir para Integrações</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

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
              ✓ Meta Ads conectado
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Atualizado há {getLastUpdatedText()}
            </span>
            <Button 
              variant="default" 
              className="bg-primary hover:bg-primary/90"
              onClick={fetchCampaigns}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {isLoading && campaigns.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Carregando campanhas...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LayoutGrid className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhuma campanha encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent bg-muted/30">
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedCampaigns.length === campaigns.length && campaigns.length > 0}
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
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="border-border">
                    <TableCell>
                      <Checkbox 
                        checked={selectedCampaigns.includes(campaign.id)}
                        onCheckedChange={() => toggleCampaignSelection(campaign.id)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {togglingIds.has(campaign.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        <Switch 
                          checked={campaign.status}
                          onCheckedChange={() => handleToggleStatus(campaign.id, campaign.status)}
                          className="data-[state=checked]:bg-primary"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
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
                  <TableCell>{campaigns.length} CAMPANHAS</TableCell>
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
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Campaigns;
