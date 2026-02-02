import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { MetricDefinition } from '@/hooks/useDashboardLayout';
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
} from 'lucide-react';

interface MetricsSidebarProps {
  availableMetrics: MetricDefinition[];
  isEditMode: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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
};

function DraggableMetricItem({ metric }: { metric: MetricDefinition }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-${metric.id}`,
    data: { metricId: metric.id, fromSidebar: true },
  });

  const Icon = iconMap[metric.icon] || DollarSign;

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-3 rounded-lg border border-border bg-card cursor-grab transition-all",
        "hover:border-primary hover:shadow-md",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium">{metric.title}</span>
      </div>
    </div>
  );
}

export function MetricsSidebar({ availableMetrics, isEditMode }: MetricsSidebarProps) {
  if (!isEditMode) return null;

  const categories = {
    revenue: { title: 'Receita', metrics: [] as MetricDefinition[] },
    cost: { title: 'Custos', metrics: [] as MetricDefinition[] },
    performance: { title: 'Performance', metrics: [] as MetricDefinition[] },
    sales: { title: 'Vendas', metrics: [] as MetricDefinition[] },
  };

  availableMetrics.forEach(metric => {
    categories[metric.category].metrics.push(metric);
  });

  return (
    <div className="w-64 bg-card border-r border-border p-4 overflow-y-auto flex-shrink-0">
      <h3 className="text-lg font-semibold mb-4">Métricas Disponíveis</h3>
      
      <div className="space-y-6">
        {Object.entries(categories).map(([key, category]) => {
          if (category.metrics.length === 0) return null;
          
          return (
            <div key={key}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {category.title}
              </h4>
              <div className="space-y-2">
                {category.metrics.map(metric => (
                  <DraggableMetricItem key={metric.id} metric={metric} />
                ))}
              </div>
            </div>
          );
        })}
        
        {availableMetrics.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Todas as métricas estão no dashboard
          </p>
        )}
      </div>
    </div>
  );
}
