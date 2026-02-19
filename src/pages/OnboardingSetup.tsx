import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Facebook } from 'lucide-react';
import { useMetaAuth } from '@/hooks/useMetaAuth';
import logoGerenciaRoi from '@/assets/Logo_gerencia_roi.png';

const steps = [
  { id: 'conexao-meta', label: 'Conexão Meta' },
  { id: 'contas-meta', label: 'Contas Meta' },
  { id: 'plataforma-vendas', label: 'Plataforma de Vendas' },
  { id: 'pagina-vendas', label: 'Página de Vendas' },
  { id: 'utms-meta', label: 'UTMs da Meta' },
];

export default function OnboardingSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, connection, connect, isLoading } = useMetaAuth();

  // Get params from location state
  const platform = (location.state as any)?.platform || 'Meta';
  const strategy = (location.state as any)?.strategy || 'Página de Vendas';

  // Determine completed steps based on connection status
  const completedSteps = isConnected
    ? ['conexao-meta', 'contas-meta', 'plataforma-vendas']
    : [];
  const currentStep = isConnected ? 'pagina-vendas' : 'conexao-meta';

  const getStepState = (stepId: string) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-[hsl(220,20%,10%)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src={logoGerenciaRoi} alt="Gerencia ROI" className="h-9 w-9 object-contain" />
          <span className="text-white font-bold text-lg tracking-tight">Gerencia ROI</span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            Está perdido? Assista o tutorial em vídeo!
          </a>
          <button
            onClick={() => navigate('/integrations')}
            className="text-sm text-muted-foreground hover:text-white underline underline-offset-2 transition-colors"
          >
            Pular Configuração
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-72 bg-[hsl(220,20%,8%)] border-r border-white/10 flex flex-col p-6">
          <div className="mb-8">
            <p className="text-primary font-bold text-base mb-3">Resultado do Quiz:</p>
            <div className="space-y-2">
              <div>
                <p className="text-white/50 text-xs">Plataformas de Anúncio:</p>
                <p className="text-primary text-sm font-medium">{platform}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Tipos de Funil:</p>
                <p className="text-primary text-sm font-medium">{strategy}</p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-0">
            {steps.map((step, index) => {
              const state = getStepState(step.id);
              return (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-all
                      ${state === 'completed'
                        ? 'bg-primary border-primary'
                        : state === 'current'
                        ? 'bg-transparent border-primary'
                        : 'bg-transparent border-white/20'
                      }`}>
                      {state === 'completed' ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : null}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 ${
                        state === 'completed' ? 'bg-primary' : 'bg-white/10'
                      }`} />
                    )}
                  </div>
                  <p className={`pt-1.5 text-sm font-medium transition-colors
                    ${state === 'completed'
                      ? 'text-primary line-through'
                      : state === 'current'
                      ? 'text-primary'
                      : 'text-white/40'
                    }`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-auto">
            <button
              onClick={() => navigate('/onboarding/strategy')}
              className="text-sm text-muted-foreground hover:text-white underline underline-offset-2 transition-colors"
            >
              Refazer Quiz
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-8 max-w-2xl">
            <h1 className="text-white text-2xl font-semibold mb-6">
              Conecte com sua conta do Meta Ads:
            </h1>

            {/* Meta Ads Card */}
            <div className="bg-[hsl(220,20%,14%)] border border-white/10 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Facebook className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-semibold text-lg">Meta Ads</span>
              </div>

              <p className="text-white/60 text-sm mb-4">Conecte seus perfis por aqui:</p>

              {isConnected && connection ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-[hsl(220,20%,18%)] border border-white/10 rounded-lg px-4 py-3">
                    <span className="text-white text-sm font-medium">{connection.user.name}</span>
                    <button className="text-white/40 hover:text-white transition-colors text-lg leading-none">⋯</button>
                  </div>
                  <button
                    onClick={connect}
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-5 py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Adicionar perfil
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {isLoading ? 'Conectando...' : 'Conectar Meta Ads'}
                </button>
              )}
            </div>

            {/* Help Section */}
            <div>
              <p className="text-white font-medium text-sm mb-1">Precisa de ajuda?</p>
              <p className="text-white/50 text-sm">
                Assista ao tutorial para garantir que suas vendas serão marcadas com sucesso.{' '}
                <a
                  href="https://www.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                >
                  Assistir agora
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-white/10 px-8 py-4 flex items-center justify-center">
            <button
              onClick={() => navigate('/integrations')}
              disabled={!isConnected}
              className={`px-10 py-3 rounded-lg font-semibold text-sm transition-all
                ${isConnected
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
            >
              Próximo Passo
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
