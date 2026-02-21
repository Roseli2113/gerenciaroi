import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  is_active?: boolean;
}

interface MetaConnection {
  accessToken: string;
  expiresAt: number;
  user: MetaUser;
  adAccounts: MetaAdAccount[];
}

export function useMetaAuth() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connection, setConnection] = useState<MetaConnection | null>(null);

  // Load connection from database on mount
  useEffect(() => {
    const loadConnection = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: metaConnection, error } = await supabase
          .from('meta_connections')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (metaConnection && new Date(metaConnection.expires_at) > new Date()) {
          // Load ad accounts
          const { data: adAccounts } = await supabase
            .from('meta_ad_accounts')
            .select('*')
            .eq('connection_id', metaConnection.id);

          setConnection({
            accessToken: metaConnection.access_token,
            expiresAt: new Date(metaConnection.expires_at).getTime(),
            user: {
              id: metaConnection.meta_user_id,
              name: metaConnection.meta_user_name || '',
              email: metaConnection.meta_user_email || undefined
            },
            adAccounts: (adAccounts || []).map(acc => ({
              id: acc.account_id,
              name: acc.name,
              account_status: acc.account_status,
              currency: acc.currency || '',
              timezone_name: acc.timezone_name || '',
              is_active: acc.is_active
            }))
          });
          setIsConnected(true);
        } else if (metaConnection) {
          // Token expired, delete connection
          await supabase
            .from('meta_connections')
            .delete()
            .eq('id', metaConnection.id);
        }
      } catch (err) {
        console.error('Error loading meta connection:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConnection();
  }, [user]);

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      if (!user) return;

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

          // Save to database
          const expiresAt = new Date(Date.now() + (data.expiresIn * 1000));

          // Upsert meta connection
          const { data: savedConnection, error: saveError } = await supabase
            .from('meta_connections')
            .upsert({
              user_id: user.id,
              access_token: data.accessToken,
              expires_at: expiresAt.toISOString(),
              meta_user_id: data.user.id,
              meta_user_name: data.user.name,
              meta_user_email: data.user.email
            }, { onConflict: 'user_id' })
            .select()
            .single();

          if (saveError) throw saveError;

          // Save ad accounts
          if (data.adAccounts && data.adAccounts.length > 0) {
            const adAccountsToInsert = data.adAccounts.map((acc: MetaAdAccount) => ({
              connection_id: savedConnection.id,
              user_id: user.id,
              account_id: acc.id,
              name: acc.name,
              account_status: acc.account_status,
              currency: acc.currency,
              timezone_name: acc.timezone_name,
              is_active: false
            }));

            await supabase
              .from('meta_ad_accounts')
              .upsert(adAccountsToInsert, { onConflict: 'connection_id,account_id' });
          }

          setConnection({
            accessToken: data.accessToken,
            expiresAt: expiresAt.getTime(),
            user: data.user,
            adAccounts: data.adAccounts
          });
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
  }, [user]);

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

  const disconnect = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('meta_connections')
        .delete()
        .eq('user_id', user.id);

      setConnection(null);
      setIsConnected(false);
      toast.success('Desconectado do Meta Ads');
    } catch (err) {
      console.error('Error disconnecting:', err);
      toast.error('Erro ao desconectar');
    }
  }, [user]);

  const refreshAdAccounts = useCallback(async () => {
    if (!connection?.accessToken || !user) return;

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

      // Get connection id
      const { data: metaConnection } = await supabase
        .from('meta_connections')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (metaConnection && data.adAccounts) {
        const adAccountsToInsert = data.adAccounts.map((acc: MetaAdAccount) => ({
          connection_id: metaConnection.id,
          user_id: user.id,
          account_id: acc.id,
          name: acc.name,
          account_status: acc.account_status,
          currency: acc.currency,
          timezone_name: acc.timezone_name,
          is_active: false
        }));

        await supabase
          .from('meta_ad_accounts')
          .upsert(adAccountsToInsert, { onConflict: 'connection_id,account_id' });
      }

      setConnection(prev => prev ? {
        ...prev,
        adAccounts: data.adAccounts
      } : null);

      toast.success('Contas de anúncio atualizadas');
    } catch (err) {
      console.error('Error refreshing ad accounts:', err);
      toast.error('Erro ao atualizar contas de anúncio');
    } finally {
      setIsLoading(false);
    }
  }, [connection, user]);

  const toggleAccountActive = useCallback(async (accountId: string, isActive: boolean, deactivateOthers: boolean = true) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('meta_ad_accounts')
        .update({ is_active: isActive })
        .eq('user_id', user.id)
        .eq('account_id', accountId);

      if (error) throw error;
      
      // If activating and plan only allows one, deactivate other accounts
      if (isActive && deactivateOthers) {
        await supabase
          .from('meta_ad_accounts')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .neq('account_id', accountId);
      }

      toast.success(isActive ? 'Conta ativada' : 'Conta desativada');
      return true;
    } catch (err) {
      console.error('Error toggling account:', err);
      toast.error('Erro ao alterar status da conta');
      return false;
    }
  }, [user]);

  return {
    isConnected,
    isLoading,
    connection,
    connect,
    disconnect,
    refreshAdAccounts,
    toggleAccountActive
  };
}
