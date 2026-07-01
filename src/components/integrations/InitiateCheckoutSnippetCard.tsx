import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, MousePointerClick } from 'lucide-react';
import { toast } from 'sonner';

export function InitiateCheckoutSnippetCard() {
  const [buttonText, setButtonText] = useState('SIM, EU QUERO COMPLETO');
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(() => {
    const safe = (buttonText || '').trim().replace(/'/g, "\\'").toUpperCase() || 'SIM, EU QUERO COMPLETO';
    return `<script>
(function () {
  var TARGET_TEXT = '${safe}';

  function fireIC(btn) {
    if (btn.dataset.icFired === '1') return;
    btn.dataset.icFired = '1';
    if (typeof fbq === 'function') {
      fbq('track', 'InitiateCheckout', {
        content_name: TARGET_TEXT,
        currency: 'BRL'
      });
      console.log('[Pixel] InitiateCheckout disparado:', TARGET_TEXT);
    } else {
      console.warn('[Pixel] fbq não encontrado nesta página');
    }
  }

  function matches(el) {
    if (!el || !el.textContent) return false;
    var txt = el.textContent.replace(/\\s+/g, ' ').trim().toUpperCase();
    return txt.indexOf(TARGET_TEXT) !== -1;
  }

  document.addEventListener('click', function (e) {
    var el = e.target;
    for (var i = 0; i < 5 && el; i++) {
      var tag = (el.tagName || '').toUpperCase();
      if ((tag === 'BUTTON' || tag === 'A' || el.getAttribute && el.getAttribute('role') === 'button') && matches(el)) {
        fireIC(el);
        return;
      }
      el = el.parentElement;
    }
  }, true);
})();
</script>`;
  }, [buttonText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success('Script copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MousePointerClick className="w-5 h-5" />
          Evento InitiateCheckout por clique em botão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Cole este script na sua <strong>página de vendas</strong> (antes do <code>&lt;/body&gt;</code>). Ele dispara o evento
          <strong> InitiateCheckout</strong> para o Facebook sempre que o cliente clicar em um botão cujo texto contenha a frase abaixo.
          O Pixel do Facebook já precisa estar instalado na página.
        </p>

        <div className="space-y-2">
          <Label htmlFor="ic-button-text">Texto do botão a monitorar</Label>
          <Input
            id="ic-button-text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="SIM, EU QUERO COMPLETO"
          />
          <p className="text-xs text-muted-foreground">
            A comparação ignora maiúsculas/minúsculas e espaços extras.
          </p>
        </div>

        <div className="relative">
          <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto max-h-80 whitespace-pre">
            <code>{snippet}</code>
          </pre>
        </div>

        <Button onClick={handleCopy} className="w-full gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado' : 'Copiar script'}
        </Button>
      </CardContent>
    </Card>
  );
}
