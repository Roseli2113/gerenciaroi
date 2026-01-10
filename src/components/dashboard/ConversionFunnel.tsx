import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';

export function ConversionFunnel() {
  const { campaigns } = useMetaCampaigns();

  // Calculate real funnel data from campaigns
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const totalPageViews = campaigns.reduce((sum, c) => sum + (c.pageViews || 0), 0);
  const totalICs = campaigns.reduce((sum, c) => sum + (c.initiatedCheckout || 0), 0);
  const totalSales = campaigns.reduce((sum, c) => sum + (c.sales || 0), 0);

  const funnelData = [
    { 
      stage: 'Cliques', 
      value: totalClicks, 
      percentage: 100 
    },
    { 
      stage: 'Vis. Página', 
      value: totalPageViews, 
      percentage: totalClicks > 0 ? (totalPageViews / totalClicks) * 100 : 0 
    },
    { 
      stage: 'ICs', 
      value: totalICs, 
      percentage: totalClicks > 0 ? (totalICs / totalClicks) * 100 : 0 
    },
    { 
      stage: 'Vendas Inic.', 
      value: totalSales, 
      percentage: totalClicks > 0 ? (totalSales / totalClicks) * 100 : 0 
    },
    { 
      stage: 'Vendas Apr.', 
      value: totalSales, 
      percentage: totalClicks > 0 ? (totalSales / totalClicks) * 100 : 0 
    },
  ];

  const maxValue = funnelData[0].value || 1;

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
          const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
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
                    {item.percentage.toFixed(1)}%
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
