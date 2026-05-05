import { useMemo, useState } from 'react';
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
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  MinusCircle,
  Pause,
  Pencil,
  Play,
  Plus,
  Power,
  Settings2,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRules, Rule } from '@/hooks/useRules';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';

type ActionValueType = 'percentage' | 'amount';
type ActionOption = {
  value: string;
  title: string;
  description: string;
  icon: typeof Pause;
  tone: 'neutral' | 'success' | 'destructive' | 'warning';
};

const actionOptions: ActionOption[] = [
  {
    value: 'pause',
    title: 'Pausar campanha',
    description: 'Interrompe campanhas que baterem a condição.',
    icon: Pause,
    tone: 'destructive',
  },
  {
    value: 'pause_adset',
    title: 'Pausar conjunto',
    description: 'Pausa conjuntos de anúncios específicos.',
    icon: Pause,
    tone: 'destructive',
  },
  {
    value: 'pause_ad',
    title: 'Pausar anúncio',
    description: 'Pausa anúncios individuais com baixa performance.',
    icon: Pause,
    tone: 'destructive',
  },
  {
    value: 'increase_budget',
    title: 'Aumentar orçamento',
    description: 'Aumenta por porcentagem ou valor fixo em R$.',
    icon: TrendingUp,
    tone: 'success',
  },
  {
    value: 'decrease_budget',
    title: 'Diminuir orçamento',
    description: 'Reduz por porcentagem ou valor fixo em R$.',
    icon: TrendingDown,
    tone: 'warning',
  },
  {
    value: 'activate',
    title: 'Ativar campanha',
    description: 'Reativa campanhas pausadas automaticamente.',
    icon: Power,
    tone: 'success',
  },
];

const conditionOptions = [
  { value: 'cpa_greater', label: 'CPA maior que', placeholder: 'Ex: 15.00', suffix: 'R$' },
  { value: 'cpa_less', label: 'CPA menor que', placeholder: 'Ex: 8.00', suffix: 'R$' },
  { value: 'roi_greater', label: 'ROI maior que', placeholder: 'Ex: 120', suffix: '%' },
  { value: 'roi_less', label: 'ROI menor que', placeholder: 'Ex: 30', suffix: '%' },
  { value: 'spend_greater', label: 'Gastos maior que sem vendas', placeholder: 'Ex: 50.00', suffix: 'R$' },
];

const frequencyOptions = [
  { value: '10min', label: 'A cada 10 min' },
  { value: '15min', label: 'A cada 15 min' },
  { value: '30min', label: 'A cada 30 min' },
  { value: '1hour', label: 'A cada 1 hora' },
  { value: '2hours', label: 'A cada 2 horas' },
  { value: '3hours', label: 'A cada 3 horas' },
  { value: '6hours', label: 'A cada 6 horas' },
  { value: 'daily', label: 'Uma vez por dia' },
];

const percentagePresets = ['10', '20', '30', '50'];
const amountPresets = ['10', '20', '50', '100'];

const Rules = () => {
  const {
    rules,
    executionLogs,
    loading,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleActive,
    executeRules,
  } = useRules();
  const { campaigns, adSets } = useMetaCampaigns('today');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formAppliedTo, setFormAppliedTo] = useState('all');
  const [formTargetId, setFormTargetId] = useState<string>('');
  const [formConditionType, setFormConditionType] = useState('cpa_greater');
  const [formConditionValue, setFormConditionValue] = useState('');
  const [formActionType, setFormActionType] = useState('increase_budget');
  const [formActionValue, setFormActionValue] = useState<string>('20');
  const [formActionValueType, setFormActionValueType] = useState<ActionValueType>('percentage');
  const [formFrequency, setFormFrequency] = useState('30min');

  const activeRules = rules.filter((rule) => rule.isActive).length;
  const pausedRules = rules.length - activeRules;
  const budgetRules = rules.filter((rule) => rule.actionType === 'increase_budget' || rule.actionType === 'decrease_budget').length;
  const needsTarget = formAppliedTo === 'specific_campaign' || formAppliedTo === 'specific_adset';
  const isBudgetAction = formActionType === 'increase_budget' || formActionType === 'decrease_budget';
  const selectedCondition = conditionOptions.find((condition) => condition.value === formConditionType) || conditionOptions[0];
  const selectedAction = actionOptions.find((action) => action.value === formActionType) || actionOptions[0];
  const targetItems = formAppliedTo === 'specific_campaign' ? campaigns : adSets;

  const actionPreview = useMemo(() => {
    const value = formActionValue || '0';
    if (formActionType === 'increase_budget') {
      return `Aumentar o orçamento em ${formActionValueType === 'amount' ? `R$ ${value}` : `${value}%`}`;
    }
    if (formActionType === 'decrease_budget') {
      return `Diminuir o orçamento em ${formActionValueType === 'amount' ? `R$ ${value}` : `${value}%`}`;
    }
    return selectedAction.title;
  }, [formActionType, formActionValue, formActionValueType, selectedAction.title]);

  const resetForm = () => {
    setFormName('');
    setFormAppliedTo('all');
    setFormTargetId('');
    setFormConditionType('cpa_greater');
    setFormConditionValue('');
    setFormActionType('increase_budget');
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
    setFormActionValueType((rule.actionValueType as ActionValueType) || 'percentage');
    setFormFrequency(rule.frequency);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getConditionText = (type: string, value: string) => {
    switch (type) {
      case 'cpa_greater': return `CPA > R$ ${value}`;
      case 'cpa_less': return `CPA < R$ ${value}`;
      case 'roi_greater': return `ROI > ${value}%`;
      case 'roi_less': return `ROI < ${value}%`;
      case 'spend_greater': return `Gastos > R$ ${value} sem vendas`;
      default: return 'Condição personalizada';
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
      default: return 'Ação personalizada';
    }
  };

  const getAppliedToText = (value: string, targetId?: string | null) => {
    switch (value) {
      case 'all': return 'Todas as campanhas';
      case 'all_adsets': return 'Todos os conjuntos';
      case 'specific_campaign': {
        const campaign = campaigns.find((item) => item.id === targetId);
        return campaign ? `Campanha: ${campaign.name}` : 'Campanha específica';
      }
      case 'specific_adset': {
        const adSet = adSets.find((item) => item.id === targetId);
        return adSet ? `Conjunto: ${adSet.name}` : 'Conjunto específico';
      }
      case 'active_campaigns': return 'Campanhas ativas';
      case 'active_adsets': return 'Conjuntos ativos';
      case 'active_ads': return 'Anúncios ativos';
      case 'paused_campaigns': return 'Campanhas pausadas';
      case 'paused_adsets': return 'Conjuntos pausados';
      case 'paused_ads': return 'Anúncios pausados';
      default: return value;
    }
  };

  const getFrequencyText = (value: string) => frequencyOptions.find((option) => option.value === value)?.label || value;

  const getActionIcon = (actionType: string) => {
    const option = actionOptions.find((action) => action.value === actionType);
    return option?.icon || Zap;
  };

  const handleSaveRule = async () => {
    if (!formName.trim() || !formConditionValue) {
      toast.error('Preencha nome, condição e valor');
      return;
    }
    if (needsTarget && !formTargetId) {
      toast.error('Selecione a campanha ou conjunto');
      return;
    }
    if (isBudgetAction && (!formActionValue || Number(formActionValue) <= 0)) {
      toast.error('Informe o valor da ação de orçamento');
      return;
    }

    const payload = {
      name: formName.trim(),
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

  const handleDeleteRule = async () => {
    if (deleteRuleId) {
      await deleteRule(deleteRuleId);
      setDeleteRuleId(null);
    }
  };

  const handleExecuteNow = async () => {
    setIsExecuting(true);
    await executeRules();
    setIsExecuting(false);
  };

  return (
    <MainLayout title="Regras Automáticas">
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground">
              Automatize pausas, ativações e ajustes de orçamento por porcentagem ou valor fixo.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="gap-2"
              disabled={isExecuting || activeRules === 0}
              onClick={handleExecuteNow}
            >
              {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Executar agora
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="gradient-primary text-primary-foreground gap-2">
                  <Plus className="h-4 w-4" />
                  Nova regra
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-1.5rem)] max-w-4xl max-h-[92vh] overflow-y-auto p-0">
                <DialogHeader className="border-b border-border px-6 py-5">
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Settings2 className="h-5 w-5 text-primary" />
                    {editingRuleId ? 'Editar regra automática' : 'Criar nova regra automática'}
                  </DialogTitle>
                  <DialogDescription>
                    Escolha onde aplicar, defina a condição e selecione claramente a ação que será executada.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 px-6 py-5 lg:grid-cols-[1fr_320px]">
                  <div className="space-y-6">
                    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">1. Regra e alvo</h3>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome da regra</Label>
                        <Input
                          id="name"
                          placeholder="Ex: Aumentar 20% quando ROI passar de 120%"
                          value={formName}
                          onChange={(event) => setFormName(event.target.value)}
                        />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Aplicar em</Label>
                          <Select value={formAppliedTo} onValueChange={(value) => { setFormAppliedTo(value); setFormTargetId(''); }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o alvo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas as campanhas</SelectItem>
                              <SelectItem value="specific_campaign">Escolher uma campanha</SelectItem>
                              <SelectItem value="all_adsets">Todos os conjuntos</SelectItem>
                              <SelectItem value="specific_adset">Escolher um conjunto</SelectItem>
                              <SelectItem value="active_campaigns">Campanhas ativas</SelectItem>
                              <SelectItem value="active_adsets">Conjuntos ativos</SelectItem>
                              <SelectItem value="active_ads">Anúncios ativos</SelectItem>
                              <SelectItem value="paused_campaigns">Campanhas pausadas</SelectItem>
                              <SelectItem value="paused_adsets">Conjuntos pausados</SelectItem>
                              <SelectItem value="paused_ads">Anúncios pausados</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {needsTarget && (
                          <div className="space-y-2">
                            <Label>{formAppliedTo === 'specific_campaign' ? 'Campanha' : 'Conjunto'}</Label>
                            <Select value={formTargetId} onValueChange={setFormTargetId}>
                              <SelectTrigger>
                                <SelectValue placeholder={formAppliedTo === 'specific_campaign' ? 'Selecione uma campanha' : 'Selecione um conjunto'} />
                              </SelectTrigger>
                              <SelectContent>
                                {targetItems.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                ))}
                                {targetItems.length === 0 && (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum item disponível</div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">2. Condição</h3>
                      </div>
                      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                        <div className="space-y-2">
                          <Label>Quando acontecer</Label>
                          <Select value={formConditionType} onValueChange={setFormConditionType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a condição" />
                            </SelectTrigger>
                            <SelectContent>
                              {conditionOptions.map((condition) => (
                                <SelectItem key={condition.value} value={condition.value}>{condition.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Valor</Label>
                          <div className="relative">
                            {selectedCondition.suffix === 'R$' && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">R$</span>
                            )}
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder={selectedCondition.placeholder}
                              value={formConditionValue}
                              onChange={(event) => setFormConditionValue(event.target.value)}
                              className={cn(selectedCondition.suffix === 'R$' && 'pl-10', selectedCondition.suffix === '%' && 'pr-9')}
                            />
                            {selectedCondition.suffix === '%' && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold">3. Ação</h3>
                        </div>
                        <Badge variant="secondary" className="border-0 bg-primary/15 text-primary">
                          {actionPreview}
                        </Badge>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {actionOptions.map((action) => {
                          const Icon = action.icon;
                          const selected = formActionType === action.value;
                          return (
                            <button
                              key={action.value}
                              type="button"
                              onClick={() => setFormActionType(action.value)}
                              className={cn(
                                'rounded-lg border p-3 text-left transition-all hover:border-primary/60 hover:bg-primary/5',
                                selected ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-background/50'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <span className={cn(
                                  'rounded-md p-2',
                                  selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                )}>
                                  <Icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 space-y-1">
                                  <span className="block font-semibold text-foreground">{action.title}</span>
                                  <span className="block text-xs leading-relaxed text-muted-foreground">{action.description}</span>
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {isBudgetAction && (
                        <div className="space-y-4 rounded-lg border border-border bg-background/70 p-4">
                          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                            <div className="space-y-2">
                              <Label>Tipo de ajuste</Label>
                              <div className="grid grid-cols-2 rounded-lg border border-border bg-muted/30 p-1">
                                <button
                                  type="button"
                                  onClick={() => setFormActionValueType('percentage')}
                                  className={cn(
                                    'rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                                    formActionValueType === 'percentage'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'text-muted-foreground hover:text-foreground'
                                  )}
                                >
                                  Porcentagem
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFormActionValueType('amount')}
                                  className={cn(
                                    'rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                                    formActionValueType === 'amount'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'text-muted-foreground hover:text-foreground'
                                  )}
                                >
                                  Valor R$
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>{formActionValueType === 'amount' ? 'Valor fixo do ajuste' : 'Percentual do ajuste'}</Label>
                              <div className="relative">
                                {formActionValueType === 'amount' && (
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R$</span>
                                )}
                                <Input
                                  type="number"
                                  min="0"
                                  step={formActionValueType === 'amount' ? '0.01' : '1'}
                                  placeholder={formActionValueType === 'amount' ? '20.00' : '20'}
                                  value={formActionValue}
                                  onChange={(event) => setFormActionValue(event.target.value)}
                                  className={cn('h-11 text-lg font-semibold', formActionValueType === 'amount' ? 'pl-10' : 'pr-10')}
                                />
                                {formActionValueType === 'percentage' && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">%</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(formActionValueType === 'percentage' ? percentagePresets : amountPresets).map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setFormActionValue(preset)}
                                className={cn(
                                  'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                                  formActionValue === preset
                                    ? 'border-primary bg-primary/15 text-primary'
                                    : 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
                                )}
                              >
                                {formActionValueType === 'amount' ? `R$ ${preset}` : `${preset}%`}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                            <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                            <p>
                              A regra vai <strong className="text-foreground">{formActionType === 'increase_budget' ? 'aumentar' : 'diminuir'}</strong> o orçamento em{' '}
                              <strong className="text-foreground">
                                {formActionValueType === 'amount' ? `R$ ${formActionValue || '0'}` : `${formActionValue || '0'}%`}
                              </strong>{' '}
                              sempre que a condição for atendida.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">4. Frequência</h3>
                      </div>
                      <Select value={formFrequency} onValueChange={setFormFrequency}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencyOptions.map((frequency) => (
                            <SelectItem key={frequency.value} value={frequency.value}>{frequency.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <aside className="space-y-3 rounded-lg border border-border bg-card p-4 lg:sticky lg:top-0 lg:self-start">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">Resumo da regra</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="rounded-md bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">Alvo</p>
                        <p className="font-medium">{getAppliedToText(formAppliedTo, formTargetId)}</p>
                      </div>
                      <div className="rounded-md bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">Condição</p>
                        <p className="font-medium">{getConditionText(formConditionType, formConditionValue || '0')}</p>
                      </div>
                      <div className="rounded-md bg-primary/10 p-3">
                        <p className="text-xs text-muted-foreground">Ação</p>
                        <p className="font-semibold text-primary">{actionPreview}</p>
                      </div>
                      <div className="rounded-md bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">Frequência</p>
                        <p className="font-medium">{getFrequencyText(formFrequency)}</p>
                      </div>
                    </div>
                  </aside>
                </div>

                <DialogFooter className="border-t border-border px-6 py-4">
                  <Button variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}>
                    Cancelar
                  </Button>
                  <Button className="gradient-primary text-primary-foreground" onClick={handleSaveRule}>
                    {editingRuleId ? 'Salvar alterações' : 'Criar regra'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/15 p-2 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rules.length}</p>
                <p className="text-sm text-muted-foreground">Regras criadas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-success/15 p-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeRules}</p>
                <p className="text-sm text-muted-foreground">Ativas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-warning/15 p-2 text-warning">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{budgetRules}</p>
                <p className="text-sm text-muted-foreground">Ajustam orçamento</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                <Pause className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pausedRules}</p>
                <p className="text-sm text-muted-foreground">Desativadas</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-border py-14 text-center text-muted-foreground">
              <Zap className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg font-medium text-foreground">Nenhuma regra configurada</p>
              <p className="text-sm">Crie sua primeira automação com ações de pausa, ativação ou orçamento.</p>
            </div>
          ) : rules.map((rule) => {
            const ActionIcon = getActionIcon(rule.actionType);
            const isBudgetRule = rule.actionType === 'increase_budget' || rule.actionType === 'decrease_budget';
            return (
              <Card key={rule.id} className={cn('transition-all hover:shadow-card-hover', rule.isActive ? 'border-primary/30' : 'opacity-70')}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={cn('rounded-lg p-2', rule.isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                        <ActionIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{rule.name}</CardTitle>
                        <CardDescription className="mt-1 text-xs">
                          {getAppliedToText(rule.appliedTo, rule.targetId)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(rule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteRuleId(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Switch checked={rule.isActive} onCheckedChange={() => toggleRuleActive(rule.id)} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="secondary" className="bg-muted">{getConditionText(rule.conditionType, rule.conditionValue)}</Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="secondary" className={cn('border-0', isBudgetRule || rule.actionType === 'activate' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive')}>
                      {getActionText(rule)}
                    </Badge>
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {getFrequencyText(rule.frequency)}
                    </div>
                    <div className="flex items-center gap-1.5 sm:justify-end">
                      <History className="h-3.5 w-3.5" />
                      {rule.executions} execuções
                    </div>
                  </div>
                  {rule.lastExecution && (
                    <div className="flex flex-col gap-2 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                      <span>Última execução: {rule.lastExecution}</span>
                      {rule.lastExecutionResult && (
                        <div className="flex items-center gap-1.5">
                          {rule.lastExecutionResult === 'success' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          ) : rule.lastExecutionResult === 'partial' ? (
                            <MinusCircle className="h-3.5 w-3.5 text-warning" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className={cn(
                            'font-medium',
                            rule.lastExecutionResult === 'success' ? 'text-success' :
                              rule.lastExecutionResult === 'partial' ? 'text-warning' : 'text-muted-foreground'
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
            );
          })}
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Execuções</CardTitle>
            <CardDescription>Últimas ações automáticas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executionLogs.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  <History className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>Nenhuma execução registrada</p>
                </div>
              ) : executionLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 rounded-lg bg-muted/30 p-3">
                  <div className={cn(
                    'rounded-lg p-2',
                    log.actionType === 'increase_budget' || log.actionType === 'activate' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                  )}>
                    {log.actionType === 'increase_budget' || log.actionType === 'activate' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{log.actionDescription}</p>
                    <p className="truncate text-xs text-muted-foreground">{log.ruleName} • {log.campaignName}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{log.executedAt}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteRuleId} onOpenChange={(open) => !open && setDeleteRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir regra</AlertDialogTitle>
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
