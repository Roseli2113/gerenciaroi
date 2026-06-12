import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlatformFee {
  id: string;
  platform: string;
  fee_per_sale: number;
  fee_per_withdrawal: number;
}

export function normalizePlatform(p: string | null | undefined): string {
  return (p || '').toLowerCase().trim();
}

export function usePlatformFees() {
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const fetchFees = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_fees')
        .select('id, platform, fee_per_sale, fee_per_withdrawal')
        .eq('user_id', userId);
      if (error) throw error;
      setFees((data || []).map(f => ({
        id: f.id,
        platform: normalizePlatform(f.platform),
        fee_per_sale: Number(f.fee_per_sale) || 0,
        fee_per_withdrawal: Number(f.fee_per_withdrawal) || 0,
      })));
    } catch (e) {
      console.error('Error loading platform_fees', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const upsertFee = async (platform: string, fee_per_sale: number, fee_per_withdrawal: number) => {
    if (!userId) return;
    const p = normalizePlatform(platform);
    try {
      const { error } = await supabase
        .from('platform_fees')
        .upsert({ user_id: userId, platform: p, fee_per_sale, fee_per_withdrawal }, { onConflict: 'user_id,platform' });
      if (error) throw error;
      toast.success('Taxas salvas');
      await fetchFees();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar taxas');
    }
  };

  const feeMap = new Map<string, PlatformFee>(fees.map(f => [f.platform, f]));

  return { fees, feeMap, loading, upsertFee, refreshFees: fetchFees };
}
