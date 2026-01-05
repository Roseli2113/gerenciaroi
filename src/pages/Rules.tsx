import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Zap, TrendingUp, TrendingDown, Pause, DollarSign, Clock, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Rule {
  id: string;
  name: string;
  condition: string;
  action: string;
  frequency: string;
  isActive: boolean;
  appliedTo: string;
  executions: number;
  lastExecution?: string;
}

const rules: Rule[] = [
  {
    id: '1',
    name: 'Aumentar orçamento se CPA baixo',
    condition: 'Se CPA < R$ 5,00',
    action: 'Aumentar orçamento em 20%',
    frequency: 'A cada 30 min',
    isActive: true,
    appliedTo: 'Todas as campanhas',
    executions: 15,
    lastExecution: 'há 25 min',
  },
  {
    id: '2',
    name: 'Pausar se CPA alto',
    condition: 'Se CPA > R$ 15,00',
    action: 'Pausar campanha',
    frequency: 'A cada 1 hora',
    isActive: true,
    appliedTo: 'Conversão - Produto Premium',
    executions: 3,
    lastExecution: 'há 2 horas',
  },
  {
    id: '3',
    name: 'Escalar ROI positivo',
    condition: 'Se ROI > 150%',
    action: 'Aumentar orçamento em 30%',
    frequency: 'A cada 2 horas',
    isActive: false,
    appliedTo: 'Lead Generation',
    executions: 8,
    lastExecution: 'há 1 dia',
  },
  {
    id: '4',
    name: 'Cortar gastos sem vendas',
    condition: 'Se gastos > R$ 100 sem vendas',
    action: 'Pausar campanha',
    frequency: 'A cada 30 min',
    isActive: true,
    appliedTo: 'Todas as campanhas',
    executions: 2,
    lastExecution: 'há 4 horas',
  },
];

const Rules = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <MainLayout title="Regras Automáticas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Configure regras para automatizar o gerenciamento das suas campanhas
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2">
                <Plus className="w-4 h-4" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Regra</DialogTitle>
                <DialogDescription>
                  Configure as condições e ações para sua regra automática
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Regra</Label>
                  <Input id="name" placeholder="Ex: Pausar se CPA alto" />
                </div>
                <div className="space-y-2">
                  <Label>Aplicar em</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as campanhas</SelectItem>
                      <SelectItem value="campaign1">Conversão - Produto Premium</SelectItem>
                      <SelectItem value="campaign2">Tráfego - Blog Posts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Condição</Label>
                    <Select defaultValue="cpa_greater">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpa_greater">CPA maior que</SelectItem>
                        <SelectItem value="cpa_less">CPA menor que</SelectItem>
                        <SelectItem value="roi_greater">ROI maior que</SelectItem>
                        <SelectItem value="roi_less">ROI menor que</SelectItem>
                        <SelectItem value="spend_greater">Gastos maior que</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input type="number" placeholder="15.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ação</Label>
                    <Select defaultValue="pause">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pause">Pausar campanha</SelectItem>
                        <SelectItem value="increase_budget">Aumentar orçamento</SelectItem>
                        <SelectItem value="decrease_budget">Diminuir orçamento</SelectItem>
                        <SelectItem value="activate">Ativar campanha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select defaultValue="30min">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15min">A cada 15 min</SelectItem>
                        <SelectItem value="30min">A cada 30 min</SelectItem>
                        <SelectItem value="1hour">A cada 1 hora</SelectItem>
                        <SelectItem value="2hours">A cada 2 horas</SelectItem>
                        <SelectItem value="daily">Diariamente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="gradient-primary text-primary-foreground"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Criar Regra
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={cn(
              'transition-all hover:shadow-card-hover',
              rule.isActive ? 'border-primary/30' : 'border-border opacity-60'
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-xl',
                      rule.isActive ? 'bg-primary/20' : 'bg-muted'
                    )}>
                      <Zap className={cn(
                        'w-5 h-5',
                        rule.isActive ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {rule.appliedTo}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch checked={rule.isActive} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="bg-muted">
                    {rule.condition}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary" className={cn(
                    rule.action.includes('Pausar') 
                      ? 'bg-destructive/20 text-destructive border-0' 
                      : 'bg-success/20 text-success border-0'
                  )}>
                    {rule.action}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {rule.frequency}
                  </div>
                  <div className="flex items-center gap-1">
                    <History className="w-3 h-3" />
                    {rule.executions} execuções
                  </div>
                </div>

                {rule.lastExecution && (
                  <p className="text-xs text-muted-foreground">
                    Última execução: {rule.lastExecution}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Execution History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Execuções</CardTitle>
            <CardDescription>Últimas ações automáticas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { rule: 'Aumentar orçamento se CPA baixo', campaign: 'Conversão - Produto Premium', action: 'Orçamento aumentado de R$ 400 para R$ 480', time: 'há 25 min', type: 'increase' },
                { rule: 'Cortar gastos sem vendas', campaign: 'Awareness - Lançamento', action: 'Campanha pausada', time: 'há 4 horas', type: 'pause' },
                { rule: 'Pausar se CPA alto', campaign: 'Tráfego - Blog Posts', action: 'Campanha pausada', time: 'há 2 horas', type: 'pause' },
              ].map((log, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                  <div className={cn(
                    'p-2 rounded-lg',
                    log.type === 'increase' ? 'bg-success/20' : 'bg-destructive/20'
                  )}>
                    {log.type === 'increase' ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <Pause className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.rule} • {log.campaign}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{log.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Rules;
