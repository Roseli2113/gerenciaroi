const funnelData = [
  { stage: 'Cliques', value: 15420, percentage: 100 },
  { stage: 'Vis. Página', value: 14458, percentage: 93.8 },
  { stage: 'ICs', value: 4826, percentage: 31.3 },
  { stage: 'Vendas Inic.', value: 856, percentage: 5.5 },
  { stage: 'Vendas Apr.', value: 724, percentage: 4.7 },
];

export function ConversionFunnel() {
  const maxValue = funnelData[0].value;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Funil de Conversão</h3>
          <p className="text-sm text-muted-foreground">Meta Ads</p>
        </div>
      </div>

      <div className="space-y-4">
        {funnelData.map((item, index) => {
          const width = (item.value / maxValue) * 100;
          const opacity = 1 - (index * 0.15);
          
          return (
            <div key={item.stage} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {item.value.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-primary font-medium">
                    {item.percentage}%
                  </span>
                </div>
              </div>
              <div className="h-8 w-full bg-muted/30 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-500 gradient-primary"
                  style={{ 
                    width: `${width}%`,
                    opacity: opacity,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
