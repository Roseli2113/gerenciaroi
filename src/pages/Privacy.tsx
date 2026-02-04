import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Privacy = () => {
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
          Política de Privacidade – Gerencia ROI
        </h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Dados Coletados</h2>
            <p>
              Ao utilizar a plataforma Gerencia ROI, coletamos os seguintes dados:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nome e endereço de e-mail fornecidos no cadastro;</li>
              <li>Dados de campanhas de anúncios provenientes da integração com Meta Ads (Facebook Ads e Instagram Ads), incluindo métricas de desempenho, gastos, impressões, cliques e conversões;</li>
              <li>Informações sobre transações e vendas recebidas via integrações com plataformas de pagamento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Uso dos Dados</h2>
            <p>
              Os dados coletados são utilizados exclusivamente para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Visualização e análise de métricas de campanhas de anúncios;</li>
              <li>Automação de campanhas através de regras configuradas pelo usuário;</li>
              <li>Geração de relatórios de desempenho;</li>
              <li>Melhoria contínua da plataforma e experiência do usuário.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Compartilhamento de Dados</h2>
            <p>
              <strong>Não vendemos, alugamos ou compartilhamos seus dados pessoais ou de campanhas com terceiros</strong> para fins comerciais ou de marketing. Seus dados são tratados com total confidencialidade e segurança.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Segurança</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição. Utilizamos criptografia e armazenamento seguro em servidores confiáveis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Seus Direitos</h2>
            <p>
              Você pode, a qualquer momento:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Solicitar acesso aos seus dados pessoais;</li>
              <li>Solicitar a correção de dados incorretos;</li>
              <li>Solicitar a exclusão de seus dados da plataforma;</li>
              <li>Revogar o acesso às suas contas de anúncios.</li>
            </ul>
            <p className="mt-4">
              Para exercer qualquer um desses direitos, entre em contato conosco através do e-mail abaixo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Contato</h2>
            <p>
              Em caso de dúvidas sobre esta Política de Privacidade ou para solicitar a exclusão de seus dados, entre em contato:
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

export default Privacy;
