import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { INVESTMENT_TAX_RATE } from '@/lib/investmentTax';
import { toast } from 'sonner';

/** Per-user Facebook investment tax rate (fraction, e.g. 0.12). Defaults to 12% when unset. */
export function useInvestmentTaxRate() {
  const { user } = useAuth();
  const [rate, setRate] = useState(INVESTMENT_TAX_RATE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRate(INVESTMENT_TAX_RATE);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    supabase
      .from('investment_tax_settings')
      .select('rate')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setRate(!error && data ? Number(data.rate) : INVESTMENT_TAX_RATE);
        setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  const saveRate = useCallback(async (percent: number) => {
    if (!user) return false;
    const next = percent / 100;
    const { error } = await supabase
      .from('investment_tax_settings')
      .upsert({ user_id: user.id, rate: next, updated_at: new Date().toISOString() });
    if (error) {
      toast.error('Erro ao salvar o imposto');
      return false;
    }
    setRate(next);
    toast.success('Imposto atualizado', {
      style: { background: '#16a34a', color: '#ffffff', border: 'none' },
    });
    return true;
  }, [user]);

  return { rate, isLoading, saveRate };
}
