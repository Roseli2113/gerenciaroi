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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Plus, Zap, TrendingUp, Pause, Clock, History, Pencil, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRules, Rule } from '@/hooks/useRules';

const Rules = () => {
  const { 
    rules, 
    executionLogs, 
    loading, 
    createRule, 
    updateRule, 
    deleteRule, 
    toggleRuleActive 
  } = useRules();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formAppliedTo, setFormAppliedTo] = useState('all');
  const [formConditionType, setFormConditionType] = useState('cpa_greater');
  const [formConditionValue, setFormConditionValue] = useState('');
  const [formActionType, setFormActionType] = useState('pause');
  const [formFrequency, setFormFrequency] = useState('30min');

  const resetForm = () => {
    setFormName('');
    setFormAppliedTo('all');
    setFormConditionType('cpa_greater');
    setFormConditionValue('');
    setFormActionType('pause');
    setFormFrequency('30min');
    setEditingRuleId(null);
  };

  const openEditDialog = (rule: Rule) => {
    setEditingRuleId(rule.id);
    setFormName(rule.name);
    setFormAppliedTo(rule.appliedTo);
    setFormConditionType(rule.conditionType);
    setFormConditionValue(rule.conditionValue);
    setFormActionType(rule.actionType);
    setFormFrequency(rule.frequency);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getConditionText = (type: string, value: string) => {
    switch (type) {
      case 'cpa_greater': return `Se CPA > R$ ${value}`;
      case 'cpa_less': return `Se CPA < R$ ${value}`;
      case 'roi_greater': return `Se ROI > ${value}%`;
      case 'roi_less': return `Se ROI < ${value}%`;
      case 'spend_greater': return `Se gastos > R$ ${value} sem vendas`;
      default: return '';
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'pause': return 'Pausar campanha';
      case 'increase_budget': return 'Aumentar orçamento em 20%';
      case 'decrease_budget': return 'Diminuir orçamento em 20%';
      case 'activate': return 'Ativar campanha';
      default: return '';
    }
  };

  const getAppliedToText = (value: string) => {
    switch (value) {
      case 'all': return 'Todas as campanhas';
      case 'campaign1': return 'Conversão - Produto Premium';
      case 'campaign2': return 'Tráfego - Blog Posts';
      default: return value;
    }
  };

  const getFrequencyText = (value: string) => {
    switch (value) {
      case '15min': return 'A cada 15 min';
      case '30min': return 'A cada 30 min';
      case '1hour': return 'A cada 1 hora';
      case '2hours': return 'A cada 2 horas';
      case 'daily': return 'Diariamente';
      default: return value;
    }
  };

  const handleSaveRule = async () => {
    if (!formName || !formConditionValue) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingRuleId) {
      await updateRule(editingRuleId, {
        name: formName,
        conditionType: formConditionType,
        conditionValue: formConditionValue,
        actionType: formActionType,
        frequency: formFrequency,
        appliedTo: formAppliedTo,
      });
    } else {
      await createRule({
        name: formName,
        conditionType: formConditionType,
        conditionValue: formConditionValue,
        actionType: formActionType,
        frequency: formFrequency,
        isActive: true,
        appliedTo: formAppliedTo,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleToggleActive = async (ruleId: string) => {
    await toggleRuleActive(ruleId);
  };

  const handleDeleteRule = async () => {
    if (deleteRuleId) {
      await deleteRule(deleteRuleId);
      setDeleteRuleId(null);
    }
  };

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
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gradient-primary text-primary-foreground gap-2">
                <Plus className="w-4 h-4" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingRuleId ? 'Editar Regra' : 'Criar Nova Regra'}</DialogTitle>
                <DialogDescription>
                  Configure as condições e ações para sua regra automática
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Regra</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Pausar se CPA alto" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aplicar em</Label>
                  <Select value={formAppliedTo} onValueChange={setFormAppliedTo}>
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
                    <Select value={formConditionType} onValueChange={setFormConditionType}>
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
                    <Input 
                      type="number" 
                      placeholder="15.00" 
                      value={formConditionValue}
                      onChange={(e) => setFormConditionValue(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ação</Label>
                    <Select value={formActionType} onValueChange={setFormActionType}>
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
                    <Select value={formFrequency} onValueChange={setFormFrequency}>
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
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button 
                  className="gradient-primary text-primary-foreground"
                  onClick={handleSaveRule}
                >
                  {editingRuleId ? 'Salvar Alterações' : 'Criar Regra'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma regra configurada</p>
              <p className="text-sm">Crie sua primeira regra automática clicando em "Nova Regra"</p>
            </div>
          ) : rules.map((rule) => (
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
                        {getAppliedToText(rule.appliedTo)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(rule)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteRuleId(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Switch 
                      checked={rule.isActive} 
                      onCheckedChange={() => handleToggleActive(rule.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="bg-muted">
                        {getConditionText(rule.conditionType, rule.conditionValue)}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary" className={cn(
                        rule.actionType === 'pause'
                      ? 'bg-destructive/20 text-destructive border-0' 
                      : 'bg-success/20 text-success border-0'
                  )}>
                        {getActionText(rule.actionType)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getFrequencyText(rule.frequency)}
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
              {executionLogs.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma execução registrada</p>
                </div>
              ) : executionLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                  <div className={cn(
                    'p-2 rounded-lg',
                    log.actionType === 'increase_budget' || log.actionType === 'activate' ? 'bg-success/20' : 'bg-destructive/20'
                  )}>
                    {log.actionType === 'increase_budget' || log.actionType === 'activate' ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <Pause className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{log.actionDescription}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.ruleName} • {log.campaignName}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{log.executedAt}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRuleId} onOpenChange={(open) => !open && setDeleteRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Regra</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta regra? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Rules;
