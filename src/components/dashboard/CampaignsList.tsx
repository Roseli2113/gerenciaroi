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

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused';
  budget: number;
  spent: number;
  cpa: number;
  roi: number;
  sales: number;
}

const campaigns: Campaign[] = [
  { id: '1', name: 'Conversão - Produto Premium', status: 'active', budget: 500, spent: 342.50, cpa: 8.50, roi: 245, sales: 42 },
  { id: '2', name: 'Tráfego - Blog Posts', status: 'active', budget: 200, spent: 156.80, cpa: 12.30, roi: 180, sales: 28 },
  { id: '3', name: 'Remarketing - Carrinho', status: 'paused', budget: 300, spent: 0, cpa: 5.20, roi: 320, sales: 0 },
  { id: '4', name: 'Awareness - Marca', status: 'active', budget: 150, spent: 98.40, cpa: 18.90, roi: 95, sales: 12 },
  { id: '5', name: 'Lead Generation', status: 'active', budget: 250, spent: 180.20, cpa: 9.80, roi: 210, sales: 35 },
];

export function CampaignsList() {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Campanhas Ativas</h3>
            <p className="text-sm text-muted-foreground">Gerencie suas campanhas do Meta Ads</p>
          </div>
          <Button variant="outline" size="sm">Ver todas</Button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
          >
            {/* Status Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'rounded-full w-10 h-10',
                campaign.status === 'active'
                  ? 'bg-success/20 text-success hover:bg-success/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {campaign.status === 'active' ? (
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
                  variant={campaign.status === 'active' ? 'default' : 'secondary'}
                  className={cn(
                    'text-xs',
                    campaign.status === 'active' && 'bg-success/20 text-success border-0'
                  )}
                >
                  {campaign.status === 'active' ? 'Ativa' : 'Pausada'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Orçamento: R$ {campaign.budget.toFixed(2)}
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
                  campaign.cpa < 10 ? 'text-success' : campaign.cpa > 15 ? 'text-destructive' : 'text-warning'
                )}>
                  R$ {campaign.cpa.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">ROI</p>
                <div className={cn(
                  'flex items-center gap-1 font-semibold',
                  campaign.roi > 150 ? 'text-success' : campaign.roi < 100 ? 'text-destructive' : 'text-warning'
                )}>
                  {campaign.roi > 150 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {campaign.roi}%
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
                <DropdownMenuItem>Editar Orçamento</DropdownMenuItem>
                <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                <DropdownMenuItem>Criar Regra</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Pausar Campanha</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}
