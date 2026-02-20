import { useState, useEffect, useRef } from 'react';
import { X, Plus, Info, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AddPixelDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  editingPixelId?: string | null;
}

interface MetaPixel {
  id: string;
  pixelId: string;
  token: string;
  apelido: string;
  confirmed: boolean;
}

interface PixelFormState {
  pixelId: string;
  token: string;
  apelido: string;
}

export function AddPixelDrawer({ open, onOpenChange, onSaved, editingPixelId }: AddPixelDrawerProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [pixelType, setPixelType] = useState('meta');
  const [metaPixels, setMetaPixels] = useState<MetaPixel[]>([]);
  const [leadRule, setLeadRule] = useState('disabled');
  const [addToCartRule, setAddToCartRule] = useState('disabled');
  const [initiateCheckoutRule, setInitiateCheckoutRule] = useState('enabled');
  const [checkoutDetectionRule, setCheckoutDetectionRule] = useState('contains_text');
  const [checkoutButtonText, setCheckoutButtonText] = useState('');
  const [purchaseSendConfig, setPurchaseSendConfig] = useState('approved_only');
  const [purchaseValueType, setPurchaseValueType] = useState('sale_value');
  const [purchaseProduct, setPurchaseProduct] = useState('any');
  const [ipConfig, setIpConfig] = useState('ipv6_ipv4');
  const [checkoutTextError, setCheckoutTextError] = useState('');

  const [pixelForm, setPixelForm] = useState<PixelFormState>({ pixelId: '', token: '', apelido: '' });
  const [showPixelForm, setShowPixelForm] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedPixelId, setGeneratedPixelId] = useState('');
  const wasOpenRef = useRef(false);
  const isEditing = !!editingPixelId;

  // Only reset/load when drawer transitions from closed → open
  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;

    if (!justOpened) return;

    if (editingPixelId && user) {
      (async () => {
        const { data: pixel } = await supabase
          .from('pixels')
          .select('*')
          .eq('id', editingPixelId)
          .single();
        if (pixel) {
          setName(pixel.name);
          setPixelType(pixel.pixel_type);
          setLeadRule(pixel.lead_rule);
          setAddToCartRule(pixel.add_to_cart_rule);
          setInitiateCheckoutRule(pixel.initiate_checkout_rule);
          setCheckoutDetectionRule(pixel.checkout_detection_rule);
          setCheckoutButtonText(pixel.checkout_button_text || '');
          setPurchaseSendConfig(pixel.purchase_send_config);
          setPurchaseValueType(pixel.purchase_value_type);
          setPurchaseProduct(pixel.purchase_product);
          setIpConfig(pixel.ip_config);
          setGeneratedPixelId(pixel.id.replace(/-/g, '').slice(0, 24));
        }
        const { data: metas } = await supabase
          .from('pixel_meta_ids')
          .select('*')
          .eq('pixel_id', editingPixelId);
        if (metas) {
          setMetaPixels(metas.map(m => ({
            id: m.id,
            pixelId: m.meta_pixel_id,
            token: m.token || '',
            apelido: m.apelido || '',
            confirmed: true,
          })));
        }
      })();
    } else if (!editingPixelId) {
      // Reset form for new pixel
      setName('');
      setPixelType('meta');
      setMetaPixels([]);
      setLeadRule('disabled');
      setAddToCartRule('disabled');
      setInitiateCheckoutRule('enabled');
      setCheckoutDetectionRule('contains_text');
      setCheckoutButtonText('');
      setPurchaseSendConfig('approved_only');
      setPurchaseValueType('sale_value');
      setPurchaseProduct('any');
      setIpConfig('ipv6_ipv4');
      setGeneratedPixelId('');
      setShowPixelForm(false);
    }
  }, [open, editingPixelId, user]);

  const openPixelForm = () => {
    setPixelForm({ pixelId: '', token: '', apelido: '' });
    setShowPixelForm(true);
  };

  const confirmPixel = () => {
    if (!pixelForm.pixelId.trim()) {
      toast.error('Informe o ID do Pixel');
      return;
    }
    setMetaPixels(prev => [...prev, {
      id: crypto.randomUUID(),
      pixelId: pixelForm.pixelId,
      token: pixelForm.token,
      apelido: pixelForm.apelido,
      confirmed: true,
    }]);
    setShowPixelForm(false);
  };

  const removeMetaPixel = (id: string) => {
    setMetaPixels(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Informe o nome do pixel');
      return;
    }
    if (initiateCheckoutRule === 'enabled' && !checkoutButtonText.trim()) {
      setCheckoutTextError('O texto de detecção é obrigatório');
      return;
    }
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }
    setCheckoutTextError('');
    setSaving(true);

    try {
      const pixelPayload = {
        name,
        pixel_type: pixelType,
        lead_rule: leadRule,
        add_to_cart_rule: addToCartRule,
        initiate_checkout_rule: initiateCheckoutRule,
        checkout_detection_rule: checkoutDetectionRule,
        checkout_button_text: checkoutButtonText,
        purchase_send_config: purchaseSendConfig,
        purchase_value_type: purchaseValueType,
        purchase_product: purchaseProduct,
        ip_config: ipConfig,
      };

      let pixelId: string;

      if (isEditing && editingPixelId) {
        const { error } = await supabase.from('pixels').update(pixelPayload).eq('id', editingPixelId);
        if (error) throw error;
        pixelId = editingPixelId;

        // Replace meta pixels: delete old, insert new
        await supabase.from('pixel_meta_ids').delete().eq('pixel_id', editingPixelId);
      } else {
        const { data: pixelData, error: pixelError } = await supabase
          .from('pixels')
          .insert({ user_id: user.id, ...pixelPayload })
          .select('id')
          .single();
        if (pixelError) throw pixelError;
        pixelId = pixelData.id;
      }

      if (metaPixels.length > 0) {
        const metaRows = metaPixels.map(mp => ({
          pixel_id: pixelId,
          user_id: user.id,
          meta_pixel_id: mp.pixelId,
          token: mp.token,
          apelido: mp.apelido,
        }));
        const { error: metaError } = await supabase.from('pixel_meta_ids').insert(metaRows);
        if (metaError) throw metaError;
      }

      // Use the actual Meta Pixel ID from the first configured meta pixel
      const firstMetaPixelId = metaPixels.length > 0 ? metaPixels[0].pixelId : pixelId.replace(/-/g, '').slice(0, 24);
      setGeneratedPixelId(firstMetaPixelId);
      if (!isEditing) {
        setShowSuccessDialog(true);
      }
      toast(isEditing ? 'PIXEL ATUALIZADO COM SUCESSO' : 'O PIXEL FOI SALVO COM SUCESSO', {
        style: { backgroundColor: '#22c55e', color: '#ffffff', border: 'none' },
      });
      onSaved?.();
      if (isEditing) {
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error('Erro ao salvar pixel: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  // Build the IC detection script based on the configured rule
  const icButtonText = checkoutButtonText || 'Comprar';
  const icDetectionScript = initiateCheckoutRule === 'enabled' ? `
/* Gerencia ROI - Initiate Checkout auto-detection */
(function(){
  function fireIC(){
    if(window._groi_ic_fired) return;
    window._groi_ic_fired = true;
    fbq('track', 'InitiateCheckout');
    setTimeout(function(){ window._groi_ic_fired = false; }, 3000);
  }
  function checkEl(el){
    if(!el) return false;
    var txt = (el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || '').toLowerCase();
    return txt.indexOf('${icButtonText.toLowerCase()}') > -1;
  }
  document.addEventListener('click', function(e){
    var el = e.target;
    for(var i = 0; i < 5; i++){
      if(!el) break;
      if(checkEl(el)){ fireIC(); break; }
      el = el.parentElement;
    }
  }, true);
  /* Also detect navigation to checkout URL */
  var _pushState = history.pushState;
  history.pushState = function(){
    _pushState.apply(history, arguments);
    if(location.href.indexOf('checkout') > -1 || location.href.indexOf('order') > -1){ fireIC(); }
  };
  window.addEventListener('popstate', function(){
    if(location.href.indexOf('checkout') > -1 || location.href.indexOf('order') > -1){ fireIC(); }
  });
})();` : '';

  const generatedCode = `<!-- Gerencia ROI - Meta Pixel -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${generatedPixelId}');
fbq('track', 'PageView');${icDetectionScript}
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${generatedPixelId}&ev=PageView&noscript=1"
/></noscript>`;

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success('Código copiado!');
  };

  if (!open) return null;

  return (
    <TooltipProvider>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-50 bg-black/50" 
        onClick={() => onOpenChange(false)} 
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border shadow-xl overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-bold text-foreground">{isEditing ? 'Editar Pixel' : 'Adicionar Pixel'}</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input 
              placeholder="Meu Pixel" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          {/* Tipo de Pixel */}
          <div className="space-y-2">
            <Label>Tipo de Pixel</Label>
            <Select value={pixelType} onValueChange={setPixelType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meta">Meta (Facebook)</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Código do Pixel (only in edit mode) */}
          {isEditing && generatedPixelId && (
            <div className="space-y-2">
              <Label>Código do Pixel</Label>
              <div className="relative">
                <Input 
                  readOnly 
                  value={generatedCode} 
                  className="pr-10 font-mono text-xs" 
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" 
                  onClick={copyCode}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Pixels da Meta */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Pixels da Meta</h3>
            
            {metaPixels.map((pixel) => (
              <div key={pixel.id} className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                <span className="text-sm text-foreground font-mono">{pixel.pixelId}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => removeMetaPixel(pixel.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {showPixelForm && (
              <div className="space-y-3 border border-border rounded-lg p-4">
                <div className="space-y-2">
                  <Label>ID do Pixel Meta</Label>
                  <Input
                    placeholder="1342429849238924"
                    value={pixelForm.pixelId}
                    onChange={(e) => setPixelForm(prev => ({ ...prev, pixelId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Token</Label>
                  <Input
                    placeholder="Token da API de Conversões"
                    value={pixelForm.token}
                    onChange={(e) => setPixelForm(prev => ({ ...prev, token: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apelido (opcional)</Label>
                  <Input
                    placeholder="Apelido para identificar o Pixel"
                    value={pixelForm.apelido}
                    onChange={(e) => setPixelForm(prev => ({ ...prev, apelido: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPixelForm(false)}>Fechar</Button>
                  <Button onClick={confirmPixel}>Confirmar</Button>
                </div>
              </div>
            )}

            <Button variant="outline" onClick={openPixelForm} className="gap-2">
              Adicionar <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Separator />

          {/* Regra de Lead */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Regra de Lead</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Envio de Lead</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Define quando o evento de Lead será enviado ao pixel</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={leadRule} onValueChange={setLeadRule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">Desabilitado</SelectItem>
                  <SelectItem value="enabled">Habilitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Regra de Add To Cart */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Regra de Add To Cart</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Envio de Add To Cart</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Define quando o evento de Add To Cart será enviado ao pixel</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={addToCartRule} onValueChange={setAddToCartRule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">Desabilitado</SelectItem>
                  <SelectItem value="enabled">Habilitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Regra de Initiate Checkout */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Regra de Initiate Checkout</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Envio de Initiate Checkout</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Define quando o evento de Initiate Checkout será enviado ao pixel</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={initiateCheckoutRule} onValueChange={setInitiateCheckoutRule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">Desabilitado</SelectItem>
                  <SelectItem value="enabled">Habilitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {initiateCheckoutRule === 'enabled' && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Regra de Detecção</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Como detectar o evento de checkout</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={checkoutDetectionRule} onValueChange={setCheckoutDetectionRule}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains_text">Contém texto</SelectItem>
                      <SelectItem value="url_contains">URL contém</SelectItem>
                      <SelectItem value="click_event">Evento de clique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Marcar se o botão de compra contém</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Texto que o botão deve conter para disparar o evento</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    placeholder="COMPRAR AGORA"
                    value={checkoutButtonText}
                    onChange={(e) => {
                      setCheckoutButtonText(e.target.value);
                      if (e.target.value.trim()) setCheckoutTextError('');
                    }}
                  />
                   {checkoutTextError && (
                     <p className="text-sm text-destructive mt-1">{checkoutTextError}</p>
                   )}
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Regra de Purchase */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Regra de Purchase</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Configuração de envio</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Define quais vendas serão enviadas como evento de Purchase</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={purchaseSendConfig} onValueChange={setPurchaseSendConfig}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved_only">Enviar apenas vendas aprovadas</SelectItem>
                  <SelectItem value="all">Enviar todas as vendas</SelectItem>
                  <SelectItem value="approved_paid">Enviar aprovadas e pagas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Valor do Envio</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Qual valor será enviado no evento de Purchase</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={purchaseValueType} onValueChange={setPurchaseValueType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale_value">Valor da venda</SelectItem>
                  <SelectItem value="commission">Valor da comissão</SelectItem>
                  <SelectItem value="custom">Valor personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Produto</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filtre por produto específico ou envie para qualquer produto</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={purchaseProduct} onValueChange={setPurchaseProduct}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="specific">Produto específico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Envio de IP nos eventos */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Envio de IP nos eventos</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Configuração de Endereço IP</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Define como o IP será enviado nos eventos do pixel</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={ipConfig} onValueChange={setIpConfig}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ipv6_ipv4">Enviar IPv6 se houver. Enviar IPv4 se não houver IP</SelectItem>
                  <SelectItem value="ipv4_only">Enviar apenas IPv4</SelectItem>
                  <SelectItem value="ipv6_only">Enviar apenas IPv6</SelectItem>
                  <SelectItem value="no_ip">Não enviar IP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full" size="lg" disabled={saving}>
            {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Dados'}
          </Button>
          <div className="pb-16" />
        </div>
      </div>

      {/* Success Dialog */}
      {showSuccessDialog && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50" onClick={() => { setShowSuccessDialog(false); onOpenChange(false); }} />
          <div className="fixed left-1/2 top-1/2 z-[60] -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-lg shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">Pixel criado com sucesso</h3>
                <span className="text-success">✅</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setShowSuccessDialog(false); onOpenChange(false); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Agora basta colocar o código abaixo na sua página de vendas:</p>
            <div className="space-y-2">
              <Label>Código do Pixel</Label>
              <div className="relative">
                <Input readOnly value={generatedCode} className="pr-10 font-mono text-xs" />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={copyCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button onClick={() => { setShowSuccessDialog(false); onOpenChange(false); }} className="w-full">
              Fechar
            </Button>
          </div>
        </>
      )}
    </TooltipProvider>
  );
}
