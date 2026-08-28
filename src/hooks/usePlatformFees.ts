import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface PlatformFee {
  id: string;
  platform: string;
  fee_per_sale: number;
  fee_per_withdrawal: number;
  fee_per_orderbump: number;
}

export function normalizePlatform(p: string | null | undefined): string {
  return (p || '').toLowerCase().trim();
}

export function usePlatformFees() {
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const fetchFees = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_fees')
        .select('id, platform, fee_per_sale, fee_per_withdrawal, fee_per_orderbump')
        .eq('user_id', userId);
      if (error) throw error;
      setFees((data || []).map((f: { id: string; platform: string; fee_per_sale: number | string; fee_per_withdrawal: number | string; fee_per_orderbump?: number | string | null }) => ({
        id: f.id,
        platform: normalizePlatform(f.platform),
        fee_per_sale: Number(f.fee_per_sale) || 0,
        fee_per_withdrawal: Number(f.fee_per_withdrawal) || 0,
        fee_per_orderbump: Number(f.fee_per_orderbump) || 0,
      })));
    } catch (e) {
      console.error('Error loading platform_fees', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const upsertFee = async (platform: string, fee_per_sale: number, fee_per_withdrawal: number, fee_per_orderbump: number = 0) => {
    if (!userId) return;
    const p = normalizePlatform(platform);
    try {
      const { error } = await supabase
        .from('platform_fees')
        .upsert({ user_id: userId, platform: p, fee_per_sale, fee_per_withdrawal, fee_per_orderbump }, { onConflict: 'user_id,platform' });
      if (error) throw error;
      toast.success('Taxas salvas');
      await fetchFees();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar taxas');
    }
  };

  // Keep the map reference stable between renders. Consumers use it in effect
  // dependencies, so recreating it here caused continuous fetch/render cycles.
  const feeMap = useMemo(
    () => new Map<string, PlatformFee>(fees.map(f => [f.platform, f])),
    [fees],
  );

  return { fees, feeMap, loading, upsertFee, refreshFees: fetchFees };
}
