import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ApiCredential {
  id: string;
  name: string;
  token: string;
  status: string;
  created_at: string;
}

export function useApiCredentials() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCredentials = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (err) {
      console.error('Error fetching credentials:', err);
      toast.error('Erro ao carregar credenciais');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const generateToken = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const createCredential = useCallback(async (name: string) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }

    try {
      const token = generateToken();
      
      const { data, error } = await supabase
        .from('api_credentials')
        .insert({
          user_id: user.id,
          name,
          token,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setCredentials(prev => [data, ...prev]);
      toast.success('Credencial criada com sucesso');
      return data;
    } catch (err) {
      console.error('Error creating credential:', err);
      toast.error('Erro ao criar credencial');
      return null;
    }
  }, [user]);

  const deleteCredential = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_credentials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCredentials(prev => prev.filter(c => c.id !== id));
      toast.success('Credencial removida');
      return true;
    } catch (err) {
      console.error('Error deleting credential:', err);
      toast.error('Erro ao remover credencial');
      return false;
    }
  }, []);

  const toggleCredentialStatus = useCallback(async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('api_credentials')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setCredentials(prev => prev.map(c =>
        c.id === id ? { ...c, status: newStatus } : c
      ));
      toast.success(newStatus === 'active' ? 'Credencial ativada' : 'Credencial desativada');
      return true;
    } catch (err) {
      console.error('Error toggling credential:', err);
      toast.error('Erro ao alterar status');
      return false;
    }
  }, []);

  return {
    credentials,
    isLoading,
    createCredential,
    deleteCredential,
    toggleCredentialStatus,
    fetchCredentials
  };
}
