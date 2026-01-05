import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'primary';
  className?: string;
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

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = 'default',
  className,
}: MetricCardProps) {
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
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] group',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn('text-2xl font-bold', valueVariantStyles[variant])}>
            {value}
          </p>
          {change !== undefined && (
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
            'p-3 rounded-xl transition-transform group-hover:scale-110',
            iconVariantStyles[variant]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Decorative gradient */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
