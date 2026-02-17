import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const SUPER_ADMIN_EMAILS = ['r48529908@gmail.com', 'joseadalbertoferrari@gmail.com'];

export function useTrialGuard() {
  const { user } = useAuth();
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    const checkTrial = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Super admins never expire
      if (SUPER_ADMIN_EMAILS.includes(user.email || '')) {
        setIsTrialExpired(false);
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_status, created_at')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setIsLoading(false);
        return;
      }

      // Paid plans are never blocked
      if (profile.plan && profile.plan !== 'free') {
        setIsTrialExpired(false);
        setIsLoading(false);
        return;
      }

      // Calculate days since account creation
      const createdAt = new Date(profile.created_at);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, 14 - diffDays);

      setDaysRemaining(remaining);
      setIsTrialExpired(diffDays >= 14);
      setIsLoading(false);
    };

    checkTrial();
  }, [user]);

  return { isTrialExpired, isLoading, daysRemaining };
}
