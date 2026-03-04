import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UtmScriptsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const projectUrl = 'https://zwylxoajyyjflvvcwpvz.supabase.co/functions/v1/utms/latest.js';
const trackCheckoutUrl = 'https://zwylxoajyyjflvvcwpvz.supabase.co/functions/v1/track-checkout';

function buildAdsroiScript(token: string) {
  return `<script
  src="${projectUrl}"
  data-gerenciaroi-prevent-xcod-sck
  data-gerenciaroi-prevent-subids
  data-gerenciaroi-token="${token}"
  data-gerenciaroi-endpoint="${trackCheckoutUrl}"
  async
  defer
></script>`;
}

const platformScripts: Record<string, string> = {
  hotmart: `<script
  src="${projectUrl}"
  data-gerenciaroi-prevent-subids
  async
  defer
></script>`,
  cartpanda: `<script
  src="${projectUrl}"
  data-gerenciaroi-prevent-xcod-sck
  data-gerenciaroi-prevent-subids
  data-gerenciaroi-ignore-iframe
  data-gerenciaroi-is-cartpanda
  async
  defer
></script>`,
  buygoods: `<script
  src="${projectUrl}"
  data-gerenciaroi-prevent-xcod-sck
  async
  defer
></script>`,
  clickbank: `<script
  src="${projectUrl}"
  data-gerenciaroi-prevent-xcod-sck
  data-gerenciaroi-is-click-bank
  async
  defer
></script>`,
  maxweb: `<script
  src="${projectUrl}"
  data-gerenciaroi-prevent-xcod-sck
  async
  defer
></script>`,
  doppus: `<script
  src="${projectUrl}"
  data-gerenciaroi-prevent-xcod-sck
  data-gerenciaroi-prevent-subids
  data-gerenciaroi-plus-signal
  async
  defer
></script>`,
  outra: `<script
  src="${projectUrl}"
  data-gerenciaroi-prevent-xcod-sck
  data-gerenciaroi-prevent-subids
  async
  defer
></script>`,
};

const platforms = [
  { id: 'adsroi', label: 'AdsRoi (com atribuição automática)' },
  { id: 'hotmart', label: 'Hotmart' },
  { id: 'cartpanda', label: 'Cartpanda' },
  { id: 'buygoods', label: 'BuyGoods' },
  { id: 'clickbank', label: 'ClickBank' },
  { id: 'maxweb', label: 'Maxweb' },
  { id: 'doppus', label: 'Doppus' },
  { id: 'outra', label: 'Outra' },
];

export function UtmScriptsDialog({ open, onOpenChange }: UtmScriptsDialogProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [adsroiToken, setAdsroiToken] = useState<string>('');

  // Fetch AdsRoi webhook token
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('webhooks')
        .select('token')
        .eq('user_id', user.id)
        .eq('platform', 'adsroi')
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      if (data?.token) setAdsroiToken(data.token);
    })();
  }, [open]);

  const getScript = () => {
    if (selectedPlatform === 'adsroi') {
      return buildAdsroiScript(adsroiToken || 'SEU_TOKEN_AQUI');
    }
    return platformScripts[selectedPlatform] || '';
  };

  const handleDownload = () => {
    if (!selectedPlatform) {
      toast.error('Selecione uma plataforma');
      return;
    }

    const script = getScript();
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gerenciaroi-utms-script.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Script baixado!');
  };

  const handleCopy = () => {
    if (!selectedPlatform) {
      toast.error('Selecione uma plataforma');
      return;
    }

    navigator.clipboard.writeText(getScript());
    setCopied(true);
    toast.success('Script copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecione a sua plataforma de vendas para obter o script apropriado:</DialogTitle>
        </DialogHeader>

        <RadioGroup
          value={selectedPlatform}
          onValueChange={setSelectedPlatform}
          className="space-y-2 mt-4"
        >
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              onClick={() => setSelectedPlatform(platform.id)}
            >
              <RadioGroupItem value={platform.id} id={platform.id} />
              <Label htmlFor={platform.id} className="cursor-pointer flex-1">
                {platform.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {selectedPlatform === 'adsroi' && (
          <div className="mt-2 p-3 rounded-lg bg-primary/10 text-sm text-foreground">
            <strong>📡 Tracking de Checkout:</strong> Este script captura o email do cliente no checkout e envia as UTMs para o nosso backend. Assim, quando a AdsRoi enviar a venda via webhook, o sistema automaticamente vincula à campanha correta.
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleDownload}
            disabled={!selectedPlatform}
            className="flex-1 gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar
          </Button>
          <Button
            onClick={handleCopy}
            disabled={!selectedPlatform}
            variant="outline"
            className="flex-1 gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
