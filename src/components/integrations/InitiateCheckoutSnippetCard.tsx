import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Copy, Check, MousePointerClick } from 'lucide-react';
import { toast } from 'sonner';

export function InitiateCheckoutSnippetCard() {
  const [buttonTexts, setButtonTexts] = useState(
    'SIM, EU QUERO COMPLETO\nYES, I WANT FULL ACCESS\nCOMPRAR AGORA'
  );
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(() => {
    const list = (buttonTexts || '')
      .split(/\r?\n|,/)
      .map((s) => s.trim().replace(/'/g, "\\'").toUpperCase())
      .filter(Boolean);
    const arr = list.length ? list : ['SIM, EU QUERO COMPLETO'];
    const arrStr = '[' + arr.map((s) => `'${s}'`).join(', ') + ']';

    return `<script>
(function () {
  var TARGET_TEXTS = ${arrStr};

  function findMatch(el) {
    if (!el || !el.textContent) return null;
    var txt = el.textContent.replace(/\\s+/g, ' ').trim().toUpperCase();
    for (var i = 0; i < TARGET_TEXTS.length; i++) {
      if (txt.indexOf(TARGET_TEXTS[i]) !== -1) return TARGET_TEXTS[i];
    }
    return null;
  }

  function fireIC(btn, matched) {
    if (btn.dataset.icFired === '1') return;
    btn.dataset.icFired = '1';
    if (typeof fbq === 'function') {
      fbq('track', 'InitiateCheckout', {
        content_name: matched,
        currency: 'BRL'
      });
      console.log('[Pixel] InitiateCheckout disparado:', matched);
    } else {
      console.warn('[Pixel] fbq não encontrado nesta página');
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target;
    for (var i = 0; i < 5 && el; i++) {
      var tag = (el.tagName || '').toUpperCase();
      if (tag === 'BUTTON' || tag === 'A' || (el.getAttribute && el.getAttribute('role') === 'button')) {
        var matched = findMatch(el);
        if (matched) {
          fireIC(el, matched);
          return;
        }
      }
      el = el.parentElement;
    }
  }, true);
})();
</script>`;
  }, [buttonTexts]);

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
          <strong> InitiateCheckout</strong> sempre que o cliente clicar em um botão cujo texto contenha uma das frases abaixo.
          O Pixel do Facebook já precisa estar instalado na página.
        </p>

        <div className="space-y-2">
          <Label htmlFor="ic-button-texts">Textos dos botões a monitorar (um por linha ou separados por vírgula)</Label>
          <Textarea
            id="ic-button-texts"
            value={buttonTexts}
            onChange={(e) => setButtonTexts(e.target.value)}
            placeholder={'SIM, EU QUERO COMPLETO\nYES, I WANT FULL ACCESS\nCOMPRAR AGORA'}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            A comparação ignora maiúsculas/minúsculas e espaços extras. Adicione quantas frases quiser — o script dispara o evento sempre que qualquer uma delas for encontrada no botão clicado.
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
