import { useState, useEffect } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';
import { useSales } from '@/hooks/useSales';
import type { PeriodKey } from '@/hooks/useDashboardFilters';

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  is_active: boolean;
}

interface DashboardFiltersProps {
  filters: {
    selectedPeriod: PeriodKey;
    setSelectedPeriod: (period: PeriodKey) => void;
    selectedAccount: string;
    setSelectedAccount: (account: string) => void;
    selectedCampaign: string;
    setSelectedCampaign: (campaign: string) => void;
    selectedProduct: string;
    setSelectedProduct: (product: string) => void;
  };
}

export function DashboardFilters({ filters }: DashboardFiltersProps) {
  const { user } = useAuth();
  const { refreshAll, isLoading: campaignsLoading } = useMetaCampaigns();
  const { refreshSales, loading: salesLoading } = useSales();
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);

  const {
    selectedPeriod,
    setSelectedPeriod,
    selectedAccount,
    setSelectedAccount,
    selectedCampaign,
    setSelectedCampaign,
    selectedProduct,
    setSelectedProduct,
  } = filters;

  // Load accounts from database
  useEffect(() => {
    const loadAccounts = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('meta_ad_accounts')
        .select('id, name, account_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (data) {
        setAccounts(data);
      }
    };

    loadAccounts();
  }, [user]);

  useEffect(() => {
    setCampaigns([]);
  }, [selectedAccount]);

  const handleRefresh = async () => {
    await Promise.all([
      refreshAll(),
      refreshSales()
    ]);
    const { toast } = await import('sonner');
    toast.success('Dados Atualizados', {
      style: { background: '#16a34a', color: '#ffffff', border: 'none' },
    });
  };

  const isRefreshing = campaignsLoading || salesLoading;

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as PeriodKey)}>
          <SelectTrigger className="w-40 border-0 bg-muted/50">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="yesterday">Ontem</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="thisMonth">Este mês</SelectItem>
            <SelectItem value="lastMonth">Mês passado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
        <SelectTrigger className="w-48 border-0 bg-muted/50">
          <SelectValue placeholder="Conta de Anúncio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as contas</SelectItem>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.account_id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
        <SelectTrigger className="w-48 border-0 bg-muted/50">
          <SelectValue placeholder="Campanha" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as campanhas</SelectItem>
          {campaigns.map((campaign) => (
            <SelectItem key={campaign.id} value={campaign.id}>
              {campaign.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
        <SelectTrigger className="w-40 border-0 bg-muted/50">
          <SelectValue placeholder="Produto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto">
        <Button 
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
    </div>
  );
}
