import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MetaUser {
  id: string;
  name: string;
  email?: string;
}

interface MetaAdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
}

interface MetaConnection {
  accessToken: string;
  expiresAt: number;
  user: MetaUser;
  adAccounts: MetaAdAccount[];
}

const META_CONNECTION_KEY = 'meta_connection';

export function useMetaAuth() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connection, setConnection] = useState<MetaConnection | null>(null);

  // Load connection from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(META_CONNECTION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as MetaConnection;
        // Check if token is still valid
        if (parsed.expiresAt > Date.now()) {
          setConnection(parsed);
          setIsConnected(true);
        } else {
          localStorage.removeItem(META_CONNECTION_KEY);
        }
      } catch {
        localStorage.removeItem(META_CONNECTION_KEY);
      }
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        toast.error('Erro ao conectar com Meta: ' + error);
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      if (code) {
        setIsLoading(true);
        try {
          const redirectUri = `${window.location.origin}/integrations`;
          
          const { data, error: fnError } = await supabase.functions.invoke('meta-auth', {
            body: {
              action: 'exchange-code',
              code,
              redirectUri
            }
          });

          if (fnError || data?.error) {
            throw new Error(data?.error || fnError?.message || 'Erro ao trocar código de autorização');
          }

          const newConnection: MetaConnection = {
            accessToken: data.accessToken,
            expiresAt: Date.now() + (data.expiresIn * 1000),
            user: data.user,
            adAccounts: data.adAccounts
          };

          localStorage.setItem(META_CONNECTION_KEY, JSON.stringify(newConnection));
          setConnection(newConnection);
          setIsConnected(true);
          toast.success('Conectado ao Meta Ads com sucesso!');
        } catch (err) {
          console.error('Meta auth error:', err);
          toast.error(err instanceof Error ? err.message : 'Erro ao conectar com Meta');
        } finally {
          setIsLoading(false);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    };

    handleCallback();
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/integrations`;
      
      const { data, error } = await supabase.functions.invoke('meta-auth', {
        body: {
          action: 'get-auth-url',
          redirectUri
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Erro ao obter URL de autenticação');
      }

      window.location.href = data.authUrl;
    } catch (err) {
      console.error('Meta connect error:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao conectar com Meta');
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(META_CONNECTION_KEY);
    setConnection(null);
    setIsConnected(false);
    toast.success('Desconectado do Meta Ads');
  }, []);

  const refreshAdAccounts = useCallback(async () => {
    if (!connection?.accessToken) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-ads', {
        body: {
          action: 'get-ad-accounts',
          accessToken: connection.accessToken
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }

      const updatedConnection = {
        ...connection,
        adAccounts: data.adAccounts
      };

      localStorage.setItem(META_CONNECTION_KEY, JSON.stringify(updatedConnection));
      setConnection(updatedConnection);
    } catch (err) {
      console.error('Error refreshing ad accounts:', err);
      toast.error('Erro ao atualizar contas de anúncio');
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  return {
    isConnected,
    isLoading,
    connection,
    connect,
    disconnect,
    refreshAdAccounts
  };
}
