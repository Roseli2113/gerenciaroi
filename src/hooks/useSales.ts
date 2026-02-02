import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Sale {
  id: string;
  user_id: string;
  webhook_id: string | null;
  platform: string;
  transaction_id: string | null;
  status: string;
  amount: number;
  commission: number | null;
  currency: string | null;
  payment_method: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  product_name: string | null;
  product_id: string | null;
  created_at: string;
  updated_at: string;
}

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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const fetchSales = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      let query = supabase
        .from('sales')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.platform && filters.platform !== 'all') {
        query = query.eq('platform', filters.platform);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
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
  }, [userId, filters?.status, filters?.platform, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    if (userId) {
      fetchSales();
    }
  }, [userId, fetchSales]);

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
    refreshSales: fetchSales,
  };
}
