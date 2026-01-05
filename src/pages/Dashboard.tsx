import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { CPAChart } from '@/components/dashboard/CPAChart';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { CampaignsList } from '@/components/dashboard/CampaignsList';
import { MetaConnection } from '@/components/dashboard/MetaConnection';
import {
  DollarSign,
  TrendingUp,
  Target,
  Wallet,
  ShoppingCart,
  BarChart3,
} from 'lucide-react';

const Dashboard = () => {
  return (
    <MainLayout title="Dashboard - Principal">
      <div className="space-y-6">
        {/* Meta Connection Status */}
        <MetaConnection isConnected={true} />

        {/* Filters */}
        <DashboardFilters />

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Faturamento"
            value="R$ 45.230,00"
            change={12.5}
            changeLabel="vs ontem"
            icon={DollarSign}
            variant="success"
          />
          <MetricCard
            title="Gastos com Anúncios"
            value="R$ 8.540,00"
            change={-3.2}
            changeLabel="vs ontem"
            icon={Wallet}
            variant="primary"
          />
          <MetricCard
            title="ROI"
            value="429%"
            change={18.7}
            changeLabel="vs ontem"
            icon={TrendingUp}
            variant="success"
          />
          <MetricCard
            title="Lucro"
            value="R$ 36.690,00"
            change={15.3}
            changeLabel="vs ontem"
            icon={BarChart3}
            variant="success"
          />
          <MetricCard
            title="CPA Médio"
            value="R$ 9,45"
            change={-8.1}
            changeLabel="vs ontem"
            icon={Target}
            variant="primary"
          />
          <MetricCard
            title="Vendas"
            value="904"
            change={22.4}
            changeLabel="vs ontem"
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
