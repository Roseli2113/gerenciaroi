import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Check, X, AlertTriangle, TrendingUp, Info, Zap, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Insight {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string | null;
  suggested_action: any;
  status: string;
  created_at: string;
  applied_at: string | null;
}

const SEVERITY_STYLES: Record<string, { icon: any; cls: string; label: string }> = {
  critical: { icon: AlertTriangle, cls: 'border-destructive/50 bg-destructive/5 text-destructive', label: 'Crítico' },
  warning: { icon: TrendingUp, cls: 'border-yellow-500/50 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400', label: 'Atenção' },
  info: { icon: Info, cls: 'border-blue-500/50 bg-blue-500/5 text-blue-600 dark:text-blue-400', label: 'Info' },
};

const CATEGORY_LABEL: Record<string, string> = {
  campaign: 'Campanha',
  sales: 'Vendas',
  funnel: 'Funil',
  rule: 'Regra',
};

export default function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<Insight | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [insightsRes, runsRes] = await Promise.all([
      supabase.from('ai_insights').select('*').eq('user_id', user.id).in('status', ['new', 'applied']).order('created_at', { ascending: false }).limit(50),
      supabase.from('ai_insights_runs').select('created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
    ]);
    setInsights((insightsRes.data || []) as Insight[]);
    setLastRun(runsRes.data?.[0]?.created_at || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: { trigger: 'manual' },
      });
      if (error) throw error;
      if (data?.skipped) {
        toast.info('Sem dados suficientes para analisar ainda. Conecte uma conta Meta e registre vendas.');
      } else {
        toast.success(`${data?.generated || 0} novas recomendações geradas!`, { position: 'top-center' });
      }
      await load();
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('429') || msg.includes('RATE_LIMIT')) toast.error('Muitas análises seguidas. Aguarde alguns segundos.');
      else if (msg.includes('402') || msg.includes('PAYMENT')) toast.error('Créditos de IA esgotados. Adicione em Settings → Workspace → Usage.');
      else toast.error('Erro ao gerar análise: ' + msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const dismiss = async (id: string) => {
    await supabase.from('ai_insights').update({ status: 'dismissed' }).eq('id', id);
    setInsights(prev => prev.filter(i => i.id !== id));
    toast.success('Recomendação descartada', { position: 'top-center' });
  };

  const applyAction = async (insight: Insight) => {
    const action = insight.suggested_action;
    if (!action) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (action.type === 'create_rule' && action.rule) {
        const r = action.rule;
        const { error } = await supabase.from('automation_rules').insert({
          user_id: user.id,
          name: r.name || `Regra IA - ${insight.title.slice(0, 40)}`,
          condition_type: r.condition_type,
          condition_value: String(r.condition_value),
          action_type: r.action_type,
          action_value: r.action_value || null,
          action_value_type: r.action_value_type || 'percentage',
          frequency: r.frequency || 'hourly',
          applied_to: r.applied_to || 'all',
          target_id: r.target_id || null,
          is_active: true,
        });
        if (error) throw error;
        toast.success('Regra criada e ativada!', { position: 'top-center' });
      } else {
        toast.info('Ação manual: aplique pelo painel de Campanhas.', { position: 'top-center' });
      }
      await supabase.from('ai_insights').update({ status: 'applied', applied_at: new Date().toISOString() }).eq('id', insight.id);
      await load();
    } catch (e: any) {
      toast.error('Erro ao aplicar: ' + (e?.message || ''));
    } finally {
      setConfirmAction(null);
    }
  };

  return (
    <MainLayout
      title="IA Insights"
      headerAction={
        <Button onClick={runAnalysis} disabled={analyzing} className="gap-2">
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {analyzing ? 'Analisando...' : 'Analisar agora'}
        </Button>
      }
    >
      <div className="space-y-6">
        <Card className="p-4 flex items-center gap-3 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <Zap className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Análise automática a cada hora</p>
            <p className="text-xs text-muted-foreground">
              {lastRun
                ? `Última análise ${formatDistanceToNow(new Date(lastRun), { addSuffix: true, locale: ptBR })}`
                : 'Aguardando primeira análise'}
              {' · '}
              {insights.length} recomendações ativas
            </p>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : insights.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-2">Nenhuma recomendação ainda</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Clique em "Analisar agora" para gerar suas primeiras recomendações de otimização.
            </p>
            <Button onClick={runAnalysis} disabled={analyzing} className="gap-2">
              <Sparkles className="w-4 h-4" />Gerar análise
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {insights.map(insight => {
              const sev = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;
              const SevIcon = sev.icon;
              const hasAction = !!insight.suggested_action;
              const isApplied = insight.status === 'applied';
              return (
                <Card key={insight.id} className={cn('p-5 border-l-4', sev.cls.split(' ').filter(c => c.startsWith('border-')).join(' '))}>
                  <div className="flex items-start gap-4">
                    <div className={cn('p-2 rounded-lg shrink-0', sev.cls)}>
                      <SevIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className="text-xs">{CATEGORY_LABEL[insight.category] || insight.category}</Badge>
                        <Badge variant="outline" className={cn('text-xs', sev.cls)}>{sev.label}</Badge>
                        {isApplied && <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/30">Aplicado</Badge>}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      {insight.recommendation && (
                        <div className="text-sm bg-muted/50 rounded-md p-3 mb-3 border-l-2 border-primary/40">
                          <span className="font-medium text-primary">💡 Recomendação: </span>
                          {insight.recommendation}
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {hasAction && !isApplied && (
                          <Button size="sm" onClick={() => setConfirmAction(insight)} className="gap-2">
                            <Check className="w-4 h-4" />
                            {insight.suggested_action.type === 'create_rule' ? 'Criar regra automática' : 'Aplicar'}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => dismiss(insight.id)} className="gap-2">
                          <X className="w-4 h-4" />Descartar
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>{confirmAction?.recommendation}</p>
                {confirmAction?.suggested_action?.type === 'create_rule' && confirmAction.suggested_action.rule && (
                  <div className="bg-muted rounded p-3 text-xs space-y-1 mt-2">
                    <div><strong>Regra:</strong> {confirmAction.suggested_action.rule.name}</div>
                    <div><strong>Condição:</strong> {confirmAction.suggested_action.rule.condition_type} {confirmAction.suggested_action.rule.condition_value}</div>
                    <div><strong>Ação:</strong> {confirmAction.suggested_action.rule.action_type} {confirmAction.suggested_action.rule.action_value || ''}</div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmAction && applyAction(confirmAction)}>
              Confirmar e aplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
