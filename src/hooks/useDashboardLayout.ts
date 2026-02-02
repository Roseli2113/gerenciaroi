import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LayoutItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DEFAULT_LAYOUT: LayoutItem[] = [
  { id: 'revenue', x: 0, y: 0, w: 1, h: 1 },
  { id: 'spent', x: 1, y: 0, w: 1, h: 1 },
  { id: 'roi', x: 2, y: 0, w: 1, h: 1 },
  { id: 'profit', x: 3, y: 0, w: 1, h: 1 },
  { id: 'cpa', x: 0, y: 1, w: 1, h: 1 },
  { id: 'sales', x: 1, y: 1, w: 1, h: 1 },
  { id: 'ticket', x: 2, y: 1, w: 1, h: 1 },
  { id: 'pending', x: 3, y: 1, w: 1, h: 1 },
  { id: 'refunds', x: 0, y: 2, w: 1, h: 1 },
  { id: 'arpu', x: 1, y: 2, w: 1, h: 1 },
  { id: 'margin', x: 2, y: 2, w: 1, h: 1 },
  { id: 'approval', x: 3, y: 2, w: 1, h: 1 },
];

export interface MetricDefinition {
  id: string;
  title: string;
  icon: string;
  category: 'revenue' | 'cost' | 'performance' | 'sales';
}

export const AVAILABLE_METRICS: MetricDefinition[] = [
  { id: 'revenue', title: 'Faturamento', icon: 'DollarSign', category: 'revenue' },
  { id: 'spent', title: 'Gastos com Anúncios', icon: 'Wallet', category: 'cost' },
  { id: 'roi', title: 'ROI', icon: 'TrendingUp', category: 'performance' },
  { id: 'profit', title: 'Lucro', icon: 'BarChart3', category: 'revenue' },
  { id: 'cpa', title: 'CPA Médio', icon: 'Target', category: 'performance' },
  { id: 'sales', title: 'Vendas', icon: 'ShoppingCart', category: 'sales' },
  { id: 'ticket', title: 'Ticket Médio', icon: 'Receipt', category: 'performance' },
  { id: 'pending', title: 'Vendas Pendentes', icon: 'Clock', category: 'sales' },
  { id: 'refunds', title: 'Reembolsos', icon: 'RotateCcw', category: 'sales' },
  { id: 'arpu', title: 'ARPU', icon: 'Users', category: 'performance' },
  { id: 'margin', title: 'Margem', icon: 'Percent', category: 'performance' },
  { id: 'approval', title: 'Taxa de Aprovação', icon: 'CheckCircle', category: 'performance' },
];

export function useDashboardLayout() {
  const [layout, setLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
  const [savedLayout, setSavedLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const fetchLayout = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('layout')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.layout && Array.isArray(data.layout)) {
        const parsedLayout = data.layout as unknown as LayoutItem[];
        setLayout(parsedLayout);
        setSavedLayout(parsedLayout);
      } else {
        setLayout(DEFAULT_LAYOUT);
        setSavedLayout(DEFAULT_LAYOUT);
      }
    } catch (error) {
      console.error('Error fetching layout:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchLayout();
    }
  }, [userId, fetchLayout]);

  const saveLayout = async () => {
    if (!userId) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      setSaving(true);
      
      const layoutJson = JSON.parse(JSON.stringify(layout));
      
      const { data: existing } = await supabase
        .from('dashboard_layouts')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('dashboard_layouts')
          .update({ layout: layoutJson })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dashboard_layouts')
          .insert([{ 
            user_id: userId, 
            layout: layoutJson
          }]);

        if (error) throw error;
      }

      setSavedLayout(layout);
      setIsEditMode(false);
      toast.success('Layout salvo com sucesso!');
      return true;
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Erro ao salvar layout');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setLayout(savedLayout);
    setIsEditMode(false);
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    toast.info('Layout redefinido para o padrão');
  };

  const updateLayout = (newLayout: LayoutItem[]) => {
    setLayout(newLayout);
  };

  const addMetric = (metricId: string) => {
    const exists = layout.find(item => item.id === metricId);
    if (exists) {
      toast.error('Esta métrica já está no dashboard');
      return;
    }

    // Find the next available position
    const maxY = Math.max(...layout.map(item => item.y), -1);
    const itemsInLastRow = layout.filter(item => item.y === maxY);
    
    let newX = 0;
    let newY = maxY;
    
    if (itemsInLastRow.length >= 4) {
      newY = maxY + 1;
      newX = 0;
    } else {
      newX = itemsInLastRow.length;
    }

    const newItem: LayoutItem = {
      id: metricId,
      x: newX,
      y: newY,
      w: 1,
      h: 1,
    };

    setLayout([...layout, newItem]);
    toast.success('Métrica adicionada ao dashboard');
  };

  const removeMetric = (metricId: string) => {
    setLayout(layout.filter(item => item.id !== metricId));
    toast.success('Métrica removida do dashboard');
  };

  const getAvailableMetrics = () => {
    const usedIds = new Set(layout.map(item => item.id));
    return AVAILABLE_METRICS.filter(metric => !usedIds.has(metric.id));
  };

  return {
    layout,
    isEditMode,
    loading,
    saving,
    setIsEditMode,
    saveLayout,
    cancelEdit,
    resetLayout,
    updateLayout,
    addMetric,
    removeMetric,
    getAvailableMetrics,
  };
}
