import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Zap, Crown, Rocket, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, addMonths } from 'date-fns';
const SUPER_ADMIN_EMAILS = ['r48529908@gmail.com', 'joseadalbertoferrari@gmail.com'];

const plansList = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    description: 'Teste grátis por 14 dias',
    icon: Zap,
    features: [
      '1 Dashboard',
      '1 Conta de Anúncio',
      '1 Webhook',
      '1 Pixel de Otimização',
      'Até 10 Campanhas',
      'Relatórios básicos',
      'Leads ao vivo no Site',
      'Suporte por email',
      '14 dias de teste grátis',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 27,
    description: 'Para quem está começando',
    icon: Star,
    features: [
      '1 Dashboard',
      '1 conta de anúncio',
      '3 Webhook',
      '3 Pixel de Otimização',
      'Até 100 campanhas',
      'Regras automáticas',
      'Relatórios básicos',
      'Leads ao vivo no Site',
      'Suporte Vip',
    ],
  },
  {
    id: 'advanced',
    name: 'Avançado',
    price: 67,
    description: 'Recomendado para quem já possui uma operação.',
    icon: Crown,
    popular: true,
    features: [
      '3 Dashboard',
      '3 conta de anúncio',
      '100 Webhook',
      '100 Pixel de Otimização',
      'Até 300 campanhas',
      'Regras automáticas',
      'Relatórios básicos',
      'Leads ao vivo no Site',
      'Suporte Vip',
    ],
  },
  {
    id: 'monster',
    name: 'Monster',
    price: 147,
    description: 'Recomendado para quem já é um monstro da escala.',
    icon: Rocket,
    features: [
      'Dashboards ILIMITADOS',
      'Contas de Anúncio ILIMITADAS',
      'Webhooks ILIMITADOS',
      'Pixels de Otimização ILIMITADOS',
      'Campanhas ILIMITADAS',
      'Regras automáticas',
      'Relatórios Avançado',
      'Leads ao vivo no Site',
      'Suporte Vip',
    ],
  },
];

const planNameMap: Record<string, string> = {
  free: 'Gratuito',
  premium: 'Premium',
  advanced: 'Avançado',
  pro: 'Avançado',
  profissional: 'Avançado',
  monster: 'Monster',
  enterprise: 'Monster',
  starter: 'Premium',
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

const Subscription = () => {
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<string>('free');
  const [planStatus, setPlanStatus] = useState<string>('active');
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      if (SUPER_ADMIN_EMAILS.includes(user.email || '')) {
        setUserPlan('monster');
        setPlanStatus('active');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_status, created_at')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserPlan(profile.plan || 'free');
        setPlanStatus(profile.plan_status || 'active');
        
        // Calculate next billing date based on account creation
        if (profile.plan && profile.plan !== 'free') {
          const createdAt = new Date(profile.created_at);
          const now = new Date();
          let next = new Date(createdAt);
          // Advance month by month until next is in the future
          while (next <= now) {
            next = addMonths(next, 1);
          }
          setNextBillingDate(format(next, 'dd/MM/yyyy'));
        }
      }
    };

    fetchProfile();
  }, [user]);

  const currentPlanId = planIdMap[userPlan] || 'free';
  const currentPlanDisplayName = planNameMap[userPlan] || 'Gratuito';
  const currentPlanData = plansList.find(p => p.id === currentPlanId);
  const CurrentIcon = currentPlanData?.icon || Zap;

  return (
    <MainLayout title="Assinatura">
      <div className="space-y-6">
        {/* Current Plan Status */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <CurrentIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plano Atual</p>
                  <h3 className="text-xl font-bold text-foreground">{currentPlanDisplayName}</h3>
                </div>
              </div>
              <div className="text-right">
                {currentPlanId !== 'free' && nextBillingDate && (
                  <>
                    <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                    <p className="font-semibold text-foreground">{nextBillingDate}</p>
                  </>
                )}
                <Badge className={cn(
                  "mt-1 border-0",
                  planStatus === 'active' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                )}>
                  {planStatus === 'active' ? 'Ativo' : planStatus === 'expired' ? 'Expirado' : 'Cancelado'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Quatro opções para aumentar suas vendas</h2>
          <p className="text-muted-foreground">Escolha o melhor plano para a sua operação. Todos os planos incluem rastreio das vendas em tempo real.</p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plansList.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative transition-all hover:shadow-card-hover',
                  isCurrent && 'border-primary ring-2 ring-primary/20',
                  plan.popular && 'scale-105'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-primary text-primary-foreground">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <div className={cn(
                    'w-12 h-12 rounded-xl mx-auto flex items-center justify-center',
                    isCurrent ? 'bg-primary/20' : 'bg-muted'
                  )}>
                    <plan.icon className={cn(
                      'w-6 h-6',
                      isCurrent ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  <CardTitle className="mt-4">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      R$ {plan.price}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      'w-full',
                      isCurrent
                        ? 'bg-muted text-muted-foreground hover:bg-muted'
                        : 'gradient-primary text-primary-foreground hover:opacity-90'
                    )}
                    disabled={isCurrent}
                  >
                    {isCurrent ? 'Plano Atual' : 'Fazer Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Pagamentos</CardTitle>
            <CardDescription>Suas últimas transações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: '05/01/2026', amount: 67, status: 'Pago', method: 'Cartão ****4532' },
                { date: '05/12/2025', amount: 67, status: 'Pago', method: 'Cartão ****4532' },
                { date: '05/11/2025', amount: 67, status: 'Pago', method: 'Cartão ****4532' },
              ].map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-foreground">{payment.date}</p>
                    <p className="text-sm text-muted-foreground">{payment.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      R$ {payment.amount.toFixed(2)}
                    </p>
                    <Badge variant="secondary" className="bg-success/20 text-success border-0">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Subscription;
