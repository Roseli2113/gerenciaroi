import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';
import { useMemo } from 'react';

export function SpendingChart() {
  const { campaigns } = useMetaCampaigns();

  // Generate chart data from campaigns - aggregate by date or use campaign data
  const data = useMemo(() => {
    if (campaigns.length === 0) {
      return [];
    }

    // Create data points from campaigns
    const chartData = campaigns
      .filter(c => c.spent > 0)
      .slice(0, 12)
      .map((campaign, index) => ({
        date: campaign.name.slice(0, 15) || `Camp ${index + 1}`,
        gastos: campaign.spent,
        roi: campaign.roi ? campaign.spent * campaign.roi : 0,
      }));

    return chartData;
  }, [campaigns]);

  const formatCurrency = (value: number) => `R$ ${value.toFixed(0)}`;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Gastos vs ROI</h3>
          <p className="text-sm text-muted-foreground">Comparativo por campanha</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Gastos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">ROI</span>
          </div>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[85%] text-muted-foreground">
          Nenhum dado disponível
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorROI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => [
                `R$ ${value.toFixed(2)}`, 
                name === 'gastos' ? 'Gastos' : 'ROI (R$)'
              ]}
            />
            <Area
              type="monotone"
              dataKey="gastos"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGastos)"
              name="gastos"
            />
            <Area
              type="monotone"
              dataKey="roi"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorROI)"
              name="roi"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
