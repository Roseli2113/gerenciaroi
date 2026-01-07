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
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
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
}

export function useMetaCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load active account and access token
  useEffect(() => {
    const loadActiveAccount = async () => {
      if (!user) return;

      try {
        // Get connection with token
        const { data: connection } = await supabase
          .from('meta_connections')
          .select('access_token')
          .eq('user_id', user.id)
          .maybeSingle();

        if (connection) {
          setAccessToken(connection.access_token);
        }

        // Get active ad account
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
    if (!accessToken || !activeAccountId) {
      return;
    }

    setIsLoading(true);
    try {
      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase.functions.invoke('meta-ads', {
        body: {
          action: 'get-campaigns',
          accessToken,
          adAccountId: activeAccountId
        }
      });

      if (campaignsError || campaignsData?.error) {
        throw new Error(campaignsData?.error || campaignsError?.message);
      }

      // Fetch insights
      const { data: insightsData, error: insightsError } = await supabase.functions.invoke('meta-ads', {
        body: {
          action: 'get-campaign-insights',
          accessToken,
          adAccountId: activeAccountId,
          dateRange: 'today'
        }
      });

      if (insightsError || insightsData?.error) {
        console.warn('Could not fetch insights:', insightsData?.error || insightsError?.message);
      }

      const insightsMap = new Map<string, CampaignInsight>();
      if (insightsData?.insights) {
        insightsData.insights.forEach((insight: CampaignInsight) => {
          insightsMap.set(insight.campaign_id, insight);
        });
      }

      // Merge campaigns with insights
      const mergedCampaigns: Campaign[] = (campaignsData.campaigns || []).map((campaign: MetaCampaign) => {
        const insight = insightsMap.get(campaign.id);
        const spent = insight ? parseFloat(insight.spend) : 0;
        
        // Get purchase/conversion actions
        const purchases = insight?.actions?.find(
          a => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
        );
        const sales = purchases ? parseInt(purchases.value) : 0;

        // Get purchase value
        const purchaseValue = insight?.action_values?.find(
          a => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
        );
        const revenue = purchaseValue ? parseFloat(purchaseValue.value) : 0;

        // Calculate profit and metrics
        const profit = revenue - spent;
        const cpa = sales > 0 ? spent / sales : null;
        const roi = spent > 0 ? revenue / spent : null;

        // Budget parsing
        const dailyBudget = campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : null;
        const lifetimeBudget = campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) / 100 : null;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status === 'ACTIVE',
          rawStatus: campaign.status,
          budget: dailyBudget || lifetimeBudget,
          budgetType: dailyBudget ? 'daily' : lifetimeBudget ? 'total' : null,
          spent,
          sales,
          revenue,
          profit,
          cpa,
          roi
        };
      });

      setCampaigns(mergedCampaigns);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar campanhas');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeAccountId]);

  // Auto-fetch when account is active
  useEffect(() => {
    if (accessToken && activeAccountId) {
      fetchCampaigns();
    }
  }, [accessToken, activeAccountId, fetchCampaigns]);

  const toggleCampaignStatus = useCallback(async (campaignId: string, activate: boolean) => {
    if (!accessToken) {
      toast.error('Não conectado ao Meta Ads');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('meta-ads', {
        body: {
          action: activate ? 'activate-campaign' : 'pause-campaign',
          accessToken,
          campaignId
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }

      // Update local state
      setCampaigns(prev => prev.map(c => 
        c.id === campaignId 
          ? { ...c, status: activate, rawStatus: activate ? 'ACTIVE' : 'PAUSED' } 
          : c
      ));

      toast.success(activate ? 'Campanha ativada' : 'Campanha pausada');
      return true;
    } catch (err) {
      console.error('Error toggling campaign:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar status da campanha');
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
    isLoading,
    lastUpdated,
    activeAccountId,
    fetchCampaigns,
    toggleCampaignStatus,
    getLastUpdatedText,
    hasActiveAccount: !!activeAccountId && !!accessToken
  };
}
