import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SUPER_ADMIN_EMAILS = ['r48529908@gmail.com', 'joseadalbertoferrari@gmail.com'];

export interface PlanLimits {
  dashboards: number;
  adAccounts: number;
  webhooks: number;
  pixels: number;
  campaigns: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    dashboards: 1,
    adAccounts: 1,
    webhooks: 1,
    pixels: 1,
    campaigns: 10,
  },
  premium: {
    dashboards: 1,
    adAccounts: 1,
    webhooks: 3,
    pixels: 3,
    campaigns: 100,
  },
  advanced: {
    dashboards: 3,
    adAccounts: 3,
    webhooks: 100,
    pixels: 100,
    campaigns: 300,
  },
  monster: {
    dashboards: Infinity,
    adAccounts: Infinity,
    webhooks: Infinity,
    pixels: Infinity,
    campaigns: Infinity,
  },
};

const planIdMap: Record<string, string> = {
  free: 'free',
  premium: 'premium',
  starter: 'premium',
  advanced: 'advanced',
  pro: 'advanced',
  profissional: 'advanced',
  monster: 'monster',
  enterprise: 'monster',
};

const planDisplayNames: Record<string, string> = {
  free: 'Gratuito',
  premium: 'Premium',
  advanced: 'Avançado',
  monster: 'Monster',
};

export function usePlanLimits() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) { setIsLoading(false); return; }

      if (SUPER_ADMIN_EMAILS.includes(user.email || '')) {
        setCurrentPlan('monster');
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', user.id)
        .single();

      setCurrentPlan(planIdMap[profile?.plan || 'free'] || 'free');
      setIsLoading(false);
    };

    fetchPlan();
  }, [user]);

  const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free;

  const checkLimit = (
    feature: keyof PlanLimits,
    currentCount: number,
  ): boolean => {
    const max = limits[feature];
    if (currentCount >= max) {
      const featureNames: Record<keyof PlanLimits, string> = {
        dashboards: 'Dashboards',
        adAccounts: 'Contas de Anúncio',
        webhooks: 'Webhooks',
        pixels: 'Pixels de Otimização',
        campaigns: 'Campanhas',
      };

      // Find the cheapest plan that allows more
      const suggestedPlan = Object.entries(PLAN_LIMITS).find(
        ([key]) => key !== currentPlan && (PLAN_LIMITS[key][feature] > max)
      );

      const suggestedName = suggestedPlan
        ? planDisplayNames[suggestedPlan[0]] || suggestedPlan[0]
        : 'Monster';

      toast.error(
        `Limite atingido: ${featureNames[feature]}`,
        {
          description: `Seu plano ${planDisplayNames[currentPlan]} permite apenas ${max} ${featureNames[feature].toLowerCase()}. Faça upgrade para o plano ${suggestedName} para ter mais.`,
          action: {
            label: 'Ver Planos',
            onClick: () => { window.location.href = '/subscription'; },
          },
          duration: 6000,
        }
      );
      return false;
    }
    return true;
  };

  return { currentPlan, limits, isLoading, checkLimit };
}
