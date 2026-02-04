import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Termos de Serviço – Gerencia ROI
        </h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Sobre a Plataforma</h2>
            <p>
              A Gerencia ROI é uma plataforma de gestão e automação de campanhas de anúncios digitais. Nossos serviços incluem:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Visualização centralizada de métricas e desempenho de campanhas;</li>
              <li>Integração com plataformas de anúncios como Meta Ads (Facebook e Instagram);</li>
              <li>Automação de campanhas através de regras personalizadas;</li>
              <li>Integração com plataformas de vendas para acompanhamento de conversões;</li>
              <li>Geração de relatórios de desempenho.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Responsabilidade do Usuário</h2>
            <p>
              Ao utilizar a Gerencia ROI, você concorda que:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>É o único responsável pelos dados das suas contas de anúncios conectadas à plataforma;</li>
              <li>As ações automatizadas (pausar, ativar, ajustar orçamento de campanhas) são executadas conforme as regras que você configurou;</li>
              <li>Deve manter suas credenciais de acesso seguras e não compartilhá-las com terceiros;</li>
              <li>Utilizará a plataforma em conformidade com as políticas das plataformas de anúncios integradas (Meta, Google, etc.).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Limitação de Responsabilidade</h2>
            <p>
              A Gerencia ROI não se responsabiliza por:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Resultados de campanhas ou desempenho de anúncios;</li>
              <li>Ações tomadas automaticamente com base em regras configuradas pelo usuário;</li>
              <li>Suspensão ou bloqueio de contas de anúncios por parte das plataformas (Meta, Google, etc.);</li>
              <li>Perdas financeiras decorrentes do uso da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Alterações no Serviço</h2>
            <p>
              Reservamo-nos o direito de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modificar, atualizar ou descontinuar funcionalidades da plataforma a qualquer momento;</li>
              <li>Alterar os preços dos planos de assinatura com aviso prévio;</li>
              <li>Encerrar o serviço mediante comunicação prévia aos usuários.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Pagamentos e Assinaturas</h2>
            <p>
              Os planos de assinatura são cobrados de forma recorrente conforme o período escolhido (mensal ou anual). O cancelamento pode ser solicitado a qualquer momento, e o acesso será mantido até o fim do período pago.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, design, código e funcionalidades da plataforma Gerencia ROI são de propriedade exclusiva da empresa e protegidos por leis de propriedade intelectual. É proibida a reprodução, cópia ou distribuição sem autorização prévia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Contato</h2>
            <p>
              Em caso de dúvidas sobre estes Termos de Serviço, entre em contato:
            </p>
            <p className="mt-2">
              <strong>E-mail:</strong>{" "}
              <a href="mailto:contato@adsroi.com.br" className="text-primary hover:underline">
                contato@adsroi.com.br
              </a>
            </p>
          </section>

          <section className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Última atualização: Fevereiro de 2026
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
