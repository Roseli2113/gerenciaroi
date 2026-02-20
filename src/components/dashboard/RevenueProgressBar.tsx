import { useMemo, useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';
import { useSales } from '@/hooks/useSales';

const PEAK_REVENUE_KEY = 'gerencia-roi-peak-revenue';

function getNextGoal(revenue: number): number {
  const bases = [1000, 10000, 50000, 100000, 500000, 1000000];
  let multiplier = 1;
  while (true) {
    for (const base of bases) {
      const goal = base * multiplier;
      if (revenue < goal) return goal;
    }
    multiplier *= 10;
  }
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toLocaleString('pt-BR')}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toLocaleString('pt-BR')}K`;
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function RevenueProgressBar() {
  const { metrics } = useSales();
  const currentRevenue = metrics.totalRevenue;

  // Peak revenue: only ever increases, never resets on sale deletion
  const [peakRevenue, setPeakRevenue] = useState<number>(() => {
    const stored = localStorage.getItem(PEAK_REVENUE_KEY);
    return stored ? parseFloat(stored) : 0;
  });

  useEffect(() => {
    if (currentRevenue > peakRevenue) {
      setPeakRevenue(currentRevenue);
      localStorage.setItem(PEAK_REVENUE_KEY, String(currentRevenue));
    }
  }, [currentRevenue, peakRevenue]);

  const revenue = peakRevenue;
  const goal = useMemo(() => getNextGoal(revenue), [revenue]);
  const percentage = Math.min((revenue / goal) * 100, 100);

  return (
    <div className="flex items-center gap-3 bg-card/80 border border-border rounded-xl px-4 py-2 min-w-[280px]">
      <TrendingUp className="w-4 h-4 text-success shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Faturado</span>
          <span className="font-semibold text-foreground">
            {formatCurrency(revenue)} / {formatCurrency(goal)}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
      <span className="text-xs font-bold text-primary whitespace-nowrap">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}
