import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BudgetAlert {
  id: string;
  budget_amount: number;
  alert_threshold: number;
  is_active: boolean;
  last_spent: number | null;
  account_name: string | null;
  account_id: string | null;
}

export function useBudgetAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('budget_alerts')
      .select('id, budget_amount, alert_threshold, is_active, last_spent, account_name, account_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setAlerts(data as BudgetAlert[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = async (
    budget: number,
    threshold: number,
    accountName?: string,
    accountId?: string,
  ) => {
    if (!user) return false;
    const { error } = await (supabase as any).from('budget_alerts').insert({
      user_id: user.id,
      budget_amount: budget,
      alert_threshold: threshold,
      account_name: accountName || null,
      account_id: accountId || null,
      is_active: true,
    });
    if (error) {
      toast.error('Erro ao criar alerta de orçamento');
      return false;
    }
    toast.success('Alerta de orçamento criado!');
    fetchAlerts();
    return true;
  };

  const updateAlert = async (id: string, updates: Partial<BudgetAlert>) => {
    if (!user) return false;
    const { error } = await (supabase as any)
      .from('budget_alerts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Erro ao atualizar alerta');
      return false;
    }
    fetchAlerts();
    return true;
  };

  const deleteAlert = async (id: string) => {
    if (!user) return false;
    const { error } = await (supabase as any)
      .from('budget_alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Erro ao excluir alerta');
      return false;
    }
    toast.success('Alerta removido');
    fetchAlerts();
    return true;
  };

  return { alerts, loading, createAlert, updateAlert, deleteAlert, refresh: fetchAlerts };
}
