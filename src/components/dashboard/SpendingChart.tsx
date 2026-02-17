import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';
import { useMemo } from 'react';

export function SpendingChart() {
  const { campaigns } = useMetaCampaigns();

  const data = useMemo(() => {
    if (campaigns.length === 0) return [];

    return campaigns
      .filter(c => c.spent > 0)
      .slice(0, 10)
      .map((campaign, index) => ({
        name: campaign.name.length > 18 ? campaign.name.slice(0, 18) + '…' : campaign.name || `Camp ${index + 1}`,
        gastos: campaign.spent,
        roi: campaign.roi ? campaign.roi * 100 : 0,
      }));
  }, [campaigns]);

  const formatCurrency = (value: number) => `R$ ${value.toFixed(0)}`;
  const formatROI = (value: number) => `${value.toFixed(0)}%`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground">{entry.name === 'gastos' ? 'Gastos' : 'ROI'}:</span>
            <span className="font-semibold text-foreground">
              {entry.name === 'gastos' ? `R$ ${entry.value.toFixed(2)}` : `${entry.value.toFixed(1)}%`}
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
          <h3 className="text-lg font-semibold text-foreground">Gastos vs ROI</h3>
          <p className="text-sm text-muted-foreground">Comparativo por campanha</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-sm text-muted-foreground">Gastos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(142, 76%, 36%)' }} />
            <span className="text-sm text-muted-foreground">ROI %</span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[85%] text-muted-foreground">
          Nenhum dado disponível
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              angle={-35}
              textAnchor="end"
              height={60}
            />
            <YAxis
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="hsl(142, 76%, 36%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatROI}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="left"
              dataKey="gastos"
              fill="url(#barGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
              name="gastos"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roi"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={3}
              dot={{ fill: 'hsl(142, 76%, 36%)', r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
              activeDot={{ r: 7 }}
              name="roi"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
