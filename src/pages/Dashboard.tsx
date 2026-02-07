import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { CampaignsList } from '@/components/dashboard/CampaignsList';
import { EditableDashboardGrid } from '@/components/dashboard/EditableDashboardGrid';
import { EditModeBar } from '@/components/dashboard/EditModeBar';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';

const Dashboard = () => {
  const dashboardLayout = useDashboardLayout();
  const filters = useDashboardFilters();

  const {
    isEditMode,
    saving,
    setIsEditMode,
    saveLayout,
    cancelEdit,
    resetLayout,
  } = dashboardLayout;

  return (
    <MainLayout 
      title="Dashboard - Principal"
      headerAction={
        <EditModeBar
          isEditMode={isEditMode}
          saving={saving}
          onToggleEdit={() => setIsEditMode(true)}
          onSave={saveLayout}
          onCancel={cancelEdit}
          onReset={resetLayout}
        />
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <DashboardFilters filters={filters} />

        {/* Editable Metrics Grid */}
        <EditableDashboardGrid 
          isEditMode={isEditMode}
          layoutHook={dashboardLayout}
          dateRange={filters.dateRange}
        />

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
