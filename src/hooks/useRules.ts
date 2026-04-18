 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
export interface Rule {
  id: string;
  name: string;
  conditionType: string;
  conditionValue: string;
  actionType: string;
  actionValue?: number | null;
  actionValueType?: 'percentage' | 'amount' | string;
  frequency: string;
  appliedTo: string;
  targetId?: string | null;
  isActive: boolean;
  executions: number;
  lastExecution?: string;
  lastExecutionResult?: string | null;
  lastExecutionAffected?: number;
}
 
 export interface ExecutionLog {
   id: string;
   ruleId: string;
   ruleName: string;
   campaignName: string;
   actionDescription: string;
   actionType: string;
   executedAt: string;
 }
 
 export function useRules() {
   const [rules, setRules] = useState<Rule[]>([]);
   const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
   const [loading, setLoading] = useState(true);
   const [userId, setUserId] = useState<string | null>(null);
 
   useEffect(() => {
     const getUser = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       setUserId(user?.id || null);
     };
     getUser();
   }, []);
 
   const fetchRules = useCallback(async () => {
     if (!userId) return;
 
     try {
       setLoading(true);
       const { data, error } = await supabase
         .from('automation_rules')
         .select('*')
         .eq('user_id', userId)
         .order('created_at', { ascending: false });
 
       if (error) throw error;
 
         const mappedRules: Rule[] = (data || []).map((r: any) => ({
           id: r.id,
           name: r.name,
           conditionType: r.condition_type,
           conditionValue: r.condition_value,
           actionType: r.action_type,
           actionValue: r.action_value ?? null,
           actionValueType: r.action_value_type ?? 'percentage',
           frequency: r.frequency,
           appliedTo: r.applied_to,
           targetId: r.target_id ?? null,
           isActive: r.is_active,
           executions: r.executions,
           lastExecution: r.last_execution ? formatTimeAgo(new Date(r.last_execution)) : undefined,
           lastExecutionResult: r.last_execution_result || null,
           lastExecutionAffected: r.last_execution_affected || 0,
         }));
 
       setRules(mappedRules);
     } catch (error) {
       console.error('Error fetching rules:', error);
       toast.error('Erro ao carregar regras');
     } finally {
       setLoading(false);
     }
   }, [userId]);
 
   const fetchExecutionLogs = useCallback(async () => {
     if (!userId) return;
 
     try {
       const { data, error } = await supabase
         .from('rule_execution_logs')
         .select('*')
         .eq('user_id', userId)
         .order('executed_at', { ascending: false })
         .limit(10);
 
       if (error) throw error;
 
       const mappedLogs: ExecutionLog[] = (data || []).map((l: any) => ({
         id: l.id,
         ruleId: l.rule_id,
         ruleName: l.rule_name,
         campaignName: l.campaign_name,
         actionDescription: l.action_description,
         actionType: l.action_type,
         executedAt: formatTimeAgo(new Date(l.executed_at)),
       }));
 
       setExecutionLogs(mappedLogs);
     } catch (error) {
       console.error('Error fetching execution logs:', error);
     }
   }, [userId]);
 
   useEffect(() => {
     if (userId) {
       fetchRules();
       fetchExecutionLogs();
     }
   }, [userId, fetchRules, fetchExecutionLogs]);
 
   const createRule = async (rule: Omit<Rule, 'id' | 'executions' | 'lastExecution'>) => {
     if (!userId) {
       toast.error('Usuário não autenticado');
       return null;
     }
 
      try {
        const { data, error } = await supabase
          .from('automation_rules')
          .insert({
            user_id: userId,
            name: rule.name,
            condition_type: rule.conditionType,
            condition_value: rule.conditionValue,
            action_type: rule.actionType,
            action_value: rule.actionValue ?? null,
            action_value_type: rule.actionValueType ?? 'percentage',
            frequency: rule.frequency,
            applied_to: rule.appliedTo,
            target_id: rule.targetId ?? null,
            is_active: rule.isActive,
          } as any)
          .select()
          .single();

        if (error) throw error;

        const newRule: Rule = {
          id: data.id,
          name: data.name,
          conditionType: data.condition_type,
          conditionValue: data.condition_value,
          actionType: data.action_type,
          actionValue: (data as any).action_value ?? null,
          actionValueType: (data as any).action_value_type ?? 'percentage',
          frequency: data.frequency,
          appliedTo: data.applied_to,
          targetId: (data as any).target_id ?? null,
          isActive: data.is_active,
          executions: 0,
        };
 
       setRules(prev => [newRule, ...prev]);
       toast.success('Regra criada com sucesso!');
       return newRule;
     } catch (error) {
       console.error('Error creating rule:', error);
       toast.error('Erro ao criar regra');
       return null;
     }
   };
 
   const updateRule = async (ruleId: string, updates: Partial<Omit<Rule, 'id' | 'executions' | 'lastExecution'>>) => {
     if (!userId) return false;
 
     try {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.conditionType !== undefined) dbUpdates.condition_type = updates.conditionType;
        if (updates.conditionValue !== undefined) dbUpdates.condition_value = updates.conditionValue;
        if (updates.actionType !== undefined) dbUpdates.action_type = updates.actionType;
        if (updates.actionValue !== undefined) dbUpdates.action_value = updates.actionValue;
        if (updates.actionValueType !== undefined) dbUpdates.action_value_type = updates.actionValueType;
        if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
        if (updates.appliedTo !== undefined) dbUpdates.applied_to = updates.appliedTo;
        if (updates.targetId !== undefined) dbUpdates.target_id = updates.targetId;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
 
       const { error } = await supabase
         .from('automation_rules')
         .update(dbUpdates)
         .eq('id', ruleId)
         .eq('user_id', userId);
 
       if (error) throw error;
 
       setRules(prev => prev.map(r => 
         r.id === ruleId ? { ...r, ...updates } : r
       ));
 
       toast.success('Regra atualizada com sucesso!');
       return true;
     } catch (error) {
       console.error('Error updating rule:', error);
       toast.error('Erro ao atualizar regra');
       return false;
     }
   };
 
   const deleteRule = async (ruleId: string) => {
     if (!userId) return false;
 
     try {
       const { error } = await supabase
         .from('automation_rules')
         .delete()
         .eq('id', ruleId)
         .eq('user_id', userId);
 
       if (error) throw error;
 
       setRules(prev => prev.filter(r => r.id !== ruleId));
       // Also remove related execution logs from state
       setExecutionLogs(prev => prev.filter(l => l.ruleId !== ruleId));
       toast.success('Regra excluída com sucesso!');
       return true;
     } catch (error) {
       console.error('Error deleting rule:', error);
       toast.error('Erro ao excluir regra');
       return false;
     }
   };
 
   const toggleRuleActive = async (ruleId: string) => {
     const rule = rules.find(r => r.id === ruleId);
     if (!rule) return false;
 
     return updateRule(ruleId, { isActive: !rule.isActive });
   };
 
  const executeRules = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('execute-rules');
      
      if (error) throw error;
      
      if (data?.error) {
        toast.error(data.error);
        return { executed: 0, results: [] };
      }

      const executed = data?.executed || 0;
      if (executed > 0) {
        toast.success(`${executed} ação(ões) executada(s) com sucesso!`);
        await fetchRules();
        await fetchExecutionLogs();
      } else {
        toast.info('Nenhuma regra precisou ser executada no momento');
      }

      return data;
    } catch (error) {
      console.error('Error executing rules:', error);
      toast.error('Erro ao executar regras');
      return { executed: 0, results: [] };
    }
  };

  return {
    rules,
    executionLogs,
    loading,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleActive,
    executeRules,
    refreshRules: fetchRules,
    refreshLogs: fetchExecutionLogs,
  };
 }
 
 function formatTimeAgo(date: Date): string {
   const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
   
   if (seconds < 60) return `há ${seconds} seg`;
   const minutes = Math.floor(seconds / 60);
   if (minutes < 60) return `há ${minutes} min`;
   const hours = Math.floor(minutes / 60);
   if (hours < 24) return `há ${hours} horas`;
   const days = Math.floor(hours / 24);
   return `há ${days} dias`;
 }