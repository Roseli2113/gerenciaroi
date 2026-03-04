import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link2, Send, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UtmTestResult {
  step: string;
  status: 'success' | 'error' | 'pending' | 'warning';
  message: string;
}

export function UtmTestCard() {
  const { user } = useAuth();
  const [utmSource, setUtmSource] = useState('FB');
  const [utmCampaign, setUtmCampaign] = useState('TestCampaign|123456789012');
  const [utmMedium, setUtmMedium] = useState('TestAdSet|987654321098');
  const [utmContent, setUtmContent] = useState('TestAd|111222333444');
  const [utmTerm, setUtmTerm] = useState('feed');
  const [testPlatform, setTestPlatform] = useState('lowify');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<UtmTestResult[]>([]);
  const [copied, setCopied] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'zwylxoajyyjflvvcwpvz';

  const buildTestUrl = () => {
    const params = new URLSearchParams();
    if (utmSource) params.set('utm_source', utmSource);
    if (utmCampaign) params.set('utm_campaign', utmCampaign);
    if (utmMedium) params.set('utm_medium', utmMedium);
    if (utmContent) params.set('utm_content', utmContent);
    if (utmTerm) params.set('utm_term', utmTerm);
    return `https://suapagina.com/?${params.toString()}`;
  };

  const copyTestUrl = () => {
    navigator.clipboard.writeText(buildTestUrl());
    setCopied(true);
    toast.success('URL copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const runUtmTest = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    setTesting(true);
    setResults([]);

    const addResult = (result: UtmTestResult) => {
      setResults(prev => [...prev, result]);
    };

    try {
      // Step 1: Verify webhook exists
      addResult({ step: 'Webhook', status: 'pending', message: 'Verificando webhook configurado...' });

      const { data: webhooks, error: whError } = await supabase
        .from('webhooks')
        .select('id, token, platform, status')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (whError || !webhooks?.length) {
        setResults(prev => prev.map(r =>
          r.step === 'Webhook'
            ? { ...r, status: 'error' as const, message: 'Nenhum webhook ativo encontrado. Crie um na aba Webhooks primeiro.' }
            : r
        ));
        setTesting(false);
        return;
      }

      // Find a webhook matching the selected platform or use the first one
      const matchingWebhook = webhooks.find(w => w.platform === testPlatform) || webhooks[0];

      setResults(prev => prev.map(r =>
        r.step === 'Webhook'
          ? { ...r, status: 'success' as const, message: `Webhook encontrado: ${matchingWebhook.platform} (${matchingWebhook.id.slice(0, 8)}...)` }
          : r
      ));

      // Step 2: Send test webhook with UTMs
      addResult({ step: 'Envio', status: 'pending', message: 'Enviando webhook de teste com UTMs...' });

      const testPayload = {
        event: 'sale.paid',
        sale_id: `test_utm_${Date.now()}`,
        status: 'paid',
        sale_amount: 1.00,
        customer: {
          name: 'Teste UTM',
          email: `teste_utm_${Date.now()}@teste.com`,
        },
        product: {
          id: 'prod_test_utm',
          name: 'Produto Teste UTM',
          price: 1.00,
        },
        payment: {
          amount: 1.00,
          currency: 'BRL',
          method: 'pix',
        },
        tracking: {
          utm_source: utmSource,
          utm_campaign: utmCampaign,
          utm_medium: utmMedium,
          utm_content: utmContent,
          utm_term: utmTerm,
        },
      };

      const webhookUrl = `https://${projectId}.supabase.co/functions/v1/webhook-receiver?token=${matchingWebhook.token}&platform=${testPlatform}`;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        setResults(prev => prev.map(r =>
          r.step === 'Envio'
            ? { ...r, status: 'error' as const, message: `Erro no webhook: ${responseData.error || response.statusText}` }
            : r
        ));
        setTesting(false);
        return;
      }

      setResults(prev => prev.map(r =>
        r.step === 'Envio'
          ? { ...r, status: 'success' as const, message: `Webhook processado! Sale ID: ${responseData.sale_id?.slice(0, 8)}...` }
          : r
      ));

      // Step 3: Verify sale was saved with correct campaign_id
      addResult({ step: 'Atribuição', status: 'pending', message: 'Verificando atribuição de UTMs na venda...' });

      // Wait a moment for DB to process
      await new Promise(r => setTimeout(r, 1000));

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select('id, campaign_id, platform, raw_data, status')
        .eq('id', responseData.sale_id)
        .single();

      if (saleError || !sale) {
        setResults(prev => prev.map(r =>
          r.step === 'Atribuição'
            ? { ...r, status: 'error' as const, message: 'Venda não encontrada no banco de dados.' }
            : r
        ));
      } else {
        const expectedCampaignId = utmCampaign.includes('|') ? utmCampaign.split('|').pop()?.trim() : null;
        
        if (sale.campaign_id && expectedCampaignId && sale.campaign_id === expectedCampaignId) {
          setResults(prev => prev.map(r =>
            r.step === 'Atribuição'
              ? { ...r, status: 'success' as const, message: `✅ Campaign ID extraído corretamente: ${sale.campaign_id}` }
              : r
          ));
        } else if (sale.campaign_id) {
          setResults(prev => prev.map(r =>
            r.step === 'Atribuição'
              ? { ...r, status: 'warning' as const, message: `Campaign ID salvo: ${sale.campaign_id} (esperado: ${expectedCampaignId || 'N/A'})` }
              : r
          ));
        } else {
          setResults(prev => prev.map(r =>
            r.step === 'Atribuição'
              ? { ...r, status: 'error' as const, message: 'Campaign ID NÃO foi extraído. Os UTMs não estão sendo processados corretamente.' }
              : r
          ));
        }

        // Step 4: Verify UTMs in raw_data
        addResult({ step: 'Raw Data', status: 'pending', message: 'Verificando UTMs no raw_data...' });

        const rawData = sale.raw_data as Record<string, unknown> | null;
        const tracking = rawData?.tracking as Record<string, unknown> | undefined;

        if (tracking?.utm_campaign === utmCampaign && tracking?.utm_source === utmSource) {
          setResults(prev => prev.map(r =>
            r.step === 'Raw Data'
              ? { ...r, status: 'success' as const, message: `UTMs preservados no raw_data: utm_source=${tracking.utm_source}, utm_campaign=${tracking.utm_campaign}` }
              : r
          ));
        } else {
          setResults(prev => prev.map(r =>
            r.step === 'Raw Data'
              ? { ...r, status: 'warning' as const, message: `UTMs no raw_data podem ter sido sobrescritos. Verifique a plataforma de vendas.` }
              : r
          ));
        }
      }

      // Step 5: Clean up test sale
      addResult({ step: 'Limpeza', status: 'pending', message: 'Removendo venda de teste...' });

      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .eq('id', responseData.sale_id);

      setResults(prev => prev.map(r =>
        r.step === 'Limpeza'
          ? { ...r, status: deleteError ? 'warning' as const : 'success' as const, message: deleteError ? 'Não foi possível remover a venda de teste.' : 'Venda de teste removida com sucesso.' }
          : r
      ));

    } catch (err) {
      addResult({ step: 'Erro', status: 'error', message: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}` });
    }

    setTesting(false);
  };

  const getStatusIcon = (status: UtmTestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'error': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'pending': return <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Teste de UTMs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            Este teste simula um webhook de venda contendo parâmetros UTM para verificar se o sistema 
            extrai e atribui corretamente o <strong className="text-foreground">campaign_id</strong> do Meta Ads.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Plataforma do Webhook</Label>
            <Select value={testPlatform} onValueChange={setTestPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lowify">Lowify</SelectItem>
                <SelectItem value="adsroi">AdsRoi</SelectItem>
                <SelectItem value="hotmart">Hotmart</SelectItem>
                <SelectItem value="kiwify">Kiwify</SelectItem>
                <SelectItem value="logzz">Logzz</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>utm_source</Label>
            <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="FB" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>utm_campaign <span className="text-xs text-muted-foreground">(formato: Nome|ID)</span></Label>
            <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="NomeCampanha|123456789012" />
          </div>
          <div className="space-y-2">
            <Label>utm_medium <span className="text-xs text-muted-foreground">(AdSet)</span></Label>
            <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="NomeAdSet|987654321098" />
          </div>
          <div className="space-y-2">
            <Label>utm_content <span className="text-xs text-muted-foreground">(Ad)</span></Label>
            <Input value={utmContent} onChange={(e) => setUtmContent(e.target.value)} placeholder="NomeAd|111222333444" />
          </div>
          <div className="space-y-2">
            <Label>utm_term</Label>
            <Input value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} placeholder="feed" />
          </div>
        </div>

        {/* Test URL Preview */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">URL de exemplo com esses UTMs:</Label>
          <div className="flex gap-2">
            <Input readOnly value={buildTestUrl()} className="text-xs font-mono bg-muted/50" />
            <Button variant="outline" size="icon" onClick={copyTestUrl} className="shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <Button onClick={runUtmTest} disabled={testing} className="gap-2 w-full">
          {testing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {testing ? 'Testando...' : 'Enviar Webhook de Teste com UTMs'}
        </Button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2 mt-4">
            <Label className="text-sm font-semibold">Resultado do Teste:</Label>
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="mt-0.5">{getStatusIcon(result.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{result.step}</span>
                      <Badge
                        variant="secondary"
                        className={
                          result.status === 'success' ? 'bg-success/20 text-success' :
                          result.status === 'error' ? 'bg-destructive/20 text-destructive' :
                          result.status === 'warning' ? 'bg-warning/20 text-warning' :
                          'bg-muted text-muted-foreground'
                        }
                      >
                        {result.status === 'success' ? 'OK' : result.status === 'error' ? 'Falha' : result.status === 'warning' ? 'Aviso' : '...'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 break-all">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
