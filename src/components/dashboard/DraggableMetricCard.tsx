import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraggableMetricCardProps {
  id: string;
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'primary';
  isEditMode: boolean;
  onRemove?: () => void;
}

const variantStyles = {
  default: 'from-card to-card',
  success: 'from-success/10 to-success/5 border-success/20',
  danger: 'from-destructive/10 to-destructive/5 border-destructive/20',
  warning: 'from-warning/10 to-warning/5 border-warning/20',
  primary: 'from-primary/10 to-primary/5 border-primary/20',
};

const iconVariantStyles = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/20 text-success',
  danger: 'bg-destructive/20 text-destructive',
  warning: 'bg-warning/20 text-warning',
  primary: 'bg-primary/20 text-primary',
};

const valueVariantStyles = {
  default: 'text-foreground',
  success: 'text-success',
  danger: 'text-destructive',
  warning: 'text-warning',
  primary: 'text-primary',
};

export function DraggableMetricCard({
  id,
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = 'default',
  isEditMode,
  onRemove,
}: DraggableMetricCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="w-3 h-3" />;
    return change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground';
    return change > 0 ? 'text-success' : 'text-destructive';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300 group',
        variantStyles[variant],
        isEditMode && 'ring-2 ring-primary/50 ring-dashed cursor-grab',
        isDragging && 'opacity-50 shadow-2xl z-50',
        !isEditMode && 'hover:shadow-card-hover hover:scale-[1.02]'
      )}
    >
      {isEditMode && (
        <>
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 p-1 rounded cursor-grab hover:bg-muted"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}

      <div className={cn("flex items-start justify-between", isEditMode && "mt-6")}>
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn('text-2xl font-bold', valueVariantStyles[variant])}>
            {value}
          </p>
          {change !== undefined && !isEditMode && (
            <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
              {getTrendIcon()}
              <span className="font-medium">{Math.abs(change)}%</span>
              {changeLabel && (
                <span className="text-muted-foreground ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-xl transition-transform',
            !isEditMode && 'group-hover:scale-110',
            iconVariantStyles[variant]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {!isEditMode && (
        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}
