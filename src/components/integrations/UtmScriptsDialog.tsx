import { useState } from 'react';
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

interface UtmScriptsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const projectUrl = 'https://zwylxoajyyjflvvcwpvz.supabase.co/functions/v1/utms/latest.js';

const platformScripts: Record<string, string> = {
  hotmart: `<script
  src="${projectUrl}"
  data-utmify-prevent-subids
  async
  defer
></script>`,
  cartpanda: `<script
  src="${projectUrl}"
  data-utmify-prevent-xcod-sck
  data-utmify-prevent-subids
  data-utmify-ignore-iframe
  data-utmify-is-cartpanda
  async
  defer
></script>`,
  buygoods: `<script
  src="${projectUrl}"
  data-utmify-prevent-xcod-sck
  async
  defer
></script>`,
  clickbank: `<script
  src="${projectUrl}"
  data-utmify-prevent-xcod-sck
  data-utmify-is-click-bank
  async
  defer
></script>`,
  maxweb: `<script
  src="${projectUrl}"
  data-utmify-prevent-xcod-sck
  async
  defer
></script>`,
  doppus: `<script
  src="${projectUrl}"
  data-utmify-prevent-xcod-sck
  data-utmify-prevent-subids
  data-utmify-plus-signal
  async
  defer
></script>`,
  outra: `<script
  src="${projectUrl}"
  data-utmify-prevent-xcod-sck
  data-utmify-prevent-subids
  async
  defer
></script>`,
};

const platforms = [
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

  const handleDownload = () => {
    if (!selectedPlatform) {
      toast.error('Selecione uma plataforma');
      return;
    }

    const script = platformScripts[selectedPlatform];
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

    navigator.clipboard.writeText(platformScripts[selectedPlatform]);
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
