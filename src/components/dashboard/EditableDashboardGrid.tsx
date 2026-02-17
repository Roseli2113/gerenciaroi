import { useCallback, useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { DraggableMetricCard } from './DraggableMetricCard';
import { MetricsSidebar } from './MetricsSidebar';
import { AVAILABLE_METRICS } from '@/hooks/useDashboardLayout';
import type { useDashboardLayout as UseDashboardLayoutType } from '@/hooks/useDashboardLayout';
import { useSales } from '@/hooks/useSales';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';
import type { DateRange } from '@/hooks/useDashboardFilters';
import {
  DollarSign,
  Wallet,
  TrendingUp,
  BarChart3,
  Target,
  ShoppingCart,
  Receipt,
  Clock,
  RotateCcw,
  Users,
  Percent,
  CheckCircle,
  LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  DollarSign, Wallet, TrendingUp, BarChart3, Target,
  ShoppingCart, Receipt, Clock, RotateCcw, Users, Percent, CheckCircle,
};

function DroppableArea({ children, isEditMode }: { children: React.ReactNode; isEditMode: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'dashboard-drop-area' });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-6 overflow-y-auto ${isOver && isEditMode ? 'bg-primary/5' : ''}`}
    >
      {children}
    </div>
  );
}

interface EditableDashboardGridProps {
  isEditMode: boolean;
  layoutHook: ReturnType<typeof UseDashboardLayoutType>;
  dateRange: DateRange;
}

export function EditableDashboardGrid({ isEditMode, layoutHook, dateRange }: EditableDashboardGridProps) {
  const {
    layout,
    updateLayout,
    addMetric,
    removeMetric,
    getAvailableMetrics,
  } = layoutHook;

  const { campaigns } = useMetaCampaigns();
  
  // Filter sales by selected date range
  const salesFilters = useMemo(() => ({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  }), [dateRange.startDate, dateRange.endDate]);
  
  const { metrics: salesMetrics } = useSales(salesFilters);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Calculate metrics from campaigns and sales data
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0) + salesMetrics.totalRevenue;
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalSales = campaigns.reduce((sum, c) => sum + c.sales, 0) + salesMetrics.approvedSales;
  const totalProfit = totalRevenue - totalSpent;
  const avgROI = totalSpent > 0 ? (totalRevenue / totalSpent) * 100 : 0;
  const avgCPA = totalSales > 0 ? totalSpent / totalSales : 0;
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : salesMetrics.avgTicket;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getMetricData = (metricId: string): { 
    title: string; value: string; icon: LucideIcon; 
    variant: 'default' | 'success' | 'danger' | 'warning' | 'primary';
    change?: number;
  } => {
    const metricDef = AVAILABLE_METRICS.find(m => m.id === metricId);
    const Icon = iconMap[metricDef?.icon || 'DollarSign'] || DollarSign;

    switch (metricId) {
      case 'revenue':
        return { title: 'Faturamento', value: formatCurrency(totalRevenue), icon: Icon, variant: 'success', change: 0 };
      case 'spent':
        return { title: 'Gastos com Anúncios', value: formatCurrency(totalSpent), icon: Icon, variant: 'danger', change: 0 };
      case 'roi':
        return { title: 'ROI', value: formatPercent(avgROI), icon: Icon, variant: avgROI > 100 ? 'success' : 'primary', change: 0 };
      case 'profit':
        return { title: 'Lucro', value: formatCurrency(totalProfit), icon: Icon, variant: totalProfit >= 0 ? 'success' : 'danger', change: 0 };
      case 'cpa':
        return { title: 'CPA Médio', value: formatCurrency(avgCPA), icon: Icon, variant: 'primary', change: 0 };
      case 'sales':
        return { title: 'Vendas', value: totalSales.toString(), icon: Icon, variant: 'primary', change: 0 };
      case 'ticket':
        return { title: 'Ticket Médio', value: formatCurrency(avgTicket), icon: Icon, variant: 'primary', change: 0 };
      case 'pending':
        return { title: 'Vendas Pendentes', value: formatCurrency(salesMetrics.totalPending), icon: Icon, variant: 'warning', change: 0 };
      case 'refunds':
        return { title: 'Reembolsos', value: formatCurrency(salesMetrics.totalRefunds), icon: Icon, variant: 'danger', change: 0 };
      case 'arpu':
        return { title: 'ARPU', value: formatCurrency(salesMetrics.arpu), icon: Icon, variant: 'primary', change: 0 };
      case 'margin':
        return { title: 'Margem', value: formatPercent(margin), icon: Icon, variant: margin > 0 ? 'success' : 'danger', change: 0 };
      case 'approval':
        return { title: 'Taxa de Aprovação', value: formatPercent(salesMetrics.approvalRate), icon: Icon, variant: salesMetrics.approvalRate > 80 ? 'success' : 'warning', change: 0 };
      default:
        return { title: 'Métrica', value: 'N/A', icon: DollarSign, variant: 'default' };
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!isEditMode) return;
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeData = active.data.current;
    if (activeData?.fromSidebar) {
      addMetric(activeData.metricId);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = layout.findIndex(item => item.id === active.id);
      const newIndex = layout.findIndex(item => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newLayout = arrayMove(layout, oldIndex, newIndex);
        const updatedLayout = newLayout.map((item, index) => ({
          ...item,
          x: index % 4,
          y: Math.floor(index / 4),
        }));
        updateLayout(updatedLayout);
      }
    }
  }, [layout, updateLayout, addMetric, isEditMode]);

  const sortableIds = layout.map(item => item.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className={`flex ${isEditMode ? 'gap-0' : ''}`}>
          <MetricsSidebar
            availableMetrics={getAvailableMetrics()}
            isEditMode={isEditMode}
          />
          <DroppableArea isEditMode={isEditMode}>
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {layout.map(item => {
                  const metricData = getMetricData(item.id);
                  return (
                    <DraggableMetricCard
                      key={item.id}
                      id={item.id}
                      title={metricData.title}
                      value={metricData.value}
                      icon={metricData.icon}
                      variant={metricData.variant}
                      isEditMode={isEditMode}
                      onRemove={() => removeMetric(item.id)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DroppableArea>
        </div>
      </div>

      <DragOverlay>
        {activeId && (() => {
          if (activeId.startsWith('sidebar-')) {
            const metricId = activeId.replace('sidebar-', '');
            const metricDef = AVAILABLE_METRICS.find(m => m.id === metricId);
            if (metricDef) {
              const Icon = iconMap[metricDef.icon] || DollarSign;
              return (
                <div className="p-3 rounded-lg border border-primary bg-card shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{metricDef.title}</span>
                  </div>
                </div>
              );
            }
          }
          const metricData = getMetricData(activeId);
          return (
            <DraggableMetricCard
              id={activeId}
              title={metricData.title}
              value={metricData.value}
              icon={metricData.icon}
              variant={metricData.variant}
              isEditMode={true}
            />
          );
        })()}
      </DragOverlay>
    </DndContext>
  );
}
