import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const data = [
  { name: 'Conversão A', cpa: 8.50, color: 'hsl(142, 76%, 36%)' },
  { name: 'Tráfego B', cpa: 12.30, color: 'hsl(38, 92%, 50%)' },
  { name: 'Remarketing', cpa: 5.20, color: 'hsl(217, 91%, 60%)' },
  { name: 'Awareness', cpa: 18.90, color: 'hsl(0, 84%, 60%)' },
  { name: 'Lead Gen', cpa: 9.80, color: 'hsl(265, 89%, 66%)' },
];

export function CPAChart() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">CPA por Campanha</h3>
          <p className="text-sm text-muted-foreground">Custo por aquisição</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
          <XAxis 
            type="number" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$${value}`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'CPA']}
          />
          <Bar 
            dataKey="cpa" 
            radius={[0, 8, 8, 0]}
            maxBarSize={40}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
