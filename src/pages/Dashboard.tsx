import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { X, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { ProfitByHourChart } from '@/components/dashboard/ProfitByHourChart';
import { SalesByHourChart } from '@/components/dashboard/SalesByHourChart';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { CampaignsList } from '@/components/dashboard/CampaignsList';
import { EditableDashboardGrid } from '@/components/dashboard/EditableDashboardGrid';
import { EditModeBar } from '@/components/dashboard/EditModeBar';
import { RevenueProgressBar } from '@/components/dashboard/RevenueProgressBar';
import { DraggableWidgetCard } from '@/components/dashboard/DraggableWidgetCard';
import { LiveVisitorsCard } from '@/components/dashboard/LiveVisitorsCard';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { useMetaAuth } from '@/hooks/useMetaAuth';
import { useWebhooks } from '@/hooks/useWebhooks';

type WidgetId = 'profit-by-hour' | 'sales-by-hour' | 'conversion-funnel' | 'campaigns-list' | 'live-visitors';

const SETUP_BANNER_KEY = 'gerencia-roi-setup-banner-dismissed';

const Dashboard = () => {
  const navigate = useNavigate();
  const dashboardLayout = useDashboardLayout();
  const filters = useDashboardFilters();
  const { isConnected, connection } = useMetaAuth();
  const { webhooks } = useWebhooks();
  const salesFilters = { startDate: filters.dateRange.startDate, endDate: filters.dateRange.endDate };

  // Setup incomplete banner
  // Setup is complete only when: Meta connected + at least one BM account active + at least one webhook
  const hasWebhooks = webhooks && webhooks.length > 0;
  const hasActiveAccount = connection?.adAccounts?.some(acc => acc.is_active) ?? false;
  const isSetupComplete = isConnected && hasActiveAccount && hasWebhooks;
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    return localStorage.getItem(SETUP_BANNER_KEY) === 'true';
  });

  // Auto-hide banner when setup is complete
  useEffect(() => {
    if (isSetupComplete) {
      setBannerDismissed(true);
      localStorage.setItem(SETUP_BANNER_KEY, 'true');
    }
  }, [isSetupComplete]);

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem(SETUP_BANNER_KEY, 'true');
  };

  const WIDGET_ORDER_KEY = 'gerencia-roi-widget-order';
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
    try {
      const saved = localStorage.getItem(WIDGET_ORDER_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['profit-by-hour', 'sales-by-hour', 'conversion-funnel', 'campaigns-list', 'live-visitors'];
  });

  // Persist widget order
  useEffect(() => {
    localStorage.setItem(WIDGET_ORDER_KEY, JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  const {
    isEditMode,
    saving,
    setIsEditMode,
    saveLayout,
    cancelEdit,
    resetLayout,
  } = dashboardLayout;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleWidgetDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWidgetOrder(prev => {
      const oldIndex = prev.indexOf(active.id as WidgetId);
      const newIndex = prev.indexOf(over.id as WidgetId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  return (
    <MainLayout 
      title="Dashboard - Principal"
      headerAction={
        <div className="flex items-center gap-3">
          <RevenueProgressBar />
          <EditModeBar
            isEditMode={isEditMode}
            saving={saving}
            onToggleEdit={() => setIsEditMode(true)}
            onSave={saveLayout}
            onCancel={cancelEdit}
            onReset={resetLayout}
          />
        </div>
      }
    >
      <div className="space-y-6">
        <DashboardFilters filters={filters} />

        {/* Incomplete setup banner */}
        {!bannerDismissed && !isSetupComplete && (
          <div className="relative flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-destructive text-sm">CONFIGURAÇÃO INCOMPLETA!</p>
              <p className="text-sm text-destructive/80 mt-0.5">
                Você ainda não terminou a configuração desse dashboard.{' '}
                <button
                  onClick={() => navigate('/onboarding')}
                  className="underline underline-offset-2 hover:text-destructive font-medium transition-colors"
                >
                  Por favor, clique aqui para continuar.
                </button>
              </p>
            </div>
            <button
              onClick={dismissBanner}
              className="text-destructive/60 hover:text-destructive transition-colors shrink-0"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <EditableDashboardGrid
          isEditMode={isEditMode}
          layoutHook={dashboardLayout}
          dateRange={filters.dateRange}
        />

        {/* Draggable widget sections */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleWidgetDragEnd}
        >
          <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {widgetOrder.map(widgetId => {
                // Profit + Sales side by side
                if (widgetId === 'profit-by-hour') {
                  const salesIdx = widgetOrder.indexOf('sales-by-hour');
                  const profitIdx = widgetOrder.indexOf('profit-by-hour');
                  if (salesIdx === profitIdx + 1) {
                    return (
                      <div key={widgetId} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DraggableWidgetCard id="profit-by-hour" isEditMode={isEditMode}>
                          <ProfitByHourChart filters={salesFilters} />
                        </DraggableWidgetCard>
                        <DraggableWidgetCard id="sales-by-hour" isEditMode={isEditMode}>
                          <SalesByHourChart filters={salesFilters} />
                        </DraggableWidgetCard>
                      </div>
                    );
                  }
                }
                if (widgetId === 'sales-by-hour') {
                  const profitIdx = widgetOrder.indexOf('profit-by-hour');
                  const salesIdx = widgetOrder.indexOf('sales-by-hour');
                  if (profitIdx === salesIdx - 1) return null;
                }

                if (widgetId === 'conversion-funnel') {
                  const campaignsIdx = widgetOrder.indexOf('campaigns-list');
                  const funnelIdx = widgetOrder.indexOf('conversion-funnel');
                  if (campaignsIdx === funnelIdx + 1) {
                    return (
                      <div key={widgetId} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <DraggableWidgetCard id="conversion-funnel" isEditMode={isEditMode}>
                          <ConversionFunnel />
                        </DraggableWidgetCard>
                        <DraggableWidgetCard id="campaigns-list" isEditMode={isEditMode} className="lg:col-span-2">
                          <CampaignsList />
                        </DraggableWidgetCard>
                      </div>
                    );
                  }
                }
                if (widgetId === 'campaigns-list') {
                  const funnelIdx = widgetOrder.indexOf('conversion-funnel');
                  const campaignsIdx = widgetOrder.indexOf('campaigns-list');
                  if (funnelIdx === campaignsIdx - 1) return null;
                }

                // Standalone widgets
                const renderWidget = () => {
                  switch (widgetId) {
                    case 'profit-by-hour': return <ProfitByHourChart filters={salesFilters} />;
                    case 'sales-by-hour': return <SalesByHourChart filters={salesFilters} />;
                    case 'conversion-funnel': return <ConversionFunnel />;
                    case 'campaigns-list': return <CampaignsList />;
                    case 'live-visitors': return <LiveVisitorsCard />;
                  }
                };

                return (
                  <DraggableWidgetCard key={widgetId} id={widgetId} isEditMode={isEditMode}>
                    {renderWidget()}
                  </DraggableWidgetCard>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

      </div>
    </MainLayout>
  );
};

export default Dashboard;
