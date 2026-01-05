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
import { Check, Zap, Crown, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 97,
    description: 'Para quem está começando',
    icon: Zap,
    features: [
      '1 conta de anúncio',
      'Até 10 campanhas',
      '5 regras automáticas',
      'Relatórios básicos',
      'Suporte por email',
    ],
    current: false,
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 197,
    description: 'Para profissionais de marketing',
    icon: Crown,
    features: [
      '5 contas de anúncio',
      'Campanhas ilimitadas',
      'Regras ilimitadas',
      'Relatórios avançados',
      'UTM tracking',
      'Suporte prioritário',
      'API access',
    ],
    current: true,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 497,
    description: 'Para agências e empresas',
    icon: Rocket,
    features: [
      'Contas ilimitadas',
      'Campanhas ilimitadas',
      'Regras ilimitadas',
      'Relatórios personalizados',
      'White label',
      'Gerente de conta dedicado',
      'SLA garantido',
      'Treinamento exclusivo',
    ],
    current: false,
  },
];

const Subscription = () => {
  return (
    <MainLayout title="Assinatura">
      <div className="space-y-6">
        {/* Current Plan Status */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plano Atual</p>
                  <h3 className="text-xl font-bold text-foreground">Profissional</h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                <p className="font-semibold text-foreground">05/02/2026</p>
                <Badge className="mt-1 bg-success/20 text-success border-0">Ativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'relative transition-all hover:shadow-card-hover',
                plan.current && 'border-primary ring-2 ring-primary/20',
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
                  plan.current ? 'bg-primary/20' : 'bg-muted'
                )}>
                  <plan.icon className={cn(
                    'w-6 h-6',
                    plan.current ? 'text-primary' : 'text-muted-foreground'
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
                    plan.current
                      ? 'bg-muted text-muted-foreground hover:bg-muted'
                      : 'gradient-primary text-primary-foreground hover:opacity-90'
                  )}
                  disabled={plan.current}
                >
                  {plan.current ? 'Plano Atual' : 'Fazer Upgrade'}
                </Button>
              </CardContent>
            </Card>
          ))}
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
                { date: '05/01/2026', amount: 197, status: 'Pago', method: 'Cartão ****4532' },
                { date: '05/12/2025', amount: 197, status: 'Pago', method: 'Cartão ****4532' },
                { date: '05/11/2025', amount: 197, status: 'Pago', method: 'Cartão ****4532' },
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
