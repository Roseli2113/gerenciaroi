import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { usePlatformFees, normalizePlatform } from '@/hooks/usePlatformFees';

export type Sale = Tables<'sales'>;

export interface SalesMetrics {
  totalRevenue: number;
  totalPending: number;
  totalRefunds: number;
  totalSales: number;
  approvedSales: number;
  approvalRate: number;
  arpu: number;
  avgTicket: number;
}

export interface SalesFilters {
  status?: string;
  platform?: string;
  startDate?: Date;
  endDate?: Date;
}

export function useSales(filters?: SalesFilters) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { feeMap } = usePlatformFees();

  // Keep latest filters in a ref so refreshSales() always uses current filters
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchSales = useCallback(async (activeFilters?: SalesFilters) => {
    if (!userId) return;

    const f = activeFilters ?? filtersRef.current;

    try {
      setLoading(true);
      let query = supabase
        .from('sales')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (f?.status && f.status !== 'all') {
        query = query.eq('status', f.status);
      }

      if (f?.platform && f.platform !== 'all') {
        query = query.eq('platform', f.platform);
      }

      if (f?.startDate) {
        query = query.gte('created_at', f.startDate.toISOString());
      }

      if (f?.endDate) {
        query = query.lte('created_at', f.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Re-fetch whenever filters change
  useEffect(() => {
    if (userId) {
      fetchSales(filters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filters?.status, filters?.platform, filters?.startDate, filters?.endDate, fetchSales]);

  // refreshSales() is a no-arg function safe to use as onClick handler
  const refreshSales = useCallback(() => {
    return fetchSales(filtersRef.current);
  }, [fetchSales]);

  const deleteSale = async (saleId: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)
        .eq('user_id', userId);

      if (error) throw error;
      
      setSales(prev => prev.filter(s => s.id !== saleId));
      toast.success('Transação excluída com sucesso');
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  const calculateMetrics = useCallback((): SalesMetrics => {
    // Exclude test/zero-amount sales from metrics to keep dashboard aligned with Campaigns
    const realSales = sales.filter(s => Number(s.amount) > 0);
    const approvedSales = realSales.filter(s => s.status === 'approved' || s.status === 'paid');
    const pendingSales = realSales.filter(s => s.status === 'pending');
    const refundedSales = realSales.filter(s => s.status === 'refunded' || s.status === 'chargedback');

    const netAmount = (s: Sale) => {
      const fees = feeMap.get(normalizePlatform(s.platform));
      const raw = (s.raw_data ?? {}) as { product?: { type?: string; price?: number } };
      const isBump = String(raw?.product?.type || '').toLowerCase() === 'bump';
      const bumpPrice = Number(raw?.product?.price) || 0;
      // Bump sales in Lowify ride along with a main product in the same order,
      // so the platform charges both the per-sale fee AND the order bump fee.
      let fee = 0;
      if (isBump) {
        fee = (fees?.fee_per_orderbump || 0);
        if (Number(s.amount) > bumpPrice) fee += (fees?.fee_per_sale || 0);
      } else {
        fee = (fees?.fee_per_sale || 0);
      }
      return Math.max(0, Number(s.amount) - fee);
    };
    const totalRevenue = approvedSales.reduce((sum, s) => sum + netAmount(s), 0);
    const totalPending = pendingSales.reduce((sum, s) => sum + Number(s.amount), 0);
    const totalRefunds = refundedSales.reduce((sum, s) => sum + Number(s.amount), 0);
    
    const uniqueCustomers = new Set(realSales.filter(s => s.customer_email).map(s => s.customer_email)).size;
    const arpu = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;
    const avgTicket = approvedSales.length > 0 ? totalRevenue / approvedSales.length : 0;

    const approvalRate = realSales.length > 0
      ? (approvedSales.length / realSales.length) * 100
      : 0;

    return {
      totalRevenue,
      totalPending,
      totalRefunds,
      totalSales: realSales.length,
      approvedSales: approvedSales.length,
      approvalRate,
      arpu,
      avgTicket,
    };
  }, [sales, feeMap]);

  return {
    sales,
    loading,
    metrics: calculateMetrics(),
    refreshSales,
    deleteSale,
  };
}
