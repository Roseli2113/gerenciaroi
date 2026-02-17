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
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { CampaignsList } from '@/components/dashboard/CampaignsList';
import { EditableDashboardGrid } from '@/components/dashboard/EditableDashboardGrid';
import { EditModeBar } from '@/components/dashboard/EditModeBar';
import { DraggableWidgetCard } from '@/components/dashboard/DraggableWidgetCard';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';

type WidgetId = 'spending-chart' | 'conversion-funnel' | 'campaigns-list';

const WIDGET_COMPONENTS: Record<WidgetId, React.FC> = {
  'spending-chart': SpendingChart,
  'conversion-funnel': ConversionFunnel,
  'campaigns-list': CampaignsList,
};

const Dashboard = () => {
  const dashboardLayout = useDashboardLayout();
  const filters = useDashboardFilters();
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>([
    'spending-chart',
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
                const WidgetComponent = WIDGET_COMPONENTS[widgetId];
                // Funnel + campaigns side by side
                if (widgetId === 'conversion-funnel') {
                  const campaignsIdx = widgetOrder.indexOf('campaigns-list');
                  const funnelIdx = widgetOrder.indexOf('conversion-funnel');
                  // If they're adjacent, render them together in this slot
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
                // Skip campaigns-list if already rendered with funnel
                if (widgetId === 'campaigns-list') {
                  const funnelIdx = widgetOrder.indexOf('conversion-funnel');
                  const campaignsIdx = widgetOrder.indexOf('campaigns-list');
                  if (funnelIdx === campaignsIdx - 1) return null;
                }

                return (
                  <DraggableWidgetCard key={widgetId} id={widgetId} isEditMode={isEditMode}>
                    <WidgetComponent />
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
