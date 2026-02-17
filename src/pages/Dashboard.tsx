import { useState, useCallback } from 'react';
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
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';

type WidgetId = 'profit-by-hour' | 'sales-by-hour' | 'conversion-funnel' | 'campaigns-list';

// Widget components are rendered inline to pass filters

const Dashboard = () => {
  const dashboardLayout = useDashboardLayout();
  const filters = useDashboardFilters();
  const salesFilters = { startDate: filters.dateRange.startDate, endDate: filters.dateRange.endDate };
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>([
    'profit-by-hour',
    'sales-by-hour',
    'conversion-funnel',
    'campaigns-list',
  ]);

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
