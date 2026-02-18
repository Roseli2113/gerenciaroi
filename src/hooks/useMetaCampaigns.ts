import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CampaignInsight {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  impressions: string;
  clicks: string;
  cpc: string;
  cpm: string;
  ctr: string;
  reach: string;
  frequency?: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
  video_p25_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p50_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p75_watched_actions?: Array<{ action_type: string; value: string }>;
  video_p100_watched_actions?: Array<{ action_type: string; value: string }>;
}

interface MetaCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
  updated_time: string;
}

interface MetaAdSet {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  daily_budget?: string;
  lifetime_budget?: string;
  optimization_goal?: string;
  campaign_id?: string;
}

interface MetaAd {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  adset_id?: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: boolean;
  rawStatus: string;
  budget: number | null;
  budgetType: 'daily' | 'total' | null;
  spent: number;
  sales: number;
  revenue: number;
  profit: number;
  cpa: number | null;
  roi: number | null;
  // New metrics
  impressions: number;
  clicks: number;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  reach: number;
  frequency: number | null;
  margin: number | null;
  pageViews: number;
  cpv: number | null;
  roas: number | null;
  hookPlayRate: number | null;
  holdRate: number | null;
  ctaClicks: number;
  initiatedCheckout: number;
  costPerInitiatedCheckout: number | null;
  checkoutConversion: number | null;
  refundedSales: number;
  declinedSales: number;
}

export interface AdSet {
  id: string;
  name: string;
  status: boolean;
  rawStatus: string;
  budget: number | null;
  budgetType: 'daily' | 'total' | null;
  optimizationGoal: string | null;
  campaignId: string | null;
  spent: number;
  sales: number;
  revenue: number;
  profit: number;
  cpa: number | null;
  roi: number | null;
  impressions: number;
  clicks: number;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  reach: number;
  frequency: number | null;
  margin: number | null;
  pageViews: number;
  cpv: number | null;
  roas: number | null;
  hookPlayRate: number | null;
  holdRate: number | null;
  ctaClicks: number;
  initiatedCheckout: number;
  costPerInitiatedCheckout: number | null;
  checkoutConversion: number | null;
  refundedSales: number;
  declinedSales: number;
}

export interface Ad {
  id: string;
  name: string;
  status: boolean;
  rawStatus: string;
  adsetId: string | null;
  spent: number;
  sales: number;
  revenue: number;
  profit: number;
  cpa: number | null;
  roi: number | null;
  impressions: number;
  clicks: number;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  reach: number;
  frequency: number | null;
  margin: number | null;
  pageViews: number;
  cpv: number | null;
  roas: number | null;
  hookPlayRate: number | null;
  holdRate: number | null;
  ctaClicks: number;
  initiatedCheckout: number;
  costPerInitiatedCheckout: number | null;
  checkoutConversion: number | null;
  refundedSales: number;
  declinedSales: number;
}

function parseMetrics(insight: CampaignInsight | null) {
  if (!insight) {
    return {
      spent: 0,
      impressions: 0,
      clicks: 0,
      cpc: null,
      cpm: null,
      ctr: null,
      reach: 0,
      frequency: null,
      sales: 0,
      revenue: 0,
      profit: 0,
      cpa: null,
      roi: null,
      margin: null,
      pageViews: 0,
      cpv: null,
      roas: null,
      hookPlayRate: null,
      holdRate: null,
      ctaClicks: 0,
      initiatedCheckout: 0,
      costPerInitiatedCheckout: null,
      checkoutConversion: null,
      refundedSales: 0,
      declinedSales: 0,
    };
  }

  const spent = parseFloat(insight.spend) || 0;
  const impressions = parseInt(insight.impressions) || 0;
  const clicks = parseInt(insight.clicks) || 0;
  const cpc = insight.cpc ? parseFloat(insight.cpc) : null;
  const cpm = insight.cpm ? parseFloat(insight.cpm) : null;
  const ctr = insight.ctr ? parseFloat(insight.ctr) : null;
  const reach = parseInt(insight.reach) || 0;
  const frequency = insight.frequency ? parseFloat(insight.frequency) : (reach > 0 ? impressions / reach : null);

  // Get purchase/conversion actions
  const purchases = insight.actions?.find(
    a => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
  );
  const sales = purchases ? parseInt(purchases.value) : 0;

  // Get purchase value
  const purchaseValue = insight.action_values?.find(
    a => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
  );
  const revenue = purchaseValue ? parseFloat(purchaseValue.value) : 0;

  // Page views
  const pageViewAction = insight.actions?.find(
    a => a.action_type === 'landing_page_view'
  );
  const pageViews = pageViewAction ? parseInt(pageViewAction.value) : 0;

  // Initiated checkout
  const initiatedCheckoutAction = insight.actions?.find(
    a => a.action_type === 'initiate_checkout' || a.action_type === 'omni_initiated_checkout'
  );
  const initiatedCheckout = initiatedCheckoutAction ? parseInt(initiatedCheckoutAction.value) : 0;

  // Link clicks (CTA)
  const linkClickAction = insight.actions?.find(
    a => a.action_type === 'link_click'
  );
  const ctaClicks = linkClickAction ? parseInt(linkClickAction.value) : 0;

  // Video metrics for hook play rate and hold rate
  const videoPlays = insight.video_p25_watched_actions?.find(a => a.action_type === 'video_view')?.value;
  const video100 = insight.video_p100_watched_actions?.find(a => a.action_type === 'video_view')?.value;
  const hookPlayRate = impressions > 0 && videoPlays ? (parseInt(videoPlays) / impressions) * 100 : null;
  const holdRate = videoPlays && video100 ? (parseInt(video100) / parseInt(videoPlays)) * 100 : null;

  // Calculate metrics
  const profit = revenue - spent;
  const cpa = sales > 0 ? spent / sales : null;
  const roi = spent > 0 ? revenue / spent : null;
  const margin = revenue > 0 ? ((revenue - spent) / revenue) * 100 : null;
  const cpv = pageViews > 0 ? spent / pageViews : null;
  const roas = spent > 0 ? revenue / spent : null;
  const costPerInitiatedCheckout = initiatedCheckout > 0 ? spent / initiatedCheckout : null;
  const checkoutConversion = initiatedCheckout > 0 && sales > 0 ? (sales / initiatedCheckout) * 100 : null;

  return {
    spent,
    impressions,
    clicks,
    cpc,
    cpm,
    ctr,
    reach,
    frequency,
    sales,
    revenue,
    profit,
    cpa,
    roi,
    margin,
    pageViews,
    cpv,
    roas,
    hookPlayRate,
    holdRate,
    ctaClicks,
    initiatedCheckout,
    costPerInitiatedCheckout,
    checkoutConversion,
    refundedSales: 0, // These would come from webhooks
    declinedSales: 0,
  };
}

// Sort function: Active first, then inactive, sorted by impressions (with impressions first)
function sortByStatusAndImpressions<T extends { status: boolean; impressions: number; spent: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // First: items with spent > 0 and status active on top
    if (a.status !== b.status) return a.status ? -1 : 1;
    // Then by spent (higher first)
    return b.spent - a.spent;
  });
}

// Filter items with impressions or spent > 0 (show items with activity)
// Note: Setting to false to show ALL items when there are many duplicated ad sets
function filterWithImpressions<T extends { impressions: number; spent: number }>(items: T[], showAll = false): T[] {
  if (showAll) return items;
  return items.filter(item => item.impressions > 0 || item.spent > 0);
}

export function useMetaCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAdSets, setIsLoadingAdSets] = useState(false);
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedAdSetId, setSelectedAdSetId] = useState<string | null>(null);

  // Load active account and access token
  useEffect(() => {
    const loadActiveAccount = async () => {
      if (!user) return;

      try {
        const { data: connection } = await supabase
          .from('meta_connections')
          .select('access_token')
          .eq('user_id', user.id)
          .maybeSingle();

        if (connection) {
          setAccessToken(connection.access_token);
        }

        const { data: activeAccount } = await supabase
          .from('meta_ad_accounts')
          .select('account_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (activeAccount) {
          setActiveAccountId(activeAccount.account_id);
        }
      } catch (err) {
        console.error('Error loading active account:', err);
      }
    };

    loadActiveAccount();
  }, [user]);

  const fetchCampaigns = useCallback(async () => {
    if (!accessToken || !activeAccountId) return;

    setIsLoading(true);
    try {
      const { data: campaignsData, error: campaignsError } = await supabase.functions.invoke('meta-ads', {
        body: { action: 'get-campaigns', accessToken, adAccountId: activeAccountId }
      });

      if (campaignsError || campaignsData?.error) {
        throw new Error(campaignsData?.error || campaignsError?.message);
      }

      const { data: insightsData } = await supabase.functions.invoke('meta-ads', {
        body: { action: 'get-campaign-insights', accessToken, adAccountId: activeAccountId, dateRange: 'today' }
      });

      const insightsMap = new Map<string, CampaignInsight>();
      if (insightsData?.insights) {
        insightsData.insights.forEach((insight: CampaignInsight) => {
          insightsMap.set(insight.campaign_id, insight);
        });
      }

      const mergedCampaigns: Campaign[] = (campaignsData.campaigns || []).map((campaign: MetaCampaign) => {
        const insight = insightsMap.get(campaign.id);
        const metrics = parseMetrics(insight || null);
        
        const dailyBudget = campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : null;
        const lifetimeBudget = campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) / 100 : null;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status === 'ACTIVE',
          rawStatus: campaign.status,
          budget: dailyBudget || lifetimeBudget,
          budgetType: dailyBudget ? 'daily' : lifetimeBudget ? 'total' : null,
          ...metrics
        };
      });

      // Filter and sort: only show campaigns with impressions/spent, active first
      // Keep filtering for campaigns to avoid showing empty ones
      const filteredAndSorted = sortByStatusAndImpressions(filterWithImpressions(mergedCampaigns));
      setCampaigns(filteredAndSorted);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar campanhas');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeAccountId]);

  useEffect(() => {
    if (accessToken && activeAccountId) {
      fetchCampaigns();
    }
  }, [accessToken, activeAccountId, fetchCampaigns]);

  const fetchAdSets = useCallback(async (campaignIdFilter?: string) => {
    if (!accessToken || !activeAccountId) return;

    setIsLoadingAdSets(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-ads', {
        body: { action: 'get-adsets', accessToken, adAccountId: activeAccountId }
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      const { data: insightsData } = await supabase.functions.invoke('meta-ads', {
        body: { action: 'get-adset-insights', accessToken, adAccountId: activeAccountId, dateRange: 'today' }
      });

      const insightsMap = new Map();
      if (insightsData?.insights) {
        insightsData.insights.forEach((i: { adset_id: string } & Omit<CampaignInsight, 'campaign_id'>) =>
          insightsMap.set(i.adset_id, i)
        );
      }

      let mapped: AdSet[] = (data.adsets || []).map((as: MetaAdSet) => {
        const insight = insightsMap.get(as.id);
        const metrics = parseMetrics(insight || null);
        const dailyBudget = as.daily_budget ? parseFloat(as.daily_budget) / 100 : null;
        const lifetimeBudget = as.lifetime_budget ? parseFloat(as.lifetime_budget) / 100 : null;

        return {
          id: as.id,
          name: as.name,
          status: as.status === 'ACTIVE',
          rawStatus: as.status,
          budget: dailyBudget || lifetimeBudget,
          budgetType: dailyBudget ? 'daily' : lifetimeBudget ? 'total' : null,
          optimizationGoal: as.optimization_goal || null,
          campaignId: as.campaign_id || null,
          ...metrics
        };
      });

      // Filter by campaign if specified
      if (campaignIdFilter) {
        mapped = mapped.filter(as => as.campaignId === campaignIdFilter);
      }

      // Sort but show ALL ad sets (no filtering) to handle duplicated sets
      const sorted = sortByStatusAndImpressions(mapped);
      setAdSets(sorted);
    } catch (err) {
      console.error('Error fetching ad sets:', err);
      toast.error('Erro ao carregar conjuntos de anúncios');
    } finally {
      setIsLoadingAdSets(false);
    }
  }, [accessToken, activeAccountId]);

  const fetchAds = useCallback(async (adsetIdFilter?: string) => {
    if (!accessToken || !activeAccountId) return;

    setIsLoadingAds(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-ads', {
        body: { action: 'get-ads', accessToken, adAccountId: activeAccountId }
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      const { data: insightsData } = await supabase.functions.invoke('meta-ads', {
        body: { action: 'get-ad-insights', accessToken, adAccountId: activeAccountId, dateRange: 'today' }
      });

      const insightsMap = new Map();
      if (insightsData?.insights) {
        insightsData.insights.forEach((i: { ad_id: string } & Omit<CampaignInsight, 'campaign_id'>) =>
          insightsMap.set(i.ad_id, i)
        );
      }

      let mapped: Ad[] = (data.ads || []).map((ad: MetaAd) => {
        const insight = insightsMap.get(ad.id);
        const metrics = parseMetrics(insight || null);

        return {
          id: ad.id,
          name: ad.name,
          status: ad.status === 'ACTIVE',
          rawStatus: ad.status,
          adsetId: ad.adset_id || null,
          ...metrics
        };
      });

      // Filter by adset if specified
      if (adsetIdFilter) {
        mapped = mapped.filter(ad => ad.adsetId === adsetIdFilter);
      }

      // Sort but show ALL ads (no filtering) to handle many ads
      const sorted = sortByStatusAndImpressions(mapped);
      setAds(sorted);
    } catch (err) {
      console.error('Error fetching ads:', err);
      toast.error('Erro ao carregar anúncios');
    } finally {
      setIsLoadingAds(false);
    }
  }, [accessToken, activeAccountId]);

  // Refresh all data simultaneously
  const refreshAll = useCallback(async () => {
    if (!accessToken || !activeAccountId) return;
    
    setIsLoading(true);
    setIsLoadingAdSets(true);
    setIsLoadingAds(true);
    
    await Promise.all([
      fetchCampaigns(),
      fetchAdSets(selectedCampaignId || undefined),
      fetchAds(selectedAdSetId || undefined)
    ]);
    
    setLastUpdated(new Date());
    toast.success('Dados atualizados!', { style: { background: '#16a34a', color: '#ffffff', border: 'none' } });
  }, [accessToken, activeAccountId, fetchCampaigns, fetchAdSets, fetchAds, selectedCampaignId, selectedAdSetId]);

  const toggleCampaignStatus = useCallback(async (campaignId: string, activate: boolean) => {
    if (!accessToken) {
      toast.error('Não conectado ao Meta Ads');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('meta-ads', {
        body: { action: activate ? 'activate-campaign' : 'pause-campaign', accessToken, campaignId }
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      setCampaigns(prev => sortByStatusAndImpressions(prev.map(c =>
        c.id === campaignId ? { ...c, status: activate, rawStatus: activate ? 'ACTIVE' : 'PAUSED' } : c
      )));

      toast.success(activate ? 'Campanha ativada' : 'Campanha pausada', { style: { background: '#16a34a', color: '#ffffff', border: 'none' } });
      return true;
    } catch (err) {
      console.error('Error toggling campaign:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar status da campanha');
      return false;
    }
  }, [accessToken]);

  const updateCampaignBudget = useCallback(async (campaignId: string, budget: number, budgetType: 'daily' | 'total') => {
    if (!accessToken) {
      toast.error('Não conectado ao Meta Ads');
      return false;
    }

    try {
      const budgetInCents = Math.round(budget * 100);
      const updates = budgetType === 'daily'
        ? { daily_budget: budgetInCents }
        : { lifetime_budget: budgetInCents };

      const { data, error } = await supabase.functions.invoke('meta-ads', {
        body: { action: 'update-campaign', accessToken, campaignId, updates }
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, budget, budgetType } : c
      ));

      toast.success('Orçamento atualizado', { style: { background: '#16a34a', color: '#ffffff', border: 'none' } });
      return true;
    } catch (err) {
      console.error('Error updating budget:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar orçamento');
      return false;
    }
  }, [accessToken]);

  const updateCampaignName = useCallback(async (campaignId: string, name: string) => {
    if (!accessToken) {
      toast.error('Não conectado ao Meta Ads');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('meta-ads', {
        body: { action: 'update-campaign', accessToken, campaignId, updates: { name } }
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, name } : c
      ));

      toast.success('Nome atualizado', { style: { background: '#16a34a', color: '#ffffff', border: 'none' } });
      return true;
    } catch (err) {
      console.error('Error updating name:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar nome');
      return false;
    }
  }, [accessToken]);

  const updateAdSetBudget = useCallback(async (adsetId: string, budget: number, budgetType: 'daily' | 'total') => {
    if (!accessToken) {
      toast.error('Não conectado ao Meta Ads');
      return false;
    }

    try {
      const budgetInCents = Math.round(budget * 100);
      const updates = budgetType === 'daily'
        ? { daily_budget: budgetInCents }
        : { lifetime_budget: budgetInCents };

      const { data, error } = await supabase.functions.invoke('meta-ads', {
        body: { action: 'update-adset', accessToken, adsetId, updates }
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      setAdSets(prev => prev.map(as =>
        as.id === adsetId ? { ...as, budget, budgetType } : as
      ));

      toast.success('Orçamento do conjunto atualizado', { style: { background: '#16a34a', color: '#ffffff', border: 'none' } });
      return true;
    } catch (err) {
      console.error('Error updating adset budget:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar orçamento do conjunto');
      return false;
    }
  }, [accessToken]);

  const toggleAdSetStatus = useCallback(async (adsetId: string, activate: boolean) => {
    if (!accessToken) return false;

    try {
      const { data, error } = await supabase.functions.invoke('meta-ads', {
        body: { action: activate ? 'activate-adset' : 'pause-adset', accessToken, adsetId }
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      setAdSets(prev => sortByStatusAndImpressions(prev.map(as =>
        as.id === adsetId ? { ...as, status: activate, rawStatus: activate ? 'ACTIVE' : 'PAUSED' } : as
      )));

      toast.success(activate ? 'Conjunto ativado' : 'Conjunto pausado', { style: { background: '#16a34a', color: '#ffffff', border: 'none' } });
      return true;
    } catch (err) {
      console.error('Error toggling adset:', err);
      toast.error('Erro ao alterar status do conjunto');
      return false;
    }
  }, [accessToken]);

  const toggleAdStatus = useCallback(async (adId: string, activate: boolean) => {
    if (!accessToken) return false;

    try {
      const { data, error } = await supabase.functions.invoke('meta-ads', {
        body: { action: activate ? 'activate-ad' : 'pause-ad', accessToken, adId }
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      setAds(prev => sortByStatusAndImpressions(prev.map(ad =>
        ad.id === adId ? { ...ad, status: activate, rawStatus: activate ? 'ACTIVE' : 'PAUSED' } : ad
      )));

      toast.success(activate ? 'Anúncio ativado' : 'Anúncio pausado', { style: { background: '#16a34a', color: '#ffffff', border: 'none' } });
      return true;
    } catch (err) {
      console.error('Error toggling ad:', err);
      toast.error('Erro ao alterar status do anúncio');
      return false;
    }
  }, [accessToken]);

  const updateAdName = useCallback(async (adId: string, name: string) => {
    if (!accessToken) {
      toast.error('Não conectado ao Meta Ads');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('meta-ads', {
        body: { action: 'update-ad', accessToken, adId, updates: { name } }
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      setAds(prev => prev.map(ad =>
        ad.id === adId ? { ...ad, name } : ad
      ));

      toast.success('Nome do anúncio atualizado', { style: { background: '#16a34a', color: '#ffffff', border: 'none' } });
      return true;
    } catch (err) {
      console.error('Error updating ad name:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar nome do anúncio');
      return false;
    }
  }, [accessToken]);

  const updateAdSetName = useCallback(async (adsetId: string, name: string) => {
    if (!accessToken) {
      toast.error('Não conectado ao Meta Ads');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('meta-ads', {
        body: { action: 'update-adset', accessToken, adsetId, updates: { name } }
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      setAdSets(prev => prev.map(as =>
        as.id === adsetId ? { ...as, name } : as
      ));

      toast.success('Nome do conjunto atualizado', { style: { background: '#16a34a', color: '#ffffff', border: 'none' }, position: 'top-center' });
      return true;
    } catch (err) {
      console.error('Error updating adset name:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar nome do conjunto');
      return false;
    }
  }, [accessToken]);

  const duplicateItem = useCallback(async (sourceId: string, type: 'campaign' | 'adset' | 'ad', copies: number) => {
    if (!accessToken) {
      toast.error('Não conectado ao Meta Ads');
      return false;
    }

    try {
      const body: any = { action: 'duplicate-campaign', accessToken, sourceId, type, copies };
      if (type === 'campaign') body.campaignId = sourceId;
      else if (type === 'adset') body.adsetId = sourceId;
      else body.adId = sourceId;

      const { data, error } = await supabase.functions.invoke('meta-ads', { body });
      if (error || data?.error) throw new Error(data?.error || error?.message);

      toast.success(`${type === 'campaign' ? 'Campanha' : type === 'adset' ? 'Conjunto' : 'Anúncio'} duplicado com sucesso!`, {
        style: { background: '#16a34a', color: '#ffffff', border: 'none' }
      });

      // Refresh data
      if (type === 'campaign') await fetchCampaigns();
      else if (type === 'adset') await fetchAdSets(selectedCampaignId || undefined);
      else await fetchAds(selectedAdSetId || undefined);

      return true;
    } catch (err) {
      console.error('Error duplicating:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao duplicar');
      return false;
    }
  }, [accessToken, fetchCampaigns, fetchAdSets, fetchAds, selectedCampaignId, selectedAdSetId]);

  const deleteItem = useCallback(async (id: string, type: 'campaign' | 'adset' | 'ad') => {
    if (!accessToken) {
      toast.error('Não conectado ao Meta Ads');
      return false;
    }

    try {
      const body: any = { action: 'delete-campaign', accessToken };
      if (type === 'campaign') body.campaignId = id;
      else if (type === 'adset') body.adsetId = id;
      else body.adId = id;

      const { data, error } = await supabase.functions.invoke('meta-ads', { body });
      if (error || data?.error) throw new Error(data?.error || error?.message);

      // Remove from local state
      if (type === 'campaign') setCampaigns(prev => prev.filter(c => c.id !== id));
      else if (type === 'adset') setAdSets(prev => prev.filter(as => as.id !== id));
      else setAds(prev => prev.filter(ad => ad.id !== id));

      toast.success(`${type === 'campaign' ? 'Campanha' : type === 'adset' ? 'Conjunto' : 'Anúncio'} excluído`, {
        style: { background: '#16a34a', color: '#ffffff', border: 'none' }
      });
      return true;
    } catch (err) {
      console.error('Error deleting:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir');
      return false;
    }
  }, [accessToken]);

  const getLastUpdatedText = useCallback(() => {
    if (!lastUpdated) return 'Nunca';

    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} segundos`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    return `${hours} horas`;
  }, [lastUpdated]);

  return {
    campaigns,
    adSets,
    ads,
    isLoading,
    isLoadingAdSets,
    isLoadingAds,
    lastUpdated,
    activeAccountId,
    selectedCampaignId,
    selectedAdSetId,
    setSelectedCampaignId,
    setSelectedAdSetId,
    fetchCampaigns,
    fetchAdSets,
    fetchAds,
    refreshAll,
    toggleCampaignStatus,
    toggleAdSetStatus,
    toggleAdStatus,
    updateCampaignBudget,
    updateCampaignName,
    updateAdSetBudget,
    updateAdName,
    updateAdSetName,
    duplicateItem,
    deleteItem,
    getLastUpdatedText,
    hasActiveAccount: !!activeAccountId && !!accessToken
  };
}
