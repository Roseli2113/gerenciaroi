import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Metric explanations dictionary
const METRIC_EXPLANATIONS: Record<string, string> = {
  orcamento: 'Orçamento definido para a campanha ou conjunto',
  gastos: 'Total gasto em anúncios',
  impressoes: 'Número de vezes que o anúncio foi exibido',
  cpm: 'Custo por mil impressões',
  cliques: 'Número total de cliques no anúncio',
  cpc: 'Custo por cada clique no link',
  ctr: 'Taxa de cliques = Cliques / Impressões (%)',
  frequencia: 'Média de vezes que cada pessoa viu o anúncio',
  playRateHook: 'Vídeos iniciados / Impressões (%)',
  holdRate: 'Vídeos assistidos 75% / Impressões (%)',
  cta: 'Cliques no Link / Vídeos assistidos 75% (%)',
  visPag: 'Visualizações de página de destino',
  cpv: 'Custo por visualização de página',
  ic: 'Finalizações de compra iniciadas',
  cpi: 'Custo por finalização de compra iniciada',
  convCheck: 'Conversão do Checkout = Vendas / ICs (%)',
  vendas: 'Número total de vendas',
  faturamento: 'Receita total gerada',
  cpa: 'Custo por aquisição = Gastos / Vendas',
  roas: 'Retorno sobre investimento em anúncios = Faturamento / Gastos',
  lucro: 'Lucro = Faturamento - Gastos',
  roi: 'Retorno sobre investimento = Faturamento / Gastos',
  margem: 'Margem de lucro = (Faturamento - Gastos) / Faturamento (%)',
  vendasRecusadas: 'Vendas que foram recusadas',
  vendasReemb: 'Vendas que foram reembolsadas',
  vendasTotais: 'Total de todas as vendas incluindo pendentes',
  con: 'Taxa de conexão = Vis. de pág. / Cliques (%)',
  icr: 'Taxa de ICs = ICs / Vis. de pág. (%)',
  conversao: 'Vendas / Vis. de pág. (%)',
  retencao: 'Vídeos assistidos 3 seg / vídeos iniciados (%)',
  hook: 'Vídeos assistidos 3 seg / impressões (%)',
  cadastros: 'Número de cadastros/leads gerados',
  cpl: 'Custo por cadastro/lead',
  arpu: 'Receita média gerada por usuário',
};

interface MetricTooltipProps {
  metricId: string;
  label: string;
  className?: string;
}

export function MetricTooltip({ metricId, label, className }: MetricTooltipProps) {
  const explanation = METRIC_EXPLANATIONS[metricId];

  if (!explanation) {
    return <span className={className}>{label}</span>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1 cursor-help", className)}>
            {label}
            <Info className="w-3 h-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { METRIC_EXPLANATIONS };
