import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  RefreshCw, Building2, LayoutGrid, Layers, FileText, AlertCircle, Loader2, Pencil, Edit3, Settings, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Maximize2, Minimize2, ShieldAlert, MoreVertical, BarChart3, Copy, Pin, Filter, Trash2, Power, PowerOff
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useMetaCampaigns, Campaign, AdSet, Ad } from '@/hooks/useMetaCampaigns';
import { Link } from 'react-router-dom';
import { useTrialGuard } from '@/hooks/useTrialGuard';
import { EditBudgetDialog } from '@/components/campaigns/EditBudgetDialog';
import { BulkBudgetDialog } from '@/components/campaigns/BulkBudgetDialog';
import { EditAdSetBudgetDialog } from '@/components/campaigns/EditAdSetBudgetDialog';
import { EditCampaignNameDialog } from '@/components/campaigns/EditCampaignNameDialog';
import { ColumnCustomizationDialog, ColumnConfig, ALL_COLUMNS, DEFAULT_VISIBLE } from '@/components/campaigns/ColumnCustomizationDialog';
import { MetricTooltip } from '@/components/campaigns/MetricTooltip';
import { DuplicateCampaignDialog } from '@/components/campaigns/DuplicateCampaignDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSales } from '@/hooks/useSales';
import { useSalesAttribution } from '@/hooks/useSalesAttribution';

type TabType = 'contas' | 'campanhas' | 'conjuntos' | 'anuncios';

const COLUMNS_STORAGE_KEY = 'campaigns-columns-config';

interface ActiveAccount {
  id: string;
  name: string;
  account_id: string;
  is_active: boolean;
}

const Campaigns = () => {
  const { user } = useAuth();
  const { isTrialExpired, daysRemaining } = useTrialGuard();
  const { sales } = useSales();
  const { attribution } = useSalesAttribution();
  const [activeTab, setActiveTab] = useState<TabType>('campanhas');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<string>('today');
  const [bulkEditingBudget, setBulkEditingBudget] = useState<{ ids: string[]; type: 'campaign' | 'adset' } | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingAdSet, setEditingAdSet] = useState<AdSet | null>(null);
  const [editingCampaignName, setEditingCampaignName] = useState<Campaign | null>(null);
  const [editingAdName, setEditingAdName] = useState<Ad | null>(null);
  const [editingAdSetName, setEditingAdSetName] = useState<AdSet | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('any');
  const [filterAccount, setFilterAccount] = useState<string>('any');
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [activeAccounts, setActiveAccounts] = useState<ActiveAccount[]>([]);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [filterSelectedOnly, setFilterSelectedOnly] = useState(false);
  const [duplicatingItem, setDuplicatingItem] = useState<{ id: string; name: string; type: 'campaign' | 'adset' | 'ad' } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string; type: 'campaign' | 'adset' | 'ad' } | null>(null);
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
    updateCampaignBudget, updateAdSetBudget, updateCampaignName, updateAdName, updateAdSetName,
    duplicateItem, deleteItem,
    getLastUpdatedText, hasActiveAccount,
    selectedCampaignIds, selectedAdSetIds, setSelectedCampaignIds, setSelectedAdSetIds
  } = useMetaCampaigns(filterPeriod);

  // Load active accounts
  useEffect(() => {
    const loadActiveAccounts = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('meta_ad_accounts')
        .select('id, name, account_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (data) {
        setActiveAccounts(data);
      }
    };

    loadActiveAccounts();
  }, [user]);

  // Untracked sales: approved/paid sales with no UTM source in raw_data
  const untrackedCount = sales.filter(s => {
    if (s.status !== 'approved' && s.status !== 'paid') return false;
    const raw = s.raw_data as Record<string, unknown> | null;
    if (!raw) return true;
    const src = raw.utm_source || raw.source || raw.utm || raw.fbclid;
    return !src;
  }).length;

  // Clear selected items when switching tabs
  useEffect(() => {
    setSelectedItems([]);
  }, [activeTab]);

  // When switching to conjuntos tab, fetch adsets; when switching to anuncios, fetch ads
  useEffect(() => {
    if (activeTab === 'conjuntos' && hasActiveAccount) {
      fetchAdSets();
    }
    if (activeTab === 'anuncios' && hasActiveAccount) {
      fetchAds();
    }
  }, [activeTab, hasActiveAccount, fetchAdSets, fetchAds]);

  const handleToggleStatus = async (id: string, currentStatus: boolean, type: 'campaign' | 'adset' | 'ad') => {
    setTogglingIds(prev => new Set(prev).add(id));
    if (type === 'campaign') await toggleCampaignStatus(id, !currentStatus);
    else if (type === 'adset') await toggleAdSetStatus(id, !currentStatus);
    else await toggleAdStatus(id, !currentStatus);
    setTogglingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handleSelectCampaign = (campaignId: string) => {
    setSelectedCampaignIds(prev => 
      prev.includes(campaignId) ? prev.filter(id => id !== campaignId) : [...prev, campaignId]
    );
    setSelectedAdSetIds([]); // Reset adset selection when campaign selection changes
  };

  const handleSelectAdSet = (adsetId: string) => {
    setSelectedAdSetIds(prev =>
      prev.includes(adsetId) ? prev.filter(id => id !== adsetId) : [...prev, adsetId]
    );
  };

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const formatPercent = (v: number | null) => v === null ? 'N/A' : `${v.toFixed(2).replace('.', ',')}%`;
  const formatNumber = (v: number) => v.toLocaleString('pt-BR');

  const handleRefresh = async () => {
    await refreshAll();
    const { toast } = await import('sonner');
    toast.success('Dados Atualizados', {
      style: { background: '#16a34a', color: '#ffffff', border: 'none' },
    });
  };

  const handleSaveColumns = (newColumns: ColumnConfig[]) => {
    setColumnConfig(newColumns);
    localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(newColumns));
  };

  if (isTrialExpired) {
    return (
      <MainLayout title="Campanhas">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <ShieldAlert className="w-16 h-16 text-warning mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Período de teste expirado</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Seu período de teste gratuito de 14 dias terminou. Para continuar usando as campanhas e todos os recursos do sistema, assine um dos nossos planos.
          </p>
          <Button asChild className="gradient-primary text-primary-foreground">
            <Link to="/subscription">Ver Planos e Assinar</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

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
    let filtered = selectedCampaignIds.length > 0 
      ? adSets.filter(as => as.campaignId && selectedCampaignIds.includes(as.campaignId)) 
      : adSets;
    return filtered.filter(as => as.spent > 0);
  };

  const getFilteredAds = () => {
    let filtered = selectedAdSetIds.length > 0 
      ? ads.filter(ad => ad.adsetId && selectedAdSetIds.includes(ad.adsetId)) 
      : ads;
    return filtered.filter(ad => ad.spent > 0);
  };

  // Merge webhook sales attribution with Meta Ads data
  const mergeAttribution = (items: (Campaign | AdSet | Ad)[], tab: TabType) => {
    const map = tab === 'campanhas' ? attribution.byCampaignId 
              : tab === 'conjuntos' ? attribution.byAdSetId 
              : attribution.byAdId;
    
    return items.map(item => {
      const attr = map.get(item.id);
      if (!attr) return item;
      
      const sales = attr.sales;
      const revenue = attr.revenue;
      const spent = item.spent;
      const profit = revenue - spent;
      const cpa = sales > 0 ? spent / sales : null;
      const roi = spent > 0 ? revenue / spent : null;
      const roas = spent > 0 ? revenue / spent : null;
      const margin = revenue > 0 ? ((revenue - spent) / revenue) * 100 : null;
      
      return {
        ...item,
        sales,
        revenue,
        profit,
        cpa,
        roi,
        roas,
        margin,
        refundedSales: attr.refundedSales,
        declinedSales: attr.declinedSales,
      };
    });
  };

  const rawDisplayData = mergeAttribution(
    activeTab === 'campanhas' ? campaigns : 
    activeTab === 'conjuntos' ? getFilteredAdSets() : 
    getFilteredAds(),
    activeTab
  );

  // Apply filters
  const filteredData = rawDisplayData.filter(item => {
    // Name filter
    if (filterName && !item.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    // Status filter
    if (filterStatus === 'active' && !item.status) return false;
    if (filterStatus === 'paused' && item.status) return false;
    // Account filter (campaigns only)
    if (filterAccount !== 'any' && activeTab === 'campanhas' && 'accountId' in item && (item as Campaign).accountId !== filterAccount) return false;
    if (filterAccount !== 'any' && activeTab === 'conjuntos' && 'accountId' in item && (item as AdSet).accountId !== filterAccount) return false;
    return true;
  });

  // Apply pinning: pinned items first
  const sortedWithPins = [...filteredData].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id);
    const bPinned = pinnedIds.has(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  // Apply filter selected only
  const displayData = filterSelectedOnly && selectedItems.length > 0
    ? sortedWithPins.filter(item => selectedItems.includes(item.id))
    : sortedWithPins;

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
                {campaign.budgetType && <span className="text-xs block">{campaign.budgetType === 'daily' ? 'Diário' : 'Total'}</span>}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                if (selectedItems.length > 1 && selectedItems.includes(campaign.id)) {
                  setBulkEditingBudget({ ids: selectedItems, type: 'campaign' });
                } else {
                  setEditingCampaign(campaign);
                }
              }}>
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
                {adset.budgetType && <span className="text-xs block">{adset.budgetType === 'daily' ? 'Diário' : 'Total'}</span>}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                if (selectedItems.length > 1 && selectedItems.includes(adset.id)) {
                  setBulkEditingBudget({ ids: selectedItems, type: 'adset' });
                } else {
                  setEditingAdSet(adset);
                }
              }}>
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
        return (
          <span className={cn(
            "font-medium", 
            item.profit > 0 ? "text-success" : item.profit < 0 ? "text-[hsl(0,100%,60%)]" : ""
          )}>
            {formatCurrency(item.profit)}
          </span>
        );
      case 'roi':
        return (
          <span className={cn(
            "font-medium", 
            item.roi !== null && item.roi > 1 ? "text-primary" : item.roi !== null && item.roi < 1 ? "text-[hsl(0,100%,60%)]" : ""
          )}>
            {item.roi !== null ? item.roi.toFixed(2) : 'N/A'}
          </span>
        );
      case 'margem':
        return (
          <span className={cn(
            "font-medium", 
            item.margin !== null && item.margin > 0 ? "text-success" : item.margin !== null && item.margin < 0 ? "text-[hsl(0,100%,60%)]" : ""
          )}>
            {formatPercent(item.margin)}
          </span>
        );
      case 'vendasRecusadas':
        return <span className="text-[hsl(0,100%,60%)]">{item.declinedSales}</span>;
      case 'vendasReemb':
        return <span className="text-[hsl(0,100%,60%)]">{item.refundedSales}</span>;
      case 'con':
        // Taxa de conexão = Vis. de pág. / cliques (%)
        const conRate = item.clicks > 0 ? (item.pageViews / item.clicks) * 100 : null;
        return formatPercent(conRate);
      case 'icr':
        // Taxa de ICs = ICs / vis. de pág. (%)
        const icrRate = item.pageViews > 0 ? (item.initiatedCheckout / item.pageViews) * 100 : null;
        return formatPercent(icrRate);
      case 'vendasTotais':
        return item.sales + item.declinedSales + item.refundedSales;
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

  // Render Contas tab with active accounts
  const renderContasTable = () => {
    if (activeAccounts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Building2 className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhuma conta ativa encontrada</p>
        </div>
      );
    }

    // Helper to calculate metrics for a specific account
    const getAccountMetrics = (accountId: string) => {
      const acctCampaigns = campaigns.filter(c => c.accountId === accountId);
      const spent = acctCampaigns.reduce((sum, c) => sum + c.spent, 0);
      const sales = acctCampaigns.reduce((sum, c) => sum + c.sales, 0);
      const revenue = acctCampaigns.reduce((sum, c) => sum + c.revenue, 0);
      const profit = revenue - spent;
      const impressions = acctCampaigns.reduce((sum, c) => sum + c.impressions, 0);
      const clicks = acctCampaigns.reduce((sum, c) => sum + c.clicks, 0);
      const pageViews = acctCampaigns.reduce((sum, c) => sum + c.pageViews, 0);
      const ic = acctCampaigns.reduce((sum, c) => sum + c.initiatedCheckout, 0);
      const cpa = sales > 0 ? spent / sales : null;
      const roi = spent > 0 ? revenue / spent : null;
      const cpm = impressions > 0 ? (spent / impressions) * 1000 : null;
      const cpc = clicks > 0 ? spent / clicks : null;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
      const freqCampaigns = acctCampaigns.filter(c => c.frequency !== null);
      const frequency = freqCampaigns.length > 0 
        ? freqCampaigns.reduce((sum, c) => sum + (c.frequency || 0), 0) / freqCampaigns.length 
        : null;
      const cpv = pageViews > 0 ? spent / pageViews : null;
      const cpi = ic > 0 ? spent / ic : null;
      const convCheck = ic > 0 ? (sales / ic) * 100 : null;
      const conRate = clicks > 0 ? (pageViews / clicks) * 100 : null;
      const icrRate = pageViews > 0 ? (ic / pageViews) * 100 : null;
      const margin = revenue > 0 ? ((revenue - spent) / revenue) * 100 : null;
      const roas = spent > 0 ? revenue / spent : null;
      return { spent, sales, revenue, profit, impressions, clicks, pageViews, ic, cpa, roi, cpm, cpc, ctr, frequency, cpv, cpi, convCheck, conRate, icrRate, margin, roas };
    };

    // Calculate totals from ALL campaigns for summary row
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalSales = campaigns.reduce((sum, c) => sum + c.sales, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const totalProfit = totalRevenue - totalSpent;
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalPageViews = campaigns.reduce((sum, c) => sum + c.pageViews, 0);
    const totalIC = campaigns.reduce((sum, c) => sum + c.initiatedCheckout, 0);
    const avgCPA = totalSales > 0 ? totalSpent / totalSales : null;
    const avgROI = totalSpent > 0 ? totalRevenue / totalSpent : null;
    const avgCPM = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : null;
    const avgCPC = totalClicks > 0 ? totalSpent / totalClicks : null;
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null;
    const avgFrequency = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + (c.frequency || 0), 0) / campaigns.filter(c => c.frequency !== null).length 
      : null;
    const avgCPV = totalPageViews > 0 ? totalSpent / totalPageViews : null;
    const avgCPI = totalIC > 0 ? totalSpent / totalIC : null;
    const convCheck = totalIC > 0 ? (totalSales / totalIC) * 100 : null;
    const conRate = totalClicks > 0 ? (totalPageViews / totalClicks) * 100 : null;
    const icrRate = totalPageViews > 0 ? (totalIC / totalPageViews) * 100 : null;
    const margin = totalRevenue > 0 ? ((totalRevenue - totalSpent) / totalRevenue) * 100 : null;
    const roas = totalSpent > 0 ? totalRevenue / totalSpent : null;

    return (
      <div className="w-full overflow-x-auto whitespace-nowrap">
        <Table className="border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[48px] sticky left-0 bg-[#384157] z-20 border-r border-border"><Checkbox /></TableHead>
              <TableHead className="w-[60px] text-center font-semibold sticky left-[48px] bg-[#384157] z-20 border-r border-border">STATUS</TableHead>
              <TableHead className="font-semibold sticky left-[108px] bg-[#384157] z-20 min-w-[200px] border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.3)]">CONTA</TableHead>
              {visibleColumns.map((col, index) => (
                <TableHead 
                  key={col.id} 
                  className={cn(
                    "text-center font-semibold border-r border-border",
                    index === visibleColumns.length - 1 && "border-r-0"
                  )}
                >
                  <MetricTooltip metricId={col.id} label={getColumnLabel(col.id)} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeAccounts.map((account) => {
              const m = getAccountMetrics(account.account_id);
              return (
              <TableRow key={account.id} className="border-b border-border">
                <TableCell className="w-[48px] sticky left-0 bg-card z-10 border-r border-b border-border">
                  <Checkbox />
                </TableCell>
                <TableCell className="w-[60px] text-center sticky left-[48px] bg-card z-10 border-r border-b border-border">
                  <Switch checked={account.is_active} disabled />
                </TableCell>
                <TableCell className="font-medium sticky left-[108px] bg-card z-10 min-w-[200px] border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.3)]">
                  {account.name}
                </TableCell>
                {visibleColumns.map((col, index) => {
                  const mockItem = {
                    spent: m.spent,
                    sales: m.sales,
                    revenue: m.revenue,
                    profit: m.profit,
                    impressions: m.impressions,
                    clicks: m.clicks,
                    pageViews: m.pageViews,
                    initiatedCheckout: m.ic,
                    cpa: m.cpa,
                    roi: m.roi,
                    cpm: m.cpm,
                    cpc: m.cpc,
                    ctr: m.ctr,
                    frequency: m.frequency,
                    cpv: m.cpv,
                    costPerInitiatedCheckout: m.cpi,
                    checkoutConversion: m.convCheck,
                    margin: m.margin,
                    roas: m.roas,
                    hookPlayRate: null,
                    holdRate: null,
                    ctaClicks: 0,
                    refundedSales: 0,
                    declinedSales: 0,
                    budget: null,
                    budgetType: null,
                  } as unknown as Campaign;

                  return (
                    <TableCell 
                      key={col.id} 
                      className={cn(
                        "text-center border-r border-border",
                        index === visibleColumns.length - 1 && "border-r-0"
                      )}
                    >
                      {getColumnValue(mockItem, col.id)}
                    </TableCell>
                  );
                })}
              </TableRow>
              );
            })}
            {/* Summary row */}
            <TableRow className="border-border font-semibold">
              <TableCell className="w-[48px] sticky left-0 bg-secondary z-10 border-r border-border" />
              <TableCell className="w-[60px] sticky left-[48px] bg-secondary z-10 border-r border-border" />
              <TableCell className="sticky left-[108px] bg-secondary z-10 min-w-[200px] border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.3)]">
                {activeAccounts.length} Conta{activeAccounts.length > 1 ? 's' : ''}
              </TableCell>
              {visibleColumns.map((col, index) => {
                const mockItem = {
                  spent: totalSpent,
                  sales: totalSales,
                  revenue: totalRevenue,
                  profit: totalProfit,
                  impressions: totalImpressions,
                  clicks: totalClicks,
                  pageViews: totalPageViews,
                  initiatedCheckout: totalIC,
                  cpa: avgCPA,
                  roi: avgROI,
                  cpm: avgCPM,
                  cpc: avgCPC,
                  ctr: avgCTR,
                  frequency: avgFrequency,
                  cpv: avgCPV,
                  costPerInitiatedCheckout: avgCPI,
                  checkoutConversion: convCheck,
                  margin: margin,
                  roas: roas,
                  hookPlayRate: null,
                  holdRate: null,
                  ctaClicks: 0,
                  refundedSales: 0,
                  declinedSales: 0,
                  budget: null,
                  budgetType: null,
                } as unknown as Campaign;

                  return (
                    <TableCell 
                      key={col.id} 
                      className={cn(
                        "text-center border-r border-b border-border bg-secondary",
                        index === visibleColumns.length - 1 && "border-r-0"
                      )}
                    >
                    {getColumnValue(mockItem, col.id)}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderTable = () => {
    // Handle Contas tab separately
    if (activeTab === 'contas') {
      return renderContasTable();
    }

    if (currentLoading && displayData.length === 0) {
      return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /><span className="ml-3 text-muted-foreground">Carregando...</span></div>;
    }
    if (displayData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <LayoutGrid className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {activeTab === 'conjuntos' && selectedCampaignIds.length > 0 
              ? 'Nenhum conjunto encontrado para as campanhas selecionadas' 
              : activeTab === 'anuncios' && selectedAdSetIds.length > 0
              ? 'Nenhum anúncio encontrado para os conjuntos selecionados'
              : 'Nenhum item com gastos hoje'}
          </p>
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto whitespace-nowrap">
        <Table className="border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[48px] sticky left-0 bg-[#384157] z-20 border-r border-border">
                <Checkbox 
                  checked={displayData.length > 0 && (
                    activeTab === 'campanhas' ? selectedCampaignIds.length === displayData.length :
                    activeTab === 'conjuntos' ? selectedAdSetIds.length === displayData.length :
                    selectedItems.length === displayData.length
                  )}
                  onCheckedChange={(checked) => {
                    if (activeTab === 'campanhas') {
                      setSelectedCampaignIds(checked ? displayData.map(item => item.id) : []);
                      setSelectedAdSetIds([]);
                    } else if (activeTab === 'conjuntos') {
                      setSelectedAdSetIds(checked ? displayData.map(item => item.id) : []);
                    } else {
                      setSelectedItems(checked ? displayData.map(item => item.id) : []);
                    }
                  }}
                />
              </TableHead>
              <TableHead className="w-[60px] text-center font-semibold sticky left-[48px] bg-[#384157] z-20 border-r-2 border-white/20">STATUS</TableHead>
              <TableHead className="font-semibold sticky left-[108px] bg-[#384157] z-20 min-w-[200px] border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.3)]">
                {activeTab === 'campanhas' ? 'CAMPANHA' : activeTab === 'conjuntos' ? 'CONJUNTO' : 'ANÚNCIO'}
              </TableHead>
              <TableHead className="w-[48px] text-center font-semibold border-r border-border"></TableHead>
              {visibleColumns.map((col, index) => (
                <TableHead 
                  key={col.id} 
                  className={cn(
                    "text-center font-semibold border-r border-border",
                    index === visibleColumns.length - 1 && "border-r-0"
                  )}
                >
                  <MetricTooltip metricId={col.id} label={getColumnLabel(col.id)} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((item) => {
              const isSelected = activeTab === 'campanhas' 
                ? selectedCampaignIds.includes(item.id)
                : activeTab === 'conjuntos'
                ? selectedAdSetIds.includes(item.id)
                : selectedItems.includes(item.id);
              
              return (
                <TableRow 
                  key={item.id} 
                  className={cn(
                    "border-b border-border cursor-pointer",
                    isSelected && "bg-primary/10"
                  )}
                  onClick={() => {
                    if (activeTab === 'campanhas') handleSelectCampaign(item.id);
                    else if (activeTab === 'conjuntos') handleSelectAdSet(item.id);
                  }}
                >
                  <TableCell className={cn("w-[48px] sticky left-0 z-10 border-r border-b border-border", isSelected ? "bg-row-selected" : "bg-card")}>
                    <Checkbox 
                      checked={isSelected} 
                      onCheckedChange={() => {
                        if (activeTab === 'campanhas') {
                          handleSelectCampaign(item.id);
                        } else if (activeTab === 'conjuntos') {
                          handleSelectAdSet(item.id);
                        } else {
                          setSelectedItems(prev => 
                            prev.includes(item.id) 
                              ? prev.filter(id => id !== item.id) 
                              : [...prev, item.id]
                          );
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className={cn("w-[60px] text-center sticky left-[48px] z-10 border-r-2 border-white/20 border-b border-border", isSelected ? "bg-row-selected" : "bg-card")} onClick={(e) => e.stopPropagation()}>
                    {togglingIds.has(item.id) ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                      <Switch checked={item.status} onCheckedChange={() => handleToggleStatus(item.id, item.status, activeTab === 'campanhas' ? 'campaign' : activeTab === 'conjuntos' ? 'adset' : 'ad')} />
                    )}
                  </TableCell>
                  <TableCell className={cn("font-medium sticky left-[108px] z-10 min-w-[200px] border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.3)]", isSelected ? "bg-row-selected" : "bg-card")}>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[180px]">{item.name}</span>
                      {(activeTab === 'campanhas' || activeTab === 'conjuntos' || activeTab === 'anuncios') && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeTab === 'campanhas') {
                              setEditingCampaignName(item as Campaign);
                            } else if (activeTab === 'conjuntos') {
                              setEditingAdSetName(item as AdSet);
                            } else {
                              setEditingAdName(item as Ad);
                            }
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-[48px] text-center border-r border-b border-border" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-52">
                        <DropdownMenuItem className="gap-2">
                          <BarChart3 className="w-4 h-4" /> Gráfico comparativo
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => {
                          const type = activeTab === 'campanhas' ? 'campaign' : activeTab === 'conjuntos' ? 'adset' : 'ad';
                          setDuplicatingItem({ id: item.id, name: item.name, type });
                        }}>
                          <Copy className="w-4 h-4" /> Duplicar {activeTab === 'campanhas' ? 'campanha' : activeTab === 'conjuntos' ? 'conjunto' : 'anúncio'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2" onClick={() => handleToggleStatus(item.id, item.status, activeTab === 'campanhas' ? 'campaign' : activeTab === 'conjuntos' ? 'adset' : 'ad')}>
                          {item.status ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          {item.status ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        {(activeTab === 'campanhas' || activeTab === 'conjuntos') && (
                          <DropdownMenuItem className="gap-2" onClick={() => {
                            if (selectedItems.length > 1 && selectedItems.includes(item.id)) {
                              setBulkEditingBudget({ ids: selectedItems, type: activeTab === 'campanhas' ? 'campaign' : 'adset' });
                            } else if (activeTab === 'campanhas') {
                              setEditingCampaign(item as Campaign);
                            } else {
                              setEditingAdSet(item as AdSet);
                            }
                          }}>
                            <Pencil className="w-4 h-4" /> Alterar orçamento {selectedItems.length > 1 && selectedItems.includes(item.id) ? `(${selectedItems.length})` : ''}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="gap-2" onClick={() => {
                          setPinnedIds(prev => {
                            const next = new Set(prev);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            return next;
                          });
                          import('sonner').then(({ toast: t }) => {
                            t.success(pinnedIds.has(item.id) ? 'Item desafixado' : 'Item fixado', { style: { background: '#16a34a', color: '#ffffff', border: 'none' } });
                          });
                        }}>
                          <Pin className={cn("w-4 h-4", pinnedIds.has(item.id) && "text-primary")} /> {pinnedIds.has(item.id) ? 'Desafixar' : 'Fixar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => {
                          navigator.clipboard.writeText(item.id);
                          import('sonner').then(({ toast: t }) => {
                            t.success('ID copiado', { style: { background: '#16a34a', color: '#ffffff', border: 'none' } });
                          });
                        }}>
                          <Copy className="w-4 h-4" /> Copiar ID
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => setFilterSelectedOnly(!filterSelectedOnly)}>
                          <Filter className="w-4 h-4" /> {filterSelectedOnly ? 'Mostrar todas' : 'Filtrar selecionadas'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => {
                          const type = activeTab === 'campanhas' ? 'campaign' : activeTab === 'conjuntos' ? 'adset' : 'ad';
                          setDeletingItem({ id: item.id, name: item.name, type });
                        }}>
                          <Trash2 className="w-4 h-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  {visibleColumns.map((col, index) => (
                    <TableCell 
                      key={col.id} 
                      className={cn(
                        "text-center border-r border-b border-border",
                        index === visibleColumns.length - 1 && "border-r-0"
                      )}
                    >
                      {getColumnValue(item, col.id)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            {/* Summary totals row */}
            {displayData.length > 0 && (() => {
              const totalSpent = displayData.reduce((sum, i) => sum + i.spent, 0);
              const totalSales = displayData.reduce((sum, i) => sum + i.sales, 0);
              const totalRevenue = displayData.reduce((sum, i) => sum + i.revenue, 0);
              const totalProfit = totalRevenue - totalSpent;
              const totalImpressions = displayData.reduce((sum, i) => sum + i.impressions, 0);
              const totalClicks = displayData.reduce((sum, i) => sum + i.clicks, 0);
              const totalPageViews = displayData.reduce((sum, i) => sum + i.pageViews, 0);
              const totalIC = displayData.reduce((sum, i) => sum + i.initiatedCheckout, 0);
              const totalCtaClicks = displayData.reduce((sum, i) => sum + i.ctaClicks, 0);
              const totalReach = displayData.reduce((sum, i) => sum + i.reach, 0);
              const avgCPA = totalSales > 0 ? totalSpent / totalSales : null;
              const avgROI = totalSpent > 0 ? totalRevenue / totalSpent : null;
              const avgCPM = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : null;
              const avgCPC = totalClicks > 0 ? totalSpent / totalClicks : null;
              const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null;
              const avgFreq = totalReach > 0 ? totalImpressions / totalReach : null;
              const avgCPV = totalPageViews > 0 ? totalSpent / totalPageViews : null;
              const avgCPI = totalIC > 0 ? totalSpent / totalIC : null;
              const convCheck = totalIC > 0 ? (totalSales / totalIC) * 100 : null;
              const margin = totalRevenue > 0 ? ((totalRevenue - totalSpent) / totalRevenue) * 100 : null;
              const roas = totalSpent > 0 ? totalRevenue / totalSpent : null;
              const totalBudget = displayData.reduce((sum, i) => sum + ((i as any).budget || 0), 0);
              const totalDeclined = displayData.reduce((sum, i) => sum + i.declinedSales, 0);
              const totalRefunded = displayData.reduce((sum, i) => sum + i.refundedSales, 0);

              const summaryItem = {
                spent: totalSpent, sales: totalSales, revenue: totalRevenue, profit: totalProfit,
                impressions: totalImpressions, clicks: totalClicks, pageViews: totalPageViews,
                initiatedCheckout: totalIC, cpa: avgCPA, roi: avgROI, cpm: avgCPM, cpc: avgCPC,
                ctr: avgCTR, frequency: avgFreq, cpv: avgCPV, costPerInitiatedCheckout: avgCPI,
                checkoutConversion: convCheck, margin, roas, hookPlayRate: null, holdRate: null,
                ctaClicks: totalCtaClicks, refundedSales: totalRefunded, declinedSales: totalDeclined,
                budget: totalBudget || null, budgetType: null as any, reach: totalReach,
              } as unknown as Campaign;

              const itemLabel = activeTab === 'campanhas' 
                ? `Total: ${displayData.length} CAMPANHA${displayData.length > 1 ? 'S' : ''}`
                : activeTab === 'conjuntos'
                ? `Total: ${displayData.length} CONJUNTO${displayData.length > 1 ? 'S' : ''}`
                : `Total: ${displayData.length} ANÚNCIO${displayData.length > 1 ? 'S' : ''}`;

              return (
                <TableRow className="border-b border-border font-semibold">
                  <TableCell className="w-[48px] sticky left-0 bg-secondary z-10 border-r border-border" />
                  <TableCell className="w-[60px] text-center sticky left-[48px] bg-secondary z-10 border-r-2 border-white/20" />
                  <TableCell className="font-semibold sticky left-[108px] bg-secondary z-10 min-w-[200px] border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.3)] text-xs">
                    {itemLabel}
                  </TableCell>
                  <TableCell className="w-[48px] bg-secondary border-r border-border" />
                  {visibleColumns.map((col, index) => (
                    <TableCell 
                      key={col.id} 
                       className={cn(
                        "text-center border-r border-border bg-secondary",
                        index === visibleColumns.length - 1 && "border-r-0"
                      )}
                    >
                      {getColumnValue(summaryItem, col.id)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })()}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderDialogs = () => (
    <>
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
      {editingAdName && (
        <EditCampaignNameDialog
          open={!!editingAdName}
          onOpenChange={(open) => !open && setEditingAdName(null)}
          currentName={editingAdName.name}
          onSave={(name) => updateAdName(editingAdName.id, name)}
        />
      )}
      {editingAdSetName && (
        <EditCampaignNameDialog
          open={!!editingAdSetName}
          onOpenChange={(open) => !open && setEditingAdSetName(null)}
          currentName={editingAdSetName.name}
          onSave={(name) => updateAdSetName(editingAdSetName.id, name)}
        />
      )}
      <ColumnCustomizationDialog
        open={showColumnDialog}
        onOpenChange={setShowColumnDialog}
        columns={columnConfig}
        onSave={handleSaveColumns}
      />
      {duplicatingItem && (
        <DuplicateCampaignDialog
          open={!!duplicatingItem}
          onOpenChange={(open) => !open && setDuplicatingItem(null)}
          itemName={duplicatingItem.name}
          itemType={duplicatingItem.type === 'campaign' ? 'campanha' : duplicatingItem.type === 'adset' ? 'conjunto' : 'anúncio'}
          accounts={activeAccounts}
          currentAccountId={activeAccounts[0]?.account_id}
          onDuplicate={async (_targetAccountId, copies, statusOption, scheduledDate) => {
            return await duplicateItem(duplicatingItem.id, duplicatingItem.type, copies, statusOption, scheduledDate);
          }}
        />
      )}
      {deletingItem && (
        <Dialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir "{deletingItem.name}"? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingItem(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={async () => {
                await deleteItem(deletingItem.id, deletingItem.type);
                setDeletingItem(null);
              }}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {bulkEditingBudget && (
        <BulkBudgetDialog
          open={!!bulkEditingBudget}
          onOpenChange={(open) => !open && setBulkEditingBudget(null)}
          itemCount={bulkEditingBudget.ids.length}
          entityType={bulkEditingBudget.type}
          onSave={async (budget, budgetType) => {
            const results = await Promise.all(
              bulkEditingBudget.ids.map(id => 
                bulkEditingBudget.type === 'campaign' 
                  ? updateCampaignBudget(id, budget, budgetType)
                  : updateAdSetBudget(id, budget, budgetType)
              )
            );
            return results.every(r => r);
          }}
        />
      )}
    </>
  );

  const pageContent = (
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="bg-card border border-border h-auto p-0 w-full grid grid-cols-4">
            <TabsTrigger value="contas" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2">
              <Building2 className="w-4 h-4" />
              Contas
            </TabsTrigger>
            <TabsTrigger value="campanhas" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2">
              <Layers className="w-4 h-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="conjuntos" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2">
              <LayoutGrid className="w-4 h-4" />
              Conjuntos
              {selectedCampaignIds.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">Filtrado ({selectedCampaignIds.length})</Badge>}
            </TabsTrigger>
            <TabsTrigger value="anuncios" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 gap-2">
              <FileText className="w-4 h-4" />
              Anúncios
              {selectedAdSetIds.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">Filtrado ({selectedAdSetIds.length})</Badge>}
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
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setShowFilters(!showFilters)}
              title={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            >
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            {untrackedCount > 0 ? (
              <Badge className="bg-warning text-warning-foreground border-0 animate-pulse">
                ⚠ {untrackedCount} {untrackedCount === 1 ? 'Venda não trackeada' : 'Vendas não trackeadas'}
              </Badge>
            ) : (
              <Badge className="bg-success text-success-foreground border-0">✓ Todas as vendas trackeadas</Badge>
            )}
            {selectedCampaignIds.length > 0 && activeTab === 'conjuntos' && (
              <Badge variant="outline" className="gap-1">
                {selectedCampaignIds.length} campanha{selectedCampaignIds.length > 1 ? 's' : ''} selecionada{selectedCampaignIds.length > 1 ? 's' : ''}
                <button onClick={() => setSelectedCampaignIds([])} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            {selectedAdSetIds.length > 0 && activeTab === 'anuncios' && (
              <Badge variant="outline" className="gap-1">
                {selectedAdSetIds.length} conjunto{selectedAdSetIds.length > 1 ? 's' : ''} selecionado{selectedAdSetIds.length > 1 ? 's' : ''}
                <button onClick={() => setSelectedAdSetIds([])} className="ml-1 hover:text-destructive">×</button>
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

        {/* Filter panel */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 rounded-lg border border-border bg-card animate-fade-in">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {activeTab === 'campanhas' ? 'Nome da Campanha' : activeTab === 'conjuntos' ? 'Nome do Conjunto' : 'Nome do Anúncio'}
              </label>
              <Input 
                placeholder="Filtrar por nome" 
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Período de Visualização</label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="last_7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="last_30d">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Conta de Anúncio</label>
              <Select value={filterAccount} onValueChange={setFilterAccount}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  {activeAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.account_id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Produto</label>
              <Select defaultValue="any">
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border bg-card overflow-hidden">{renderTable()}</div>
      </div>
  );

  if (isFullscreen) {
    return (
      <div className="h-screen bg-background overflow-y-auto p-6">
        {pageContent}
        {/* Dialogs rendered outside layout */}
        {renderDialogs()}
      </div>
    );
  }

  return (
    <MainLayout title="Campanhas">
      {pageContent}
      {renderDialogs()}
    </MainLayout>
  );

};

export default Campaigns;
