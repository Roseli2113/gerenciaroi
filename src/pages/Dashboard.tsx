import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { CampaignsList } from '@/components/dashboard/CampaignsList';
import { EditableDashboardGrid } from '@/components/dashboard/EditableDashboardGrid';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';

const Dashboard = () => {
  const { isLoading, refreshAll } = useMetaCampaigns();

  return (
    <MainLayout title="Dashboard - Principal">
      <div className="space-y-6">
        {/* Filters with Refresh Button */}
        <DashboardFilters onRefresh={refreshAll} isLoading={isLoading} />

        {/* Editable Metrics Grid */}
        <EditableDashboardGrid />

        {/* Charts Row - Only Spending Chart now */}
        <div className="grid grid-cols-1 gap-6">
          <SpendingChart />
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
