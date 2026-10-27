import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Lightbulb } from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: string[];
  tip?: string;
}

const tutorials: Tutorial[] = [
  {
    id: 'connect',
    title: '1. Conectar sua conta do Facebook',
    description: 'Libere o acesso às suas contas de anúncios.',
    steps: [
      'No menu lateral, clique em "Integrações".',
      'Na aba Facebook, clique em "Conectar com Facebook".',
      'Entre com o perfil do Facebook que administra suas contas de anúncios.',
      'Marque o Portfólio empresarial, as Contas de anúncios e as Páginas que deseja usar.',
      'Aceite todas as permissões solicitadas e clique em "Salvar".',
      'Volte ao Gerência ROI: suas contas aparecerão listadas como conectadas.',
    ],
    tip: 'Se uma conta não aparecer, reconecte e escolha "Editar configurações" para marcar a conta que faltou.',
  },
  {
    id: 'accounts',
    title: '2. Escolher as contas de anúncios',
    description: 'Defina quais contas aparecem no painel.',
    steps: [
      'Em "Integrações", veja a lista de contas de anúncios conectadas.',
      'Ative as contas que deseja acompanhar.',
      'Abra "Campanhas" e clique em "Atualizar" para carregar os dados.',
    ],
    tip: 'A quantidade de contas depende do seu plano.',
  },
  {
    id: 'utms',
    title: '3. Configurar as UTMs nos anúncios',
    description: 'Essencial para atribuir cada venda à campanha certa.',
    steps: [
      'No menu lateral, abra "UTMs" e copie o código de parâmetros.',
      'No Gerenciador de Anúncios do Facebook, abra o anúncio e clique em "Editar".',
      'Role até "Rastreamento" e cole o código no campo "Parâmetros de URL".',
      'Publique as alterações. Repita em todos os anúncios ativos.',
    ],
    tip: 'Para aplicar em vários anúncios de uma vez, selecione todos no Gerenciador e use "Editar".',
  },
  {
    id: 'pixel',
    title: '4. Instalar o Pixel do Facebook',
    description: 'Envie eventos de compra e checkout para o Facebook.',
    steps: [
      'Em "Integrações", abra a aba de Pixel.',
      'Informe o ID do seu Pixel (encontrado no Gerenciador de Eventos do Facebook).',
      'Copie o script gerado e cole no cabeçalho da sua página de vendas.',
      'No Gerenciador de Eventos, use "Testar eventos" para confirmar o recebimento.',
    ],
  },
  {
    id: 'webhook',
    title: '5. Conectar sua plataforma de vendas',
    description: 'Receba as vendas automaticamente via webhook.',
    steps: [
      'Em "Integrações", escolha sua plataforma de pagamento e copie a URL do webhook.',
      'Na sua plataforma, cole a URL na área de webhooks/postback.',
      'Faça uma venda de teste e confira em "Vendas" se ela apareceu com as UTMs.',
    ],
  },
  {
    id: 'campaigns',
    title: '6. Acompanhar e gerenciar campanhas',
    description: 'Veja gastos, vendas, lucro e ROI em tempo real.',
    steps: [
      'Abra "Campanhas" e alterne entre Campanhas, Conjuntos e Anúncios.',
      'Use o filtro de datas para mudar o período.',
      'Ligue/desligue itens e ajuste orçamentos direto na tabela.',
      'Use "Atribuir venda" para vincular manualmente uma venda sem UTM.',
    ],
    tip: 'Se aparecer "O Facebook limitou temporariamente as consultas", aguarde alguns minutos antes de clicar em Atualizar.',
  },
  {
    id: 'rules',
    title: '7. Criar regras automáticas',
    description: 'Automatize pausas e ajustes de orçamento.',
    steps: [
      'No menu lateral, abra "Regras" e clique em "Nova regra".',
      'Escolha as campanhas, a condição (ex.: CPA acima de R$ 50) e a ação.',
      'Defina a frequência de verificação e salve.',
    ],
  },
];

export default function FacebookTutorials() {
  return (
    <MainLayout title="Tutoriais do Facebook">
      <div className="max-w-3xl space-y-6">
        <Link to="/support" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar para Suporte
        </Link>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Passo a passo</h2>
          <p className="text-sm text-muted-foreground mb-4">Siga os tutoriais na ordem para configurar tudo corretamente.</p>
          <Accordion type="single" collapsible defaultValue="connect">
            {tutorials.map((t) => (
              <AccordionItem key={t.id} value={t.id}>
                <AccordionTrigger className="text-left">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground font-normal">{t.description}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="space-y-3">
                    {t.steps.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                        <span className="pt-0.5">{s}</span>
                      </li>
                    ))}
                  </ol>
                  {t.tip && (
                    <div className="mt-4 flex gap-2 rounded-lg bg-muted p-3 text-sm">
                      <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{t.tip}</span>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </MainLayout>
  );
}
