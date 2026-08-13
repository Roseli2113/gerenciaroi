import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Link2 } from 'lucide-react';
import { toast } from 'sonner';

const SCRIPT = `<!-- GerênciaROI - Ponte de UTMs (instale na PÁGINA DE VENDAS, antes de </body>) -->
<script>
(function () {
  var KEYS = ['utm_source','utm_campaign','utm_medium','utm_content','utm_term','fbclid','gclid','ttclid','xcod','sck','src','aff'];
  var STORE = 'gr_utms';

  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return {}; }
  }

  function saveStore(obj) {
    try { localStorage.setItem(STORE, JSON.stringify(obj)); } catch (e) {}
    try {
      document.cookie = STORE + '=' + encodeURIComponent(JSON.stringify(obj)) +
        ';path=/;max-age=' + (60 * 60 * 24 * 30);
    } catch (e) {}
  }

  // 1) Captura os parâmetros da URL atual (o que veio do anúncio)
  var params = new URLSearchParams(window.location.search);
  var data = readStore();
  KEYS.forEach(function (k) {
    var v = params.get(k);
    if (v) data[k] = v;
  });
  if (Object.keys(data).length) saveStore(data);

  // 2) Aplica os parâmetros em qualquer link (checkout, pagamento, etc.)
  function decorate(url) {
    try {
      var u = new URL(url, window.location.href);
      if (!/^https?:$/.test(u.protocol)) return url;
      var store = readStore();
      Object.keys(store).forEach(function (k) {
        var current = u.searchParams.get(k);
        // não sobrescreve valores reais já presentes, mas corrige placeholders
        if (!current || /^\\[.*\\]$/.test(current) || current === 'undefined') {
          u.searchParams.set(k, store[k]);
        }
      });
      return u.toString();
    } catch (e) {
      return url;
    }
  }

  function decorateAll() {
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (href.indexOf('#') === 0 || href.indexOf('javascript:') === 0) continue;
      if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 || href.indexOf('wa.me') > -1) continue;
      links[i].setAttribute('href', decorate(href));
    }
  }

  // 3) Executa no carregamento e observa novos botões/links dinâmicos
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorateAll);
  } else {
    decorateAll();
  }
  try {
    new MutationObserver(decorateAll).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}

  // 4) Garante o repasse também em cliques com redirecionamento via JS
  document.addEventListener('click', function (ev) {
    var el = ev.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (el && el.getAttribute('href')) el.setAttribute('href', decorate(el.getAttribute('href')));
  }, true);
})();
</script>`;

export function UtmBridgeScriptCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SCRIPT);
    setCopied(true);
    toast.success('Script copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="w-4 h-4" />
          Ponte de UTMs (página de vendas → checkout)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-primary/10 text-sm space-y-2">
          <p>
            Use quando o anúncio leva para uma <strong>página de vendas externa</strong> (ex.: zpixpay) e o
            botão de compra abre o checkout (ex.: AdsRoi) <strong>sem repassar as UTMs</strong>. Nesse caso só
            chega o <code>fbclid</code> e a venda fica sem campanha/conjunto/anúncio.
          </p>
          <ul className="list-disc list-inside text-xs space-y-1">
            <li>Salva as UTMs recebidas do anúncio (localStorage + cookie, 30 dias)</li>
            <li>Adiciona as UTMs em todos os links de checkout da página, inclusive os criados dinamicamente</li>
            <li>Substitui placeholders como <code>aff=[ID_AFILIADO]</code> quando o valor real está na URL</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Importante: o link do anúncio precisa manter o padrão
            <code className="break-all"> utm_source=FB&amp;utm_campaign=&#123;&#123;campaign.name&#125;&#125;|&#123;&#123;campaign.id&#125;&#125;&amp;utm_medium=&#123;&#123;adset.name&#125;&#125;|&#123;&#123;adset.id&#125;&#125;&amp;utm_content=&#123;&#123;ad.name&#125;&#125;|&#123;&#123;ad.id&#125;&#125;&amp;utm_term=&#123;&#123;placement&#125;&#125;</code>
          </p>
        </div>

        <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto max-h-72">{SCRIPT}</pre>

        <Button onClick={handleCopy} variant="outline" className="gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado' : 'Copiar script'}
        </Button>
      </CardContent>
    </Card>
  );
}
