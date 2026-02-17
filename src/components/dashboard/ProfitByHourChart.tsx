import { useMemo } from 'react';
import {
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { useSales, type SalesFilters } from '@/hooks/useSales';

interface ProfitByHourChartProps {
  filters?: SalesFilters;
}

export function ProfitByHourChart({ filters }: ProfitByHourChartProps) {
  const { sales } = useSales(filters);

  const data = useMemo(() => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      receita: 0,
      reembolsos: 0,
    }));

    sales.forEach(sale => {
      const hour = new Date(sale.created_at).getHours();
      if (sale.status === 'approved' || sale.status === 'paid') {
        hourlyData[hour].receita += Number(sale.amount);
      } else if (sale.status === 'refunded' || sale.status === 'chargedback') {
        hourlyData[hour].reembolsos += Number(sale.amount);
      }
    });

    return hourlyData;
  }, [sales]);

  const formatCurrency = (value: number) => `R$ ${value.toFixed(0)}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground">
              {entry.dataKey === 'receita' ? 'Receita' : 'Reembolsos'}:
            </span>
            <span className="font-semibold text-foreground">
              R$ {Math.abs(entry.value).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Receita por Horário</h3>
          <p className="text-sm text-muted-foreground">Receita e reembolsos ao longo do dia</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: 'hsl(217, 91%, 60%)' }} />
            <span className="text-sm text-muted-foreground">Receita</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: 'hsl(0, 72%, 51%)' }} />
            <span className="text-sm text-muted-foreground">Reembolsos</span>
          </div>
        </div>
      </div>

      {data.every(d => d.receita === 0 && d.reembolsos === 0) ? (
        <div className="flex items-center justify-center h-[85%] text-muted-foreground">
          Nenhum dado disponível
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="refundBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.4} />
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
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="reembolsos"
              fill="url(#refundBarGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
            <Area
              type="monotone"
              dataKey="receita"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 5, fill: 'hsl(217, 91%, 60%)', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
