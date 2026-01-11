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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  RefreshCw, Building2, LayoutGrid, Layers, FileText, AlertCircle, Loader2, Pencil, Edit3, Settings, ArrowUp, ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMetaCampaigns, Campaign, AdSet, Ad } from '@/hooks/useMetaCampaigns';
import { Link } from 'react-router-dom';
import { EditBudgetDialog } from '@/components/campaigns/EditBudgetDialog';
import { EditAdSetBudgetDialog } from '@/components/campaigns/EditAdSetBudgetDialog';
import { EditCampaignNameDialog } from '@/components/campaigns/EditCampaignNameDialog';
import { ColumnCustomizationDialog, ColumnConfig, ALL_COLUMNS, DEFAULT_VISIBLE } from '@/components/campaigns/ColumnCustomizationDialog';

type TabType = 'contas' | 'campanhas' | 'conjuntos' | 'anuncios';

const COLUMNS_STORAGE_KEY = 'campaigns-columns-config';

const Campaigns = () => {
  const [activeTab, setActiveTab] = useState<TabType>('campanhas');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingAdSet, setEditingAdSet] = useState<AdSet | null>(null);
  const [editingCampaignName, setEditingCampaignName] = useState<Campaign | null>(null);
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return ALL_COLUMNS.map(col => ({
      ...col,
      visible: DEFAULT_VISIBLE.includes(col.id)
    }));
  });
  
  const {
    campaigns, adSets, ads, isLoading, isLoadingAdSets, isLoadingAds,
    fetchCampaigns, fetchAdSets, fetchAds, refreshAll,
    toggleCampaignStatus, toggleAdSetStatus, toggleAdStatus,
    updateCampaignBudget, updateAdSetBudget, updateCampaignName,
    getLastUpdatedText, hasActiveAccount,
    selectedCampaignId, selectedAdSetId, setSelectedCampaignId, setSelectedAdSetId
  } = useMetaCampaigns();

  // When switching to conjuntos tab, fetch adsets for selected campaign
  useEffect(() => {
    if (activeTab === 'conjuntos' && hasActiveAccount) {
      fetchAdSets(selectedCampaignId || undefined);
    }
    if (activeTab === 'anuncios' && hasActiveAccount) {
      fetchAds(selectedAdSetId || undefined);
    }
  }, [activeTab, hasActiveAccount, fetchAdSets, fetchAds, selectedCampaignId, selectedAdSetId]);

  const handleToggleStatus = async (id: string, currentStatus: boolean, type: 'campaign' | 'adset' | 'ad') => {
    setTogglingIds(prev => new Set(prev).add(id));
    if (type === 'campaign') await toggleCampaignStatus(id, !currentStatus);
    else if (type === 'adset') await toggleAdSetStatus(id, !currentStatus);
    else await toggleAdStatus(id, !currentStatus);
    setTogglingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handleSelectCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId === selectedCampaignId ? null : campaignId);
    setSelectedAdSetId(null); // Reset adset selection when campaign changes
  };

  const handleSelectAdSet = (adsetId: string) => {
    setSelectedAdSetId(adsetId === selectedAdSetId ? null : adsetId);
  };

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const formatPercent = (v: number | null) => v === null ? 'N/A' : `${v.toFixed(2).replace('.', ',')}%`;
  const formatNumber = (v: number) => v.toLocaleString('pt-BR');

  const handleRefresh = () => {
    refreshAll();
  };

  const handleSaveColumns = (newColumns: ColumnConfig[]) => {
    setColumnConfig(newColumns);
    localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(newColumns));
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

  // Get filtered data based on selection
  const getFilteredAdSets = () => {
    if (!selectedCampaignId) return adSets;
    return adSets.filter(as => as.campaignId === selectedCampaignId);
  };

  const getFilteredAds = () => {
    if (!selectedAdSetId) return ads;
    return ads.filter(ad => ad.adsetId === selectedAdSetId);
  };

  const displayData = activeTab === 'campanhas' ? campaigns : 
                      activeTab === 'conjuntos' ? getFilteredAdSets() : 
                      getFilteredAds();

  // Get visible columns in correct order
  const visibleColumns = columnConfig.filter(c => c.visible);

  // Column data mapping for dynamic rendering
  const getColumnValue = (item: Campaign | AdSet | Ad, columnId: string) => {
    switch (columnId) {
      case 'orcamento':
        if (activeTab === 'campanhas') {
          const campaign = item as Campaign;
          return campaign.budget ? (
            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
              <div>
                <span>{formatCurrency(campaign.budget)}</span>
                <span className="text-xs block">{campaign.budgetType === 'daily' ? 'Diário' : 'Total'}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingCampaign(campaign)}>
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
          ) : 'N/A';
        } else if (activeTab === 'conjuntos') {
          const adset = item as AdSet;
          return adset.budget ? (
            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
              <div>
                <span>{formatCurrency(adset.budget)}</span>
                <span className="text-xs block">{adset.budgetType === 'daily' ? 'Diário' : 'Total'}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingAdSet(adset)}>
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
          ) : 'CBO';
        }
        return null;
      case 'gastos':
        return formatCurrency(item.spent);
      case 'impressoes':
        return formatNumber(item.impressions);
      case 'cpm':
        return item.cpm !== null ? formatCurrency(item.cpm) : 'N/A';
      case 'cliques':
        return formatNumber(item.clicks);
      case 'cpc':
        return item.cpc !== null ? formatCurrency(item.cpc) : 'N/A';
      case 'ctr':
        return formatPercent(item.ctr);
      case 'frequencia':
        return item.frequency !== null ? item.frequency.toFixed(2) : 'N/A';
      case 'playRateHook':
        return formatPercent(item.hookPlayRate);
      case 'holdRate':
        return formatPercent(item.holdRate);
      case 'cta':
        return formatNumber(item.ctaClicks);
      case 'visPag':
        return formatNumber(item.pageViews);
      case 'cpv':
        return item.cpv !== null ? formatCurrency(item.cpv) : 'N/A';
      case 'ic':
        return formatNumber(item.initiatedCheckout);
      case 'cpi':
        return item.costPerInitiatedCheckout !== null ? formatCurrency(item.costPerInitiatedCheckout) : 'N/A';
      case 'convCheck':
        return formatPercent(item.checkoutConversion);
      case 'vendas':
        return item.sales;
      case 'faturamento':
        return formatCurrency(item.revenue);
      case 'cpa':
        return item.cpa !== null ? formatCurrency(item.cpa) : 'N/A';
      case 'roas':
        return item.roas !== null ? item.roas.toFixed(2) : 'N/A';
      case 'lucro':
        return <span className={cn("font-medium", item.profit > 0 ? "text-success" : item.profit < 0 ? "text-destructive" : "")}>{formatCurrency(item.profit)}</span>;
      case 'roi':
        return <span className={cn("font-medium", item.roi !== null && item.roi > 1 ? "text-primary" : item.roi !== null && item.roi < 1 ? "text-destructive" : "")}>{item.roi !== null ? item.roi.toFixed(2) : 'N/A'}</span>;
      case 'margem':
        return <span className={cn("font-medium", item.margin !== null && item.margin > 0 ? "text-success" : item.margin !== null && item.margin < 0 ? "text-destructive" : "")}>{formatPercent(item.margin)}</span>;
      case 'vendasRecusadas':
        return <span className="text-destructive">{item.declinedSales}</span>;
      case 'vendasReemb':
        return <span className="text-destructive">{item.refundedSales}</span>;
      default:
        return 'N/A';
    }
  };

  const getColumnLabel = (columnId: string) => {
    const col = ALL_COLUMNS.find(c => c.id === columnId);
    if (!col) return columnId.toUpperCase();
    // Extract short label from full label
    const label = col.label.split(' - ')[0].replace(/[\[\]]/g, '');
    return label.toUpperCase();
  };

  const renderTable = () => {
    if (currentLoading && displayData.length === 0) {
      return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /><span className="ml-3 text-muted-foreground">Carregando...</span></div>;
    }
    if (displayData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <LayoutGrid className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {activeTab === 'conjuntos' && selectedCampaignId 
              ? 'Nenhum conjunto encontrado para esta campanha' 
              : activeTab === 'anuncios' && selectedAdSetId
              ? 'Nenhum anúncio encontrado para este conjunto'
              : 'Nenhum item com gastos hoje'}
          </p>
        </div>
      );
    }

    return (
      <ScrollArea className="w-full whitespace-nowrap">
        <Table className="border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent bg-muted/30">
              <TableHead className="w-12 sticky left-0 bg-muted/30 z-10 border-r border-border"><Checkbox /></TableHead>
              <TableHead className="text-center font-semibold sticky left-12 bg-muted/30 z-10 border-r border-border">STATUS</TableHead>
              <TableHead className="font-semibold sticky left-24 bg-muted/30 z-10 min-w-[200px] border-r border-border">NOME</TableHead>
              {visibleColumns.map((col, index) => (
                <TableHead 
                  key={col.id} 
                  className={cn(
                    "text-center font-semibold border-r border-border",
                    index === visibleColumns.length - 1 && "border-r-0"
                  )}
                >
                  {getColumnLabel(col.id)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((item) => {
              const isSelected = activeTab === 'campanhas' 
                ? selectedCampaignId === item.id 
                : activeTab === 'conjuntos' 
                ? selectedAdSetId === item.id 
                : false;
              
              return (
                <TableRow 
                  key={item.id} 
                  className={cn(
                    "border-border cursor-pointer",
                    isSelected && "bg-primary/10"
                  )}
                  onClick={() => {
                    if (activeTab === 'campanhas') handleSelectCampaign(item.id);
                    else if (activeTab === 'conjuntos') handleSelectAdSet(item.id);
                  }}
                >
                  <TableCell className="sticky left-0 bg-card z-10 border-r border-border">
                    <Checkbox 
                      checked={isSelected} 
                      onCheckedChange={() => {
                        if (activeTab === 'campanhas') handleSelectCampaign(item.id);
                        else if (activeTab === 'conjuntos') handleSelectAdSet(item.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="text-center sticky left-12 bg-card z-10 border-r border-border" onClick={(e) => e.stopPropagation()}>
                    {togglingIds.has(item.id) ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                      <Switch checked={item.status} onCheckedChange={() => handleToggleStatus(item.id, item.status, activeTab === 'campanhas' ? 'campaign' : activeTab === 'conjuntos' ? 'adset' : 'ad')} />
                    )}
                  </TableCell>
                  <TableCell className="font-medium sticky left-24 bg-card z-10 min-w-[200px] border-r border-border">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[180px]">{item.name}</span>
                      {activeTab === 'campanhas' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCampaignName(item as Campaign);
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  {visibleColumns.map((col, index) => (
                    <TableCell 
                      key={col.id} 
                      className={cn(
                        "text-center border-r border-border",
                        index === visibleColumns.length - 1 && "border-r-0"
                      )}
                    >
                      {getColumnValue(item, col.id)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  };

  return (
    <MainLayout title="Campanhas">
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="bg-card border border-border h-auto p-0 w-full grid grid-cols-4">
            <TabsTrigger value="contas" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2"><Building2 className="w-4 h-4" />Contas</TabsTrigger>
            <TabsTrigger value="campanhas" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2"><LayoutGrid className="w-4 h-4" />Campanhas</TabsTrigger>
            <TabsTrigger value="conjuntos" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2">
              <Layers className="w-4 h-4" />
              Conjuntos
              {selectedCampaignId && <Badge variant="secondary" className="ml-1 text-xs">Filtrado</Badge>}
            </TabsTrigger>
            <TabsTrigger value="anuncios" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2">
              <FileText className="w-4 h-4" />
              Anúncios
              {selectedAdSetId && <Badge variant="secondary" className="ml-1 text-xs">Filtrado</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              className="h-9 w-9"
              onClick={() => setShowColumnDialog(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowUp className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowDown className="w-4 h-4" />
            </Button>
            <Badge className="bg-success text-success-foreground border-0">✓ Todas as vendas trackeadas</Badge>
            {selectedCampaignId && activeTab === 'conjuntos' && (
              <Badge variant="outline" className="gap-1">
                Campanha selecionada
                <button onClick={() => setSelectedCampaignId(null)} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            {selectedAdSetId && activeTab === 'anuncios' && (
              <Badge variant="outline" className="gap-1">
                Conjunto selecionado
                <button onClick={() => setSelectedAdSetId(null)} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Atualizado há {getLastUpdatedText()}</span>
            <Button variant="default" onClick={handleRefresh} disabled={isLoading || isLoadingAdSets || isLoadingAds}>
              {(isLoading || isLoadingAdSets || isLoadingAds) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}Atualizar
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

      {editingCampaignName && (
        <EditCampaignNameDialog
          open={!!editingCampaignName}
          onOpenChange={(open) => !open && setEditingCampaignName(null)}
          currentName={editingCampaignName.name}
          onSave={(name) => updateCampaignName(editingCampaignName.id, name)}
        />
      )}

      <ColumnCustomizationDialog
        open={showColumnDialog}
        onOpenChange={setShowColumnDialog}
        columns={columnConfig}
        onSave={handleSaveColumns}
      />
    </MainLayout>
  );
};

export default Campaigns;
