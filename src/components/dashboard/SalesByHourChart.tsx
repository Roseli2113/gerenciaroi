import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSales, type SalesFilters } from '@/hooks/useSales';

interface SalesByHourChartProps {
  filters?: SalesFilters;
}

export function SalesByHourChart({ filters }: SalesByHourChartProps) {
  const { sales } = useSales(filters);

  const data = useMemo(() => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      vendas: 0,
    }));

    sales.forEach(sale => {
      if (sale.status === 'approved' || sale.status === 'paid') {
        const date = new Date(sale.created_at);
        // Use local timezone hour to match what the user sees on their clock
        const hour = date.getHours();
        hourlyData[hour].vendas += 1;
      }
    });

    return hourlyData;
  }, [sales]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(217, 91%, 60%)' }} />
          <span className="text-muted-foreground">Vendas:</span>
          <span className="font-semibold text-foreground">{payload[0].value}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Vendas por Horário</h3>
          <p className="text-sm text-muted-foreground">Quantidade de vendas ao longo do dia</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: 'hsl(217, 91%, 60%)' }} />
          <span className="text-sm text-muted-foreground">Vendas</span>
        </div>
      </div>

      {data.every(d => d.vendas === 0) ? (
        <div className="flex items-center justify-center h-[85%] text-muted-foreground">
          Nenhum dado disponível
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="hour"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="vendas"
              fill="url(#salesBarGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
