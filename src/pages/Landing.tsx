import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Rocket, TrendingUp, BarChart3, Target, ShieldCheck, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import logoImg from '@/assets/Logo_gerencia_roi.png';
import dashboardImg from '@/assets/dashboard-preview.png';

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
    icon: Zap,
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

const faqs = [
  {
    q: 'O que é o Gerencia ROI?',
    a: 'O Gerencia ROI é uma plataforma de gestão inteligente de campanhas de marketing digital. Ele centraliza seus dados de Meta Ads, vendas e métricas em um único dashboard, permitindo que você tome decisões baseadas em dados reais.',
  },
  {
    q: 'Como funciona o teste grátis?',
    a: 'Você tem 14 dias para testar todas as funcionalidades da plataforma sem nenhum custo. Não é necessário cartão de crédito para começar.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim! Você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas de cancelamento.',
  },
  {
    q: 'Quais plataformas de anúncios são suportadas?',
    a: 'Atualmente suportamos Meta Ads (Facebook e Instagram). Em breve teremos integração com Google Ads e TikTok Ads.',
  },
  {
    q: 'Como faço para integrar minha conta de anúncios?',
    a: 'Após criar sua conta, basta acessar a seção de Integrações e conectar sua conta do Meta Ads com apenas alguns cliques.',
  },
  {
    q: 'Os meus dados estão seguros?',
    a: 'Sim! Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança da informação. Seus dados nunca são compartilhados com terceiros.',
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center">
            <img src={logoImg} alt="Gerência ROI" className="h-10 object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Entrar
            </Button>
            <Button onClick={() => navigate('/auth')} className="gap-2">
              Começar Grátis <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1.5">
                🚀 14 dias grátis — sem cartão de crédito
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                Pare de <span className="text-primary">perder dinheiro</span> com anúncios sem controle
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                O Gerencia ROI centraliza suas campanhas, vendas e métricas em um único dashboard inteligente. 
                Saiba exatamente seu ROI, CPA e lucro em tempo real.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-6 gap-2">
                  Começar Teste Grátis <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-success" /> Dados seguros</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-success" /> Sem cartão</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-success" /> Cancele quando quiser</span>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-border shadow-2xl">
                <img src={dashboardImg} alt="Dashboard Gerencia ROI" className="w-full" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tudo que você precisa em um só lugar</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Chega de planilhas e ferramentas separadas. Gerencie tudo no Gerencia ROI.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, title: 'Dashboard em Tempo Real', desc: 'Veja todas as suas métricas de campanhas, vendas e ROI atualizados ao vivo.' },
              { icon: Target, title: 'Regras Automáticas', desc: 'Crie regras para pausar, ativar ou ajustar campanhas automaticamente.' },
              { icon: TrendingUp, title: 'Relatórios Avançados', desc: 'Relatórios detalhados de performance para tomar decisões inteligentes.' },
              { icon: ShieldCheck, title: 'Rastreamento UTM', desc: 'Rastreie cada visita e conversão com precisão total.' },
            ].map((feat, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{feat.title}</h3>
                  <p className="text-muted-foreground text-sm">{feat.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20" id="planos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Escolha o plano ideal para você</h2>
            <p className="text-muted-foreground text-lg">Comece grátis e faça upgrade quando precisar</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plansList.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  'relative transition-all hover:shadow-lg',
                  plan.popular && 'border-primary ring-2 ring-primary/20 scale-105'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Mais Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center bg-muted">
                    <plan.icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-4">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">R$ {plan.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => navigate('/auth')}
                  >
                    {plan.price === 0 ? 'Começar Grátis' : 'Escolher Plano'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Perguntas Frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Card key={i} className="cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{faq.q}</h3>
                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
                  </div>
                  {openFaq === i && (
                    <p className="mt-3 text-muted-foreground text-sm animate-fade-in">{faq.a}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold">Pronto para maximizar seu ROI?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Junte-se a centenas de anunciantes que já otimizaram seus resultados com o Gerencia ROI.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-6 gap-2">
            Começar Teste Grátis de 14 Dias <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <img src={logoImg} alt="Gerência ROI" className="h-8 object-contain" />
              </div>
              <p className="text-sm text-muted-foreground">
                Gestão inteligente de campanhas de marketing digital.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#planos" className="hover:text-foreground transition-colors">Planos</a></li>
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Criar Conta</Link></li>
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Entrar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
                <li><Link to="/termos" className="hover:text-foreground transition-colors">Termos e Condições</Link></li>
                <li><Link to="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link></li>
                <li><Link to="/exclusao-de-dados" className="hover:text-foreground transition-colors">Exclusão de Dados</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            GERENCIA ROI 2026 - TODOS OS DIREITOS RESERVADOS.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
