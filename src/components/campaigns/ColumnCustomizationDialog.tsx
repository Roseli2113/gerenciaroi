import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, X, Search } from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

export interface ColumnConfig {
  id: string;
  label: string;
  description?: string;
  visible: boolean;
}

const ALL_COLUMNS: Omit<ColumnConfig, 'visible'>[] = [
  { id: 'ciclo', label: 'Ciclo' },
  { id: 'cartao', label: 'Cartão' },
  { id: 'statusConta', label: 'Status da Conta' },
  { id: 'totalGasto', label: 'Total Gasto' },
  { id: 'orcamento', label: 'Orçamento' },
  { id: 'cpa', label: 'CPA' },
  { id: 'custosProduto', label: 'Custos de Produto' },
  { id: 'conversas', label: '[Conversas] - Conversas Iniciadas' },
  { id: 'custoConversa', label: '[Custo / Conversa] - Custo por Conversa Iniciada' },
  { id: 'vendas', label: 'Vendas' },
  { id: 'gastos', label: 'Gastos' },
  { id: 'faturamento', label: 'Faturamento' },
  { id: 'lucro', label: 'Lucro' },
  { id: 'roas', label: 'ROAS' },
  { id: 'margem', label: 'Margem' },
  { id: 'roi', label: 'ROI' },
  { id: 'ic', label: '[IC] - Finalização de compra iniciada' },
  { id: 'cadastros', label: 'Cadastros' },
  { id: 'cpl', label: '[CPL] - Custo por Cadastro' },
  { id: 'cpi', label: '[CPI] - Custo por finalização de compra iniciada' },
  { id: 'cpc', label: '[CPC] - Custo por clique' },
  { id: 'ctr', label: 'CTR' },
  { id: 'cpm', label: 'CPM' },
  { id: 'impressoes', label: 'Impressões' },
  { id: 'cliques', label: 'Cliques' },
  { id: 'visPag', label: '[Vis. de pág.] - Visualizações de página' },
  { id: 'cpv', label: '[CPV] - Custo por visualização de página' },
  { id: 'vendasPendentes', label: 'Vendas Pendentes' },
  { id: 'cpp', label: '[CPP] - Custo por vendas pendentes' },
  { id: 'vendasTotais', label: 'Vendas Totais' },
  { id: 'cpt', label: '[CPT] - Custo por vendas totais' },
  { id: 'ca', label: '[CA] - Conta de anúncio' },
  { id: 'arpu', label: '[ARPU] - Receita gerada por usuário' },
  { id: 'icr', label: '[ICR] - Taxa de ICs = ICs / vis. de pág. (%)' },
  { id: 'con', label: '[CON] - Taxa de conexão = Vis. de pág. / cliques (%)' },
  { id: 'conversao', label: '[Conversão] - Vendas / vis. de pág. (%)' },
  { id: 'retencao', label: '[Retenção] - Vídeos assistidos 3 seg / vídeos iniciados (%)' },
  { id: 'hook', label: '[Hook] - Vídeos assistidos 3 seg / impressões (%)' },
  { id: 'frequencia', label: 'Frequência' },
  { id: 'faturamentoBruto', label: 'Faturamento bruto' },
  { id: 'faturamentoPendente', label: 'Faturamento pendente' },
  { id: 'convCheck', label: '[Conv. Check.] - Conversão do Checkout' },
  { id: 'convCliques', label: '[Conv. Cliques] - Conversão de Cliques' },
  { id: 'holdRate', label: '[Hold Rate] - Vídeos assistidos 75% / impressões (%)' },
  { id: 'conversaoBody', label: '[Conversão do Body] - (Compras / Vídeos assistidos 75%) (%)' },
  { id: 'retencaoBody', label: '[Retenção do Body] - Vídeos assistidos 75% / Vídeos iniciados (%)' },
  { id: 'cta', label: '[CTA] - (Cliques no Link / Vídeos assistidos 75%) (%)' },
  { id: 'playRateHook', label: '[Play Rate do Hook] - Vídeos iniciados / Impressões (%)' },
  { id: 'retencaoVideo75', label: '[Retenção de Vídeo (75%)] - Taxa de Retenção de Vídeo (75%)' },
  { id: 'criacao', label: 'Criação' },
  { id: 'veiculacao', label: 'Veiculação' },
  { id: 'vendasRecusadas', label: 'Vendas Recusadas' },
  { id: 'ids', label: '[ID] - IDs de Campanhas, Conjuntos, Anúncios e Contas' },
  { id: 'ultimaAtualizacao', label: 'Última Atualização' },
  { id: 'vendasReemb', label: '[Vendas Reemb.] - Vendas Reembolsadas' },
  { id: 'faturamentoReemb', label: '[Faturamento Reemb.] - Faturamento Reembolsadas' },
  { id: 'seguidores', label: '[Seguidores] - Seguidores no Instagram' },
  { id: 'cps', label: '[CPS] - Custo por Seguidor no Instagram' },
];

const DEFAULT_VISIBLE = ['orcamento', 'gastos', 'vendas', 'faturamento', 'lucro', 'cpa', 'roi', 'impressoes'];

interface SortableItemProps {
  column: ColumnConfig;
  onRemove: (id: string) => void;
}

function SortableItem({ column, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 bg-muted/50 rounded border border-border group",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" {...attributes} {...listeners} />
      <span className="flex-1 text-sm truncate">{column.label.split(' - ')[0].replace(/[\[\]]/g, '')}</span>
      <button
        onClick={() => onRemove(column.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}

interface ColumnCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnConfig[];
  onSave: (columns: ColumnConfig[]) => void;
}

export function ColumnCustomizationDialog({
  open, onOpenChange, columns, onSave
}: ColumnCustomizationDialogProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (open) {
      if (columns.length > 0) {
        setLocalColumns(columns);
      } else {
        // Initialize with defaults
        setLocalColumns(ALL_COLUMNS.map(col => ({
          ...col,
          visible: DEFAULT_VISIBLE.includes(col.id)
        })));
      }
    }
  }, [open, columns]);

  const visibleColumns = localColumns.filter(c => c.visible);
  const hiddenColumns = localColumns.filter(c => !c.visible);

  const filteredAll = localColumns.filter(c =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (id: string) => {
    setLocalColumns(prev => {
      const col = prev.find(c => c.id === id);
      if (!col) return prev;
      
      if (!col.visible) {
        // Adding: remove from current position, append to end as visible
        const without = prev.filter(c => c.id !== id);
        return [...without, { ...col, visible: true }];
      } else {
        // Removing: just toggle visibility
        return prev.map(c => c.id === id ? { ...c, visible: false } : c);
      }
    });
  };

  const handleRemove = (id: string) => {
    setLocalColumns(prev =>
      prev.map(c => c.id === id ? { ...c, visible: false } : c)
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = visibleColumns.findIndex(c => c.id === active.id);
      const newIndex = visibleColumns.findIndex(c => c.id === over.id);
      const reordered = arrayMove(visibleColumns, oldIndex, newIndex);
      
      // Rebuild full array with new order for visible columns
      const newColumns = [...hiddenColumns, ...reordered.map(c => ({ ...c, visible: true }))];
      setLocalColumns(newColumns);
    }
  };

  const handleSave = () => {
    onSave(localColumns);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col w-[95vw] md:w-auto">
        <DialogHeader>
          <DialogTitle>Personalize as colunas</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Escolha como você quer visualizar as colunas na tabela.
          </p>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 gap-4 overflow-hidden">
          {/* Left side - All columns with checkboxes */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por coluna"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="space-y-1 pr-4 pb-2">
                {filteredAll.map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={column.visible}
                      onCheckedChange={() => handleToggle(column.id)}
                    />
                    <span className="text-sm">{column.label}</span>
                  </label>
                ))}
                {filteredAll.length === 0 && (
                  <p className="text-sm text-muted-foreground p-2">
                    Nenhuma coluna encontrada
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right side - Selected columns with drag */}
          <div className="w-full md:w-72 flex flex-col overflow-hidden border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-4 min-h-[200px] max-h-[40vh] md:max-h-none">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-medium text-sm">Campanha</span>
            </div>
            <ScrollArea className="flex-1 overflow-y-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={visibleColumns.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 pr-2 pb-2">
                    {visibleColumns.map((column) => (
                      <SortableItem key={column.id} column={column} onRemove={handleRemove} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ALL_COLUMNS, DEFAULT_VISIBLE };
