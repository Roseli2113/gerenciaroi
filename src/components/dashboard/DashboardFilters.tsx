import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
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

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  is_active: boolean;
}

export function DashboardFilters() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

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

  // Load campaigns when account changes (mock for now - would come from meta-ads)
  useEffect(() => {
    // This would load campaigns from the API based on selected account
    // For now, campaigns will be loaded from the hook
    setCampaigns([]);
  }, [selectedAccount]);

  const handleApplyFilters = () => {
    // Apply filters - this would trigger data reload
    console.log('Applying filters:', { selectedAccount, selectedPeriod, selectedCampaign, selectedProduct });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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
          onClick={handleApplyFilters}
          className="gradient-primary text-primary-foreground hover:opacity-90"
        >
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
