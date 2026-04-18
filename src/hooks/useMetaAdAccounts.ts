import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MetaAdAccount {
  id: string;
  account_id: string;
  name: string;
  is_active: boolean;
}

export function useMetaAdAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<MetaAdAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('meta_ad_accounts')
        .select('id, account_id, name, is_active')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      if (data) setAccounts(data);
      setLoading(false);
    })();
  }, [user]);

  return { accounts, loading };
}
