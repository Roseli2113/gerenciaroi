import { useNavigate } from 'react-router-dom';
import { Play, Pause, TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';

export function CampaignsList() {
  const navigate = useNavigate();
  const { campaigns, toggleCampaignStatus } = useMetaCampaigns();

  // Filter and sort campaigns - active first, then by spent
  const sortedCampaigns = [...campaigns]
    .sort((a, b) => {
      // Active campaigns first
      if (a.status && !b.status) return -1;
      if (!a.status && b.status) return 1;
      // Then by spent amount
      return b.spent - a.spent;
    })
    .slice(0, 5); // Show top 5 campaigns

  const handleToggleStatus = (campaignId: string, isActive: boolean) => {
    toggleCampaignStatus(campaignId, isActive);
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Campanhas Ativas</h3>
            <p className="text-sm text-muted-foreground">Gerencie suas campanhas do Meta Ads</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/campaigns')}
          >
            Ver todas
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {sortedCampaigns.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma campanha encontrada. Conecte sua conta Meta Ads para ver suas campanhas.
          </div>
        ) : (
          sortedCampaigns.map((campaign) => {
            const isActive = campaign.status;
            const roi = campaign.roi ? campaign.roi * 100 : 0;
            const cpa = campaign.cpa || 0;

            return (
              <div
                key={campaign.id}
                className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
              >
                {/* Status Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleStatus(campaign.id, isActive)}
                  className={cn(
                    'rounded-full w-10 h-10',
                    isActive
                      ? 'bg-success/20 text-success hover:bg-success/30'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {isActive ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>

                {/* Campaign Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground truncate">{campaign.name}</h4>
                    <Badge
                      variant={isActive ? 'default' : 'secondary'}
                      className={cn(
                        'text-xs',
                        isActive && 'bg-success/20 text-success border-0'
                      )}
                    >
                      {isActive ? 'Ativa' : 'Pausada'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Orçamento: R$ {(campaign.budget || 0).toFixed(2)}
                  </p>
                </div>

                {/* Metrics */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Gastos</p>
                    <p className="font-semibold text-foreground">
                      R$ {campaign.spent.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">CPA</p>
                    <p className={cn(
                      'font-semibold',
                      cpa < 10 ? 'text-success' : cpa > 15 ? 'text-destructive' : 'text-warning'
                    )}>
                      R$ {cpa.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <div className={cn(
                      'flex items-center gap-1 font-semibold',
                      roi > 150 ? 'text-success' : roi < 100 ? 'text-destructive' : 'text-warning'
                    )}>
                      {roi > 150 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {roi.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Vendas</p>
                    <p className="font-semibold text-foreground">{campaign.sales}</p>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-lg">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/campaigns')}>
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/rules')}>
                      Criar Regra
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleToggleStatus(campaign.id, isActive)}
                    >
                      {isActive ? 'Pausar Campanha' : 'Ativar Campanha'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
