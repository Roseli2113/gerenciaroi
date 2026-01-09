import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Settings, ArrowDown, ArrowUpDown, ChevronDown, RefreshCw, Building2, LayoutGrid, Layers, FileText, Info, AlertCircle, Loader2, Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMetaCampaigns, Campaign, AdSet, Ad } from '@/hooks/useMetaCampaigns';
import { Link } from 'react-router-dom';
import { EditBudgetDialog } from '@/components/campaigns/EditBudgetDialog';
import { EditAdSetBudgetDialog } from '@/components/campaigns/EditAdSetBudgetDialog';

type TabType = 'contas' | 'campanhas' | 'conjuntos' | 'anuncios';

const Campaigns = () => {
  const [activeTab, setActiveTab] = useState<TabType>('campanhas');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingAdSet, setEditingAdSet] = useState<AdSet | null>(null);
  
  const {
    campaigns, adSets, ads, isLoading, isLoadingAdSets, isLoadingAds,
    fetchCampaigns, fetchAdSets, fetchAds,
    toggleCampaignStatus, toggleAdSetStatus, toggleAdStatus,
    updateCampaignBudget, updateAdSetBudget, getLastUpdatedText, hasActiveAccount
  } = useMetaCampaigns();

  useEffect(() => {
    if (activeTab === 'conjuntos' && adSets.length === 0 && hasActiveAccount) fetchAdSets();
    if (activeTab === 'anuncios' && ads.length === 0 && hasActiveAccount) fetchAds();
  }, [activeTab, adSets.length, ads.length, hasActiveAccount, fetchAdSets, fetchAds]);

  const handleToggleStatus = async (id: string, currentStatus: boolean, type: 'campaign' | 'adset' | 'ad') => {
    setTogglingIds(prev => new Set(prev).add(id));
    if (type === 'campaign') await toggleCampaignStatus(id, !currentStatus);
    else if (type === 'adset') await toggleAdSetStatus(id, !currentStatus);
    else await toggleAdStatus(id, !currentStatus);
    setTogglingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const formatROI = (v: number | null) => v === null ? 'N/A' : v.toFixed(2).replace('.', ',');

  const handleRefresh = () => {
    if (activeTab === 'campanhas') fetchCampaigns();
    else if (activeTab === 'conjuntos') fetchAdSets();
    else if (activeTab === 'anuncios') fetchAds();
  };

  if (!hasActiveAccount) {
    return (
      <MainLayout title="Campanhas">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhuma conta de anúncios ativa</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Para visualizar suas campanhas, primeiro conecte e ative uma conta de anúncios do Meta Ads na página de Integrações.
          </p>
          <Button asChild><Link to="/integrations">Ir para Integrações</Link></Button>
        </div>
      </MainLayout>
    );
  }

  const currentLoading = activeTab === 'campanhas' ? isLoading : activeTab === 'conjuntos' ? isLoadingAdSets : isLoadingAds;
  const currentData = activeTab === 'campanhas' ? campaigns : activeTab === 'conjuntos' ? adSets : ads;

  const renderTable = () => {
    if (currentLoading && currentData.length === 0) {
      return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /><span className="ml-3 text-muted-foreground">Carregando...</span></div>;
    }
    if (currentData.length === 0) {
      return <div className="flex flex-col items-center justify-center py-16"><LayoutGrid className="w-12 h-12 text-muted-foreground mb-3" /><p className="text-muted-foreground">Nenhum item encontrado</p></div>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent bg-muted/30">
            <TableHead className="w-12"><Checkbox /></TableHead>
            <TableHead className="text-center font-semibold">STATUS</TableHead>
            <TableHead className="font-semibold">NOME</TableHead>
            {(activeTab === 'campanhas' || activeTab === 'conjuntos') && <TableHead className="text-center font-semibold">ORÇAMENTO</TableHead>}
            <TableHead className="text-center font-semibold">GASTOS</TableHead>
            <TableHead className="text-center font-semibold">VENDAS</TableHead>
            <TableHead className="text-center font-semibold">FATURAMENTO</TableHead>
            <TableHead className="text-center font-semibold">LUCRO</TableHead>
            <TableHead className="text-center font-semibold">CPA</TableHead>
            <TableHead className="text-center font-semibold">ROI</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.map((item) => (
            <TableRow key={item.id} className="border-border">
              <TableCell><Checkbox /></TableCell>
              <TableCell className="text-center">
                {togglingIds.has(item.id) ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                  <Switch checked={item.status} onCheckedChange={() => handleToggleStatus(item.id, item.status, activeTab === 'campanhas' ? 'campaign' : activeTab === 'conjuntos' ? 'adset' : 'ad')} />
                )}
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              {activeTab === 'campanhas' && (
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {(item as Campaign).budget ? (
                      <div>
                        <span>{formatCurrency((item as Campaign).budget!)}</span>
                        <span className="text-xs block">{(item as Campaign).budgetType === 'daily' ? 'Diário' : 'Total'}</span>
                      </div>
                    ) : 'N/A'}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingCampaign(item as Campaign)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              )}
              {activeTab === 'conjuntos' && (
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {(item as AdSet).budget ? (
                      <div>
                        <span>{formatCurrency((item as AdSet).budget!)}</span>
                        <span className="text-xs block">{(item as AdSet).budgetType === 'daily' ? 'Diário' : 'Total'}</span>
                      </div>
                    ) : 'CBO'}
                    {(item as AdSet).budget && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingAdSet(item as AdSet)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
              <TableCell className="text-center">{formatCurrency(item.spent)}</TableCell>
              <TableCell className="text-center">{item.sales}</TableCell>
              <TableCell className="text-center">{formatCurrency(item.revenue)}</TableCell>
              <TableCell className={cn("text-center font-medium", item.profit > 0 ? "text-success" : item.profit < 0 ? "text-destructive" : "")}>{formatCurrency(item.profit)}</TableCell>
              <TableCell className="text-center">{item.cpa !== null ? formatCurrency(item.cpa) : 'N/A'}</TableCell>
              <TableCell className={cn("text-center font-medium", item.roi !== null && item.roi > 1 ? "text-primary" : item.roi !== null && item.roi < 1 ? "text-destructive" : "")}>{formatROI(item.roi)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <MainLayout title="Campanhas">
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="bg-card border border-border h-auto p-0 w-full grid grid-cols-4">
            <TabsTrigger value="contas" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2"><Building2 className="w-4 h-4" />Contas</TabsTrigger>
            <TabsTrigger value="campanhas" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2"><LayoutGrid className="w-4 h-4" />Campanhas</TabsTrigger>
            <TabsTrigger value="conjuntos" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2"><Layers className="w-4 h-4" />Conjuntos</TabsTrigger>
            <TabsTrigger value="anuncios" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2"><FileText className="w-4 h-4" />Anúncios</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between">
          <Badge className="bg-success text-success-foreground border-0">✓ Meta Ads conectado</Badge>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Atualizado há {getLastUpdatedText()}</span>
            <Button variant="default" onClick={handleRefresh} disabled={currentLoading}>
              {currentLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}Atualizar
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">{renderTable()}</div>
      </div>

      {editingCampaign && (
        <EditBudgetDialog
          open={!!editingCampaign}
          onOpenChange={(open) => !open && setEditingCampaign(null)}
          campaignName={editingCampaign.name}
          currentBudget={editingCampaign.budget}
          budgetType={editingCampaign.budgetType}
          onSave={(budget, type) => updateCampaignBudget(editingCampaign.id, budget, type)}
        />
      )}

      {editingAdSet && (
        <EditAdSetBudgetDialog
          open={!!editingAdSet}
          onOpenChange={(open) => !open && setEditingAdSet(null)}
          adSetName={editingAdSet.name}
          currentBudget={editingAdSet.budget}
          budgetType={editingAdSet.budgetType}
          onSave={(budget, type) => updateAdSetBudget(editingAdSet.id, budget, type)}
        />
      )}
    </MainLayout>
  );
};

export default Campaigns;
