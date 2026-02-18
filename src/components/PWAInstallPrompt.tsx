import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem('pwa-dismissed')) {
      setDismissed(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isMobile || !showBanner || dismissed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-4 left-3 right-3 z-50 bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-fade-in">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Instalar Gerencia ROI</p>
        <p className="text-xs text-muted-foreground">Acesse mais rápido direto da tela inicial</p>
      </div>
      <Button size="sm" onClick={handleInstall} className="gap-1.5 shrink-0">
        <Download className="w-4 h-4" />
        Instalar
      </Button>
      <button onClick={handleDismiss} className="shrink-0 p-1">
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
