import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

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
  const [userId, setUserId] = useState<string | null>(null);

  // Keep latest filters in a ref so refreshSales() always uses current filters
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

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
    const approvedSales = sales.filter(s => s.status === 'approved' || s.status === 'paid');
    const pendingSales = sales.filter(s => s.status === 'pending');
    const refundedSales = sales.filter(s => s.status === 'refunded' || s.status === 'chargedback');

    const totalRevenue = approvedSales.reduce((sum, s) => sum + Number(s.amount), 0);
    const totalPending = pendingSales.reduce((sum, s) => sum + Number(s.amount), 0);
    const totalRefunds = refundedSales.reduce((sum, s) => sum + Number(s.amount), 0);
    
    const uniqueCustomers = new Set(sales.filter(s => s.customer_email).map(s => s.customer_email)).size;
    const arpu = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;
    const avgTicket = approvedSales.length > 0 ? totalRevenue / approvedSales.length : 0;
    
    const approvalRate = sales.length > 0 
      ? (approvedSales.length / sales.length) * 100 
      : 0;

    return {
      totalRevenue,
      totalPending,
      totalRefunds,
      totalSales: sales.length,
      approvedSales: approvedSales.length,
      approvalRate,
      arpu,
      avgTicket,
    };
  }, [sales]);

  return {
    sales,
    loading,
    metrics: calculateMetrics(),
    refreshSales,
    deleteSale,
  };
}
