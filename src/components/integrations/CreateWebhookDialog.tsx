import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Eye, EyeOff, ArrowLeft, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateWebhook: (data: {
    platform: string;
    name: string;
    clientId?: string;
    clientSecret?: string;
    webhookUrl?: string;
    token?: string;
    pixelId?: string;
  }) => Promise<unknown>;
}

const PLATFORMS = [
  'AdsRoi', 'Hotmart', 'Kiwify', 'Cartpanda', 'Vega 1', 'Kirvano', 'Shopify', 'PerfectPay',
  'Yampi', 'Lastlink', 'Payt', 'Logzz', 'Adoorei', 'TriboPay', 'Paradise', 'Clickbank',
  'Ticto', 'Eduzz', 'Braip', 'Pepper', 'Woocommerce', 'BuyGoods', 'MundPay', 'Disrupty',
  'Greenn', 'Monetizze', 'Guru', 'Digistore', 'Hubla', 'Doppus', 'Frendz', 'InvictusPay',
  'Appmax', 'NitroPagamentos', 'GoatPay', 'Hebreus', 'IExperience', 'PagTrust', 'NuvemShop',
  'FortPay', 'Systeme', 'IronPay', 'CinqPay', 'SharkPays', 'Maxweb', 'Zouti', 'Pantherfy',
  'StrivPay', 'AtomoPay', 'AllPay', 'BullPay', 'OctusPay', 'Zippify', 'Masterfy', 'InovaPag',
  'SoutPay', 'WolfPay', 'SigmaPagamentos', 'Nexopayt', 'WeGate', 'Unicornify', 'Allpes',
  'VittaPay', 'FluxionPay', 'NezzyPay', 'PMHMPay', 'TrivexPay', 'GatPay', 'BearPay',
  'AmandisPay', 'DigiPag', 'AlphaPay', 'AssetPay', 'BrGateway', 'Creedx', 'Hotfy',
  'KlivoPay', 'Plumify', 'PrimeGate', 'Wise2Pay', 'VisionPay', 'SharkBytePay', 'SigmaPay',
  'ZeroOnePay', 'Traxon', 'Bloo', 'KitePay', 'B4you', 'Risepay', 'Urus', 'Cakto',
  'Flashpay', 'DigitalMart', 'Exattus', 'LunarCash', 'YouShop', 'BlackPay', 'VenuzPay',
  'LunaCheckout', 'FullSale', 'BullsPay', 'Moodi', 'NikaPay', 'GhostsPay', 'KeedPay',
  'Salduu', 'ViperPay', 'Sunize', 'Assiny', 'Wiapy', 'UnicoPag', 'ImperialPay', 'Zedy',
  'Sinix', 'Voomp', 'Ombrelone', 'PushinPay', 'Genesys', 'OnProfit', 'SacaPay', 'Cloudfy',
  'Kuenha', 'NinjaPay', 'Xgrow', 'ggCheckout', 'PanteraCheckout', 'NublaPay', 'Cartly',
  'Pagah', 'Pagsafe', 'Nomadfy', 'Sync', 'LPQV', 'Lowify'
];

// Platforms that need a webhook URL to be provided to them (URL de conexão)
const PLATFORMS_WITH_WEBHOOK_URL = ['Lowify', 'AdsRoi'];

// Define platform-specific fields
const getPlatformFields = (platform: string): { id: string; label: string; type: 'text' | 'password' | 'readonly' }[] => {
  const commonFields = [
    { id: 'name', label: 'Nome', type: 'text' as const },
  ];

  // Platforms with Client ID and Client Secret
  const platformsWithClientCredentials = [
    'Hotmart', 'Kiwify', 'Eduzz', 'Braip', 'Monetizze', 'PerfectPay', 'Ticto', 'Hubla'
  ];

  // Platforms with just API Key
  const platformsWithApiKey = [
    'Shopify', 'Woocommerce', 'NuvemShop', 'Yampi'
  ];

  // Platforms with Secret Key
  const platformsWithSecretKey = [
    'Clickbank', 'BuyGoods', 'Digistore', 'Maxweb'
  ];

  // Platforms that only need name + webhook URL to copy
  if (PLATFORMS_WITH_WEBHOOK_URL.includes(platform)) {
    return [
      ...commonFields,
      { id: 'webhookUrl', label: 'URL do Webhook', type: 'readonly' },
    ];
  }

  if (platformsWithClientCredentials.includes(platform)) {
    return [
      ...commonFields,
      { id: 'clientId', label: 'Client ID', type: 'text' },
      { id: 'clientSecret', label: 'Client Secret', type: 'password' },
      { id: 'webhookToken', label: 'Token do Webhook', type: 'password' },
    ];
  }

  if (platformsWithApiKey.includes(platform)) {
    return [
      ...commonFields,
      { id: 'apiKey', label: 'API Key', type: 'password' },
      { id: 'webhookToken', label: 'Token do Webhook', type: 'password' },
    ];
  }

  if (platformsWithSecretKey.includes(platform)) {
    return [
      ...commonFields,
      { id: 'secretKey', label: 'Secret Key', type: 'password' },
      { id: 'webhookToken', label: 'Token do Webhook', type: 'password' },
    ];
  }

  // Default fields for other platforms
  return [
    ...commonFields,
    { id: 'token', label: 'Token', type: 'password' },
    { id: 'webhookToken', label: 'Token do Webhook', type: 'password' },
  ];
};

export function CreateWebhookDialog({ open, onOpenChange, onCreateWebhook }: CreateWebhookDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate webhook URL for platforms that need it
  const webhookUrl = `https://zwylxoajyyjflvvcwpvz.supabase.co/functions/v1/webhook-receiver`;

  const filteredPlatforms = PLATFORMS.filter(platform =>
    platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlatformSelect = (platform: string) => {
    setSelectedPlatform(platform);
    setFormData({});
    setShowPasswords({});
    setCopiedUrl(false);
  };

  const handleBack = () => {
    setSelectedPlatform(null);
    setFormData({});
    setShowPasswords({});
    setCopiedUrl(false);
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const togglePasswordVisibility = (fieldId: string) => {
    setShowPasswords(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const handleCopyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedUrl(true);
      toast.success('URL copiada com sucesso!');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar URL');
    }
  };

  const handleCreateWebhook = async () => {
    if (!selectedPlatform || !formData.name) return;
    
    setIsSubmitting(true);
    try {
      await onCreateWebhook({
        platform: selectedPlatform,
        name: formData.name,
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        webhookUrl: isUrlPlatform ? webhookUrl : formData.webhookUrl,
        token: formData.token || formData.webhookToken || formData.apiKey || formData.secretKey,
        pixelId: formData.pixelId,
      });
      
      onOpenChange(false);
      setSelectedPlatform(null);
      setFormData({});
      setSearchTerm('');
      setCopiedUrl(false);
    } catch (error) {
      console.error('Error creating webhook:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedPlatform(null);
      setFormData({});
      setSearchTerm('');
      setShowPasswords({});
      setCopiedUrl(false);
    }
    onOpenChange(isOpen);
  };

  const platformFields = selectedPlatform ? getPlatformFields(selectedPlatform) : [];
  const isUrlPlatform = selectedPlatform && PLATFORMS_WITH_WEBHOOK_URL.includes(selectedPlatform);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedPlatform && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {selectedPlatform ? `Webhook ${selectedPlatform}` : 'Webhooks'}
          </DialogTitle>
        </DialogHeader>

        {!selectedPlatform ? (
          <>
            <p className="text-sm text-muted-foreground">
              Selecione uma plataforma para começar:
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por plataforma"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Platform Grid */}
            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="flex flex-wrap gap-2 py-2">
                {filteredPlatforms.map((platform) => (
                  <Button
                    key={platform}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handlePlatformSelect(platform)}
                  >
                    {platform}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="space-y-4">
            <a
              href="#"
              className="text-sm text-primary hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              Clique aqui para ver como integrar com a {selectedPlatform}
            </a>

            {platformFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <div className="relative">
                  {field.type === 'readonly' ? (
                    <div className="flex gap-2">
                      <Input
                        id={field.id}
                        type="text"
                        value={webhookUrl}
                        readOnly
                        className="flex-1 bg-muted text-muted-foreground cursor-text"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCopyWebhookUrl}
                        className="shrink-0"
                      >
                        {copiedUrl ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        id={field.id}
                        type={field.type === 'password' && !showPasswords[field.id] ? 'password' : 'text'}
                        placeholder={field.type === 'text' ? `Nome do Webhook` : field.label}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                      />
                      {field.type === 'password' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => togglePasswordVisibility(field.id)}
                        >
                          {showPasswords[field.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {isUrlPlatform && (
              <p className="text-sm text-muted-foreground">
                Copie a URL acima e cole no campo "URL do Webhook" na plataforma {selectedPlatform}.
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleCreateWebhook}
              disabled={!formData.name || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isUrlPlatform ? 'Salvar Webhook' : 'Criar Webhook'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
