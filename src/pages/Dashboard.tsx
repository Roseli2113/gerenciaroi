import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { CPAChart } from '@/components/dashboard/CPAChart';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { CampaignsList } from '@/components/dashboard/CampaignsList';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';
import {
  DollarSign,
  TrendingUp,
  Target,
  Wallet,
  ShoppingCart,
  BarChart3,
} from 'lucide-react';

const Dashboard = () => {
  const { campaigns, hasActiveAccount } = useMetaCampaigns();
  
  // Calculate real metrics from campaigns data
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalSales = campaigns.reduce((sum, c) => sum + c.sales, 0);
  const totalProfit = totalRevenue - totalSpent;
  const avgROI = totalSpent > 0 ? (totalRevenue / totalSpent) * 100 : 0;
  const avgCPA = totalSales > 0 ? totalSpent / totalSales : 0;

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <MainLayout title="Dashboard - Principal">
      <div className="space-y-6">
        {/* Filters */}
        <DashboardFilters />

        {/* Metrics Grid - Real data from campaigns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Faturamento"
            value={formatCurrency(totalRevenue)}
            change={0}
            changeLabel="hoje"
            icon={DollarSign}
            variant="success"
          />
          <MetricCard
            title="Gastos com Anúncios"
            value={formatCurrency(totalSpent)}
            change={0}
            changeLabel="hoje"
            icon={Wallet}
            variant="primary"
          />
          <MetricCard
            title="ROI"
            value={`${avgROI.toFixed(0)}%`}
            change={0}
            changeLabel="hoje"
            icon={TrendingUp}
            variant={avgROI > 100 ? "success" : "primary"}
          />
          <MetricCard
            title="Lucro"
            value={formatCurrency(totalProfit)}
            change={0}
            changeLabel="hoje"
            icon={BarChart3}
            variant={totalProfit > 0 ? "success" : "primary"}
          />
          <MetricCard
            title="CPA Médio"
            value={formatCurrency(avgCPA)}
            change={0}
            changeLabel="hoje"
            icon={Target}
            variant="primary"
          />
          <MetricCard
            title="Vendas"
            value={totalSales.toString()}
            change={0}
            changeLabel="hoje"
            icon={ShoppingCart}
            variant="success"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingChart />
          <CPAChart />
        </div>

        {/* Funnel and Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ConversionFunnel />
          <div className="lg:col-span-2">
            <CampaignsList />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
