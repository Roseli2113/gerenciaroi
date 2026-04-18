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
import { Plus, Zap, TrendingUp, Pause, Clock, History, Pencil, Trash2, Loader2, Play, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRules, Rule } from '@/hooks/useRules';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';

const Rules = () => {
  const { 
    rules, 
    executionLogs, 
    loading, 
    createRule, 
    updateRule, 
    deleteRule, 
    toggleRuleActive,
    executeRules 
  } = useRules();
  const { campaigns, adSets } = useMetaCampaigns('today');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formAppliedTo, setFormAppliedTo] = useState('all');
  const [formTargetId, setFormTargetId] = useState<string>('');
  const [formConditionType, setFormConditionType] = useState('cpa_greater');
  const [formConditionValue, setFormConditionValue] = useState('');
  const [formActionType, setFormActionType] = useState('pause');
  const [formActionValue, setFormActionValue] = useState<string>('20');
  const [formActionValueType, setFormActionValueType] = useState<'percentage' | 'amount'>('percentage');
  const [formFrequency, setFormFrequency] = useState('30min');

  const resetForm = () => {
    setFormName('');
    setFormAppliedTo('all');
    setFormTargetId('');
    setFormConditionType('cpa_greater');
    setFormConditionValue('');
    setFormActionType('pause');
    setFormActionValue('20');
    setFormActionValueType('percentage');
    setFormFrequency('30min');
    setEditingRuleId(null);
  };

  const openEditDialog = (rule: Rule) => {
    setEditingRuleId(rule.id);
    setFormName(rule.name);
    setFormAppliedTo(rule.appliedTo);
    setFormTargetId(rule.targetId || '');
    setFormConditionType(rule.conditionType);
    setFormConditionValue(rule.conditionValue);
    setFormActionType(rule.actionType);
    setFormActionValue(rule.actionValue != null ? String(rule.actionValue) : '20');
    setFormActionValueType((rule.actionValueType as 'percentage' | 'amount') || 'percentage');
    setFormFrequency(rule.frequency);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const isBudgetAction = formActionType === 'increase_budget' || formActionType === 'decrease_budget';
  const needsTarget = formAppliedTo === 'specific_campaign' || formAppliedTo === 'specific_adset';

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

  const formatActionValue = (rule: Rule) => {
    if (rule.actionValue == null) return '';
    return rule.actionValueType === 'amount'
      ? `R$ ${Number(rule.actionValue).toFixed(2)}`
      : `${rule.actionValue}%`;
  };

  const getActionText = (rule: Rule) => {
    switch (rule.actionType) {
      case 'pause': return 'Pausar campanha';
      case 'pause_adset': return 'Pausar conjunto';
      case 'pause_ad': return 'Pausar anúncio';
      case 'increase_budget': return `Aumentar orçamento em ${formatActionValue(rule) || '20%'}`;
      case 'decrease_budget': return `Diminuir orçamento em ${formatActionValue(rule) || '20%'}`;
      case 'activate': return 'Ativar campanha';
      default: return '';
    }
  };

  const getAppliedToText = (value: string, targetId?: string | null) => {
    switch (value) {
      case 'all': return 'Todas as campanhas';
      case 'all_adsets': return 'Todos os conjuntos';
      case 'specific_campaign': {
        const c = campaigns.find(x => x.id === targetId);
        return c ? `Campanha: ${c.name}` : 'Escolher uma campanha';
      }
      case 'specific_adset': {
        const a = adSets.find(x => x.id === targetId);
        return a ? `Conjunto: ${a.name}` : 'Escolher um conjunto';
      }
      case 'active_campaigns': return 'Campanhas Ativas';
      case 'active_adsets': return 'Conjuntos Ativos';
      case 'active_ads': return 'Anúncios Ativos';
      case 'paused_campaigns': return 'Campanhas Pausadas';
      case 'paused_adsets': return 'Conjuntos Pausados';
      case 'paused_ads': return 'Anúncios Pausados';
      default: return value;
    }
  };

  const getFrequencyText = (value: string) => {
    switch (value) {
      case '10min': return 'A cada 10 min';
      case '15min': return 'A cada 15 min';
      case '30min': return 'A cada 30 min';
      case '1hour': return 'A cada 1 hora';
      case '2hours': return 'A cada 2 horas';
      case '3hours': return 'A cada 3 horas';
      case '6hours': return 'A cada 6 horas';
      case 'daily': return 'Uma vez por dia';
      default: return value;
    }
  };

  const handleSaveRule = async () => {
    if (!formName || !formConditionValue) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (needsTarget && !formTargetId) {
      toast.error('Selecione a campanha ou conjunto');
      return;
    }
    if (isBudgetAction && (!formActionValue || Number(formActionValue) <= 0)) {
      toast.error('Informe o valor da ação');
      return;
    }

    const payload = {
      name: formName,
      conditionType: formConditionType,
      conditionValue: formConditionValue,
      actionType: formActionType,
      actionValue: isBudgetAction ? Number(formActionValue) : null,
      actionValueType: isBudgetAction ? formActionValueType : 'percentage',
      frequency: formFrequency,
      appliedTo: formAppliedTo,
      targetId: needsTarget ? formTargetId : null,
    };

    if (editingRuleId) {
      await updateRule(editingRuleId, payload);
    } else {
      await createRule({ ...payload, isActive: true });
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              disabled={isExecuting || rules.filter(r => r.isActive).length === 0}
              onClick={async () => {
                setIsExecuting(true);
                await executeRules();
                setIsExecuting(false);
              }}
            >
              {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Executar Agora
            </Button>
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
                  <Select value={formAppliedTo} onValueChange={(v) => { setFormAppliedTo(v); setFormTargetId(''); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as campanhas</SelectItem>
                      <SelectItem value="specific_campaign">Escolher uma campanha</SelectItem>
                      <SelectItem value="all_adsets">Todos os conjuntos</SelectItem>
                      <SelectItem value="specific_adset">Escolher um conjunto</SelectItem>
                      <SelectItem value="active_campaigns">Campanhas Ativas</SelectItem>
                      <SelectItem value="active_adsets">Conjuntos Ativos</SelectItem>
                      <SelectItem value="active_ads">Anúncios Ativos</SelectItem>
                      <SelectItem value="paused_campaigns">Campanhas Pausadas</SelectItem>
                      <SelectItem value="paused_adsets">Conjuntos Pausados</SelectItem>
                      <SelectItem value="paused_ads">Anúncios Pausados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {needsTarget && (
                  <div className="space-y-2">
                    <Label>{formAppliedTo === 'specific_campaign' ? 'Campanha' : 'Conjunto'}</Label>
                    <Select value={formTargetId} onValueChange={setFormTargetId}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecione ${formAppliedTo === 'specific_campaign' ? 'uma campanha' : 'um conjunto'}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(formAppliedTo === 'specific_campaign' ? campaigns : adSets).map((item) => (
                          <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                        ))}
                        {(formAppliedTo === 'specific_campaign' ? campaigns : adSets).length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum item disponível</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                        <SelectItem value="pause_adset">Pausar conjunto</SelectItem>
                        <SelectItem value="pause_ad">Pausar anúncio</SelectItem>
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
                        <SelectItem value="10min">A cada 10 min</SelectItem>
                        <SelectItem value="15min">A cada 15 min</SelectItem>
                        <SelectItem value="30min">A cada 30 min</SelectItem>
                        <SelectItem value="1hour">A cada 1 hora</SelectItem>
                        <SelectItem value="2hours">A cada 2 horas</SelectItem>
                        <SelectItem value="3hours">A cada 3 horas</SelectItem>
                        <SelectItem value="6hours">A cada 6 horas</SelectItem>
                        <SelectItem value="daily">Uma vez por dia</SelectItem>
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Última execução: {rule.lastExecution}
                    </p>
                    {rule.lastExecutionResult && (
                      <div className="flex items-center gap-1.5">
                        {rule.lastExecutionResult === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        ) : rule.lastExecutionResult === 'partial' ? (
                          <MinusCircle className="w-3.5 h-3.5 text-yellow-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <span className={cn(
                          'text-xs font-medium',
                          rule.lastExecutionResult === 'success' ? 'text-success' :
                          rule.lastExecutionResult === 'partial' ? 'text-yellow-500' :
                          'text-muted-foreground'
                        )}>
                          {rule.lastExecutionResult === 'success' 
                            ? `${rule.lastExecutionAffected} afetado(s)` 
                            : rule.lastExecutionResult === 'partial'
                            ? `${rule.lastExecutionAffected} afetado(s) (parcial)`
                            : 'Sem correspondência'}
                        </span>
                      </div>
                    )}
                  </div>
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
