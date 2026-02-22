import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
    customDateFrom?: Date | undefined;
    setCustomDateFrom?: (date: Date | undefined) => void;
    customDateTo?: Date | undefined;
    setCustomDateTo?: (date: Date | undefined) => void;
  };
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export function DashboardFilters({ filters, onRefresh, isRefreshing = false }: DashboardFiltersProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [products] = useState<{ id: string; name: string }[]>([]);

  const {
    selectedPeriod,
    setSelectedPeriod,
    selectedAccount,
    setSelectedAccount,
    selectedCampaign,
    setSelectedCampaign,
    selectedProduct,
    setSelectedProduct,
    customDateFrom,
    setCustomDateFrom,
    customDateTo,
    setCustomDateTo,
  } = filters;

  useEffect(() => {
    const loadAccounts = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('meta_ad_accounts')
        .select('id, name, account_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (data) setAccounts(data);
    };
    loadAccounts();
  }, [user]);

  useEffect(() => {
    setCampaigns([]);
  }, [selectedAccount]);

  const handleRefresh = async () => {
    if (onRefresh) await onRefresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-center gap-2 min-w-0">
        <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as PeriodKey)}>
          <SelectTrigger className="w-36 sm:w-40 border-0 bg-muted/50">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="yesterday">Ontem</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="thisMonth">Este mês</SelectItem>
            <SelectItem value="lastMonth">Mês passado</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedPeriod === 'custom' && setCustomDateFrom && setCustomDateTo && (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground">De:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("h-9 justify-start text-left font-normal text-xs sm:text-sm min-w-0", !customDateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{customDateFrom ? format(customDateFrom, "dd 'de' MMM 'de' yyyy", { locale: ptBR }) : 'Selecionar'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} disabled={(date) => date > new Date()} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>

          <span className="text-sm text-muted-foreground">Até:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("h-9 justify-start text-left font-normal text-xs sm:text-sm min-w-0", !customDateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{customDateTo ? format(customDateTo, "dd 'de' MMM 'de' yyyy", { locale: ptBR }) : 'Selecionar'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} disabled={(date) => date > new Date() || (customDateFrom ? date < customDateFrom : false)} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
        <SelectTrigger className="w-36 sm:w-48 border-0 bg-muted/50">
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
        <SelectTrigger className="w-36 sm:w-48 border-0 bg-muted/50">
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
        <SelectTrigger className="w-32 sm:w-40 border-0 bg-muted/50">
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

      <div className="ml-auto shrink-0">
        <Button 
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing || !onRefresh}
          className="gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>
    </div>
  );
}
