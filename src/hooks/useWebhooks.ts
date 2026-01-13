import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Webhook {
  id: string;
  user_id: string;
  platform: string;
  name: string;
  client_id: string | null;
  client_secret: string | null;
  webhook_url: string | null;
  token: string | null;
  pixel_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const fetchWebhooks = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast.error('Erro ao carregar webhooks');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchWebhooks();
    }
  }, [userId, fetchWebhooks]);

  const generateToken = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const createWebhook = async (webhookData: {
    platform: string;
    name: string;
    clientId?: string;
    clientSecret?: string;
    webhookUrl?: string;
    token?: string;
    pixelId?: string;
  }) => {
    if (!userId) {
      toast.error('Usuário não autenticado');
      return null;
    }

    try {
      const newWebhook = {
        user_id: userId,
        platform: webhookData.platform.toLowerCase(),
        name: webhookData.name,
        client_id: webhookData.clientId || null,
        client_secret: webhookData.clientSecret || null,
        webhook_url: webhookData.webhookUrl || null,
        token: webhookData.token || generateToken(),
        pixel_id: webhookData.pixelId || null,
        status: 'active',
      };

      const { data, error } = await supabase
        .from('webhooks')
        .insert(newWebhook)
        .select()
        .single();

      if (error) throw error;

      setWebhooks(prev => [data, ...prev]);
      toast.success('Webhook criado com sucesso!');
      return data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error('Erro ao criar webhook');
      return null;
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWebhooks(prev => prev.filter(w => w.id !== id));
      toast.success('Webhook excluído com sucesso!');
      return true;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Erro ao excluir webhook');
      return false;
    }
  };

  const toggleWebhookStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setWebhooks(prev => prev.map(w => 
        w.id === id ? { ...w, status: newStatus } : w
      ));
      toast.success(`Webhook ${newStatus === 'active' ? 'ativado' : 'desativado'}`);
      return true;
    } catch (error) {
      console.error('Error toggling webhook status:', error);
      toast.error('Erro ao alterar status do webhook');
      return false;
    }
  };

  return {
    webhooks,
    loading,
    createWebhook,
    deleteWebhook,
    toggleWebhookStatus,
    refreshWebhooks: fetchWebhooks,
  };
}
