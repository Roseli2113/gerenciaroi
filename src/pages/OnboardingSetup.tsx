import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Facebook, Wifi, Cloud, Code2, Eye, Copy, Download } from 'lucide-react';
import { useMetaAuth } from '@/hooks/useMetaAuth';
import { useWebhooks } from '@/hooks/useWebhooks';
import { useApiCredentials } from '@/hooks/useApiCredentials';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { CreateWebhookDialog } from '@/components/integrations/CreateWebhookDialog';
import { CreateCredentialDialog } from '@/components/integrations/CreateCredentialDialog';
import { UtmScriptsDialog } from '@/components/integrations/UtmScriptsDialog';
import logoGerenciaRoi from '@/assets/Logo_gerencia_roi.png';
import { toast } from 'sonner';

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
  const { isConnected, connection, connect, isLoading, toggleAccountActive, refreshAdAccounts } = useMetaAuth();
  const { createWebhook } = useWebhooks();
  const { createCredential } = useApiCredentials();
  const { user } = useAuth();

  const platform = (location.state as any)?.platform || 'Meta';
  const strategy = (location.state as any)?.strategy || 'Página de Vendas';

  // currentStepIndex: which step the user is currently on
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeAccounts, setActiveAccounts] = useState<Record<string, boolean>>({});
  const [activateAll, setActivateAll] = useState(false);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);
  const [isUtmScriptsOpen, setIsUtmScriptsOpen] = useState(false);
  const [utmScriptInstalled, setUtmScriptInstalled] = useState(false);
  const [liveScriptCopied, setLiveScriptCopied] = useState(false);

  // When Meta connects, advance to step 1 (Contas Meta)
  useEffect(() => {
    if (isConnected && currentStepIndex === 0) {
      setCurrentStepIndex(1);
    }
  }, [isConnected]);

  // Initialize active accounts from connection
  useEffect(() => {
    if (connection?.adAccounts) {
      const initial: Record<string, boolean> = {};
      connection.adAccounts.forEach(acc => {
        initial[acc.id] = acc.is_active ?? false;
      });
      setActiveAccounts(initial);
    }
  }, [connection?.adAccounts]);

  const getStepState = (index: number) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'pending';
  };

  const handleToggleAccount = async (accountId: string, value: boolean) => {
    setActiveAccounts(prev => ({ ...prev, [accountId]: value }));
    await toggleAccountActive(accountId, value);
  };

  const handleActivateAll = (value: boolean) => {
    setActivateAll(value);
    if (connection?.adAccounts) {
      const updated: Record<string, boolean> = {};
      connection.adAccounts.forEach(acc => {
        updated[acc.id] = value;
      });
      setActiveAccounts(updated);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      navigate('/integrations');
    }
  };

  const canAdvance = () => {
    if (currentStepIndex === 0) return isConnected;
    return true;
  };

  const getAccountStatus = (status: number) => {
    return status === 1 ? 'Ativa' : 'Desabilitada';
  };

  const renderMainContent = () => {
    const stepId = steps[currentStepIndex]?.id;

    if (stepId === 'conexao-meta') {
      return (
        <div className="flex-1 p-8 max-w-2xl">
          <h1 className="text-white text-2xl font-semibold mb-6">
            Conecte com sua conta do Meta Ads:
          </h1>

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
      );
    }

    if (stepId === 'contas-meta') {
      const accounts = connection?.adAccounts || [];
      return (
        <div className="flex-1 p-8 max-w-2xl">
          <h1 className="text-white text-2xl font-semibold mb-6">
            Escolha suas contas de anúncio da Meta:
          </h1>

          <div className="bg-[hsl(220,20%,14%)] border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <span className="text-white font-semibold">Contas de Anúncio (Meta)</span>
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">Ativar todas:</span>
                <Switch
                  checked={activateAll}
                  onCheckedChange={handleActivateAll}
                />
              </div>
            </div>

            <div className="px-6 py-3 border-b border-white/5">
              <p className="text-white/50 text-sm">Escolha suas contas de anúncio:</p>
            </div>

            {/* Account list */}
            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
              {accounts.length === 0 ? (
                <div className="px-6 py-8 text-center text-white/40 text-sm">
                  Nenhuma conta de anúncio encontrada.
                </div>
              ) : (
                accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-white text-sm font-medium">{acc.name}</p>
                      <p className="text-white/50 text-xs">status: {getAccountStatus(acc.account_status)}</p>
                    </div>
                    <Switch
                      checked={activeAccounts[acc.id] ?? false}
                      onCheckedChange={(val) => handleToggleAccount(acc.id, val)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'plataforma-vendas') {
      return (
        <div className="flex-1 p-8 max-w-3xl">
          <h1 className="text-foreground text-2xl font-semibold mb-6">
            Conecte uma fonte de vendas:
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Webhooks Card */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-foreground font-semibold text-base">Webhooks</span>
                <Wifi className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm flex-1">
                Adicione webhooks para se conectar com as plataformas de venda:
              </p>
              <button
                onClick={() => setIsWebhookDialogOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-5 py-2.5 rounded-lg text-sm font-semibold w-fit"
              >
                Adicionar Webhook
              </button>
            </div>

            {/* API Credentials Card */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-foreground font-semibold text-base">Credenciais de API</span>
                <Cloud className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm flex-1">
                Adicione credenciais de API para integrar com outras ferramentas:
              </p>
              <button
                onClick={() => setIsCredentialDialogOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-5 py-2.5 rounded-lg text-sm font-semibold w-fit"
              >
                Adicionar Credencial
              </button>
            </div>
          </div>

          <div>
            <p className="text-foreground font-medium text-sm mb-1">Precisa de ajuda?</p>
            <p className="text-muted-foreground text-sm">
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
      );
    }

    if (stepId === 'pagina-vendas') {
      const userId = user?.id || 'SEU_USER_ID';
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zwylxoajyyjflvvcwpvz.supabase.co';
      const liveScript = `<!-- Gerencia ROI - Visitantes ao Vivo -->
<script>
(function(){
  var uid="${userId}";
  var sid=Math.random().toString(36).substr(2,12)+Date.now().toString(36);
  var url="${supabaseUrl}/functions/v1/track-visitor";
  function send(action){
    var data=JSON.stringify({user_id:uid,session_id:sid,page_url:location.href,action:action});
    if(navigator.sendBeacon){navigator.sendBeacon(url,data)}
    else{fetch(url,{method:"POST",body:data,headers:{"Content-Type":"application/json"},keepalive:true})}
  }
  send("heartbeat");
  setInterval(function(){send("heartbeat")},15000);
  window.addEventListener("beforeunload",function(){send("leave")});
  document.addEventListener("visibilitychange",function(){
    if(document.hidden){send("leave")}else{send("heartbeat")}
  });
})();
</script>`;

      const handleCopyLiveScript = () => {
        navigator.clipboard.writeText(liveScript);
        setLiveScriptCopied(true);
        toast.success('Script copiado!');
        setTimeout(() => setLiveScriptCopied(false), 2000);
      };

      return (
        <div className="flex-1 p-8 max-w-3xl">
          <h1 className="text-foreground text-2xl font-semibold mb-6">
            Instale o script na sua página de vendas:
          </h1>

          {/* Scripts Card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
            <div className="px-6 py-4 border-b border-border">
              <span className="text-foreground font-semibold text-base">Scripts</span>
            </div>

            {/* UTM Script Row */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Code2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">Script de UTMs</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Use esse script nas suas PVs para capturar as UTMs</p>
                </div>
              </div>
              <button
                onClick={() => setIsUtmScriptsOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                Ver opções
              </button>
            </div>

            {/* Live Visitors Script Row */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-sm">Script de Visitantes ao Vivo</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Rastreie visitantes em tempo real na sua página</p>
                  </div>
                </div>
                <button
                  onClick={handleCopyLiveScript}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shrink-0"
                >
                  {liveScriptCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {liveScriptCopied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <pre className="bg-muted/50 border border-border rounded-lg p-3 text-xs overflow-x-auto max-h-36 overflow-y-auto">
                <code className="text-foreground/70">{liveScript}</code>
              </pre>
            </div>
          </div>

          {/* Confirmation checkbox */}
          <div className="flex items-center gap-3 mb-6">
            <Checkbox
              id="utm-installed"
              checked={utmScriptInstalled}
              onCheckedChange={(val) => setUtmScriptInstalled(!!val)}
            />
            <label htmlFor="utm-installed" className="text-foreground text-sm cursor-pointer select-none">
              Já instalei o script de UTMs
            </label>
          </div>

          {/* Help */}
          <div>
            <p className="text-foreground font-medium text-sm mb-1">Precisa de ajuda?</p>
            <p className="text-muted-foreground text-sm">
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
      );
    }

    if (stepId === 'utms-meta') {
      return (
        <div className="flex-1 p-8 max-w-2xl">
          <h1 className="text-white text-2xl font-semibold mb-6">
            Configure as UTMs da Meta:
          </h1>
          <div className="bg-[hsl(220,20%,14%)] border border-white/10 rounded-xl p-6">
            <p className="text-white/60 text-sm mb-4">
              As UTMs permitem rastrear de qual campanha, conjunto ou anúncio vieram suas vendas.
            </p>
            <p className="text-white/40 text-sm">
              Acesse a aba de <strong className="text-white/60">UTMs</strong> nas Integrações para gerar e configurar seus códigos.
            </p>
          </div>
          <div className="mt-6 bg-primary/10 border border-primary/30 rounded-xl p-5">
            <p className="text-primary font-semibold text-base mb-1">🎉 Configuração COMPLETA!</p>
            <p className="text-white/60 text-sm">
              Seu painel está configurado. Acesse o dashboard para ver suas métricas.
            </p>
          </div>
        </div>
      );
    }

    return null;
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
              const state = getStepState(index);
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
          {renderMainContent()}

          {/* Footer */}
          <footer className="border-t border-white/10 px-8 py-4 flex items-center justify-center">
            <button
              onClick={handleNext}
              disabled={!canAdvance()}
              className={`px-10 py-3 rounded-lg font-semibold text-sm transition-all
                ${canAdvance()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
            >
              {currentStepIndex === steps.length - 1 ? 'Concluir' : 'Próximo Passo'}
            </button>
          </footer>
        </main>
      </div>

      <CreateWebhookDialog
        open={isWebhookDialogOpen}
        onOpenChange={setIsWebhookDialogOpen}
        onCreateWebhook={createWebhook}
      />

      <CreateCredentialDialog
        open={isCredentialDialogOpen}
        onOpenChange={setIsCredentialDialogOpen}
        onCreate={createCredential}
      />

      <UtmScriptsDialog
        open={isUtmScriptsOpen}
        onOpenChange={setIsUtmScriptsOpen}
      />
    </div>
  );
}
