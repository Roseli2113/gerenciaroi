import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { date: '01/01', gastos: 120, roi: 180 },
  { date: '02/01', gastos: 150, roi: 220 },
  { date: '03/01', gastos: 180, roi: 280 },
  { date: '04/01', gastos: 140, roi: 200 },
  { date: '05/01', gastos: 200, roi: 350 },
  { date: '06/01', gastos: 220, roi: 400 },
  { date: '07/01', gastos: 180, roi: 320 },
  { date: '08/01', gastos: 250, roi: 450 },
  { date: '09/01', gastos: 280, roi: 520 },
  { date: '10/01', gastos: 200, roi: 380 },
  { date: '11/01', gastos: 320, roi: 600 },
  { date: '12/01', gastos: 350, roi: 680 },
];

export function SpendingChart() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Gastos vs ROI</h3>
          <p className="text-sm text-muted-foreground">Comparativo diário</p>
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
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
          />
          <Area
            type="monotone"
            dataKey="gastos"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorGastos)"
            name="Gastos"
          />
          <Area
            type="monotone"
            dataKey="roi"
            stroke="hsl(142, 76%, 36%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorROI)"
            name="ROI"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
