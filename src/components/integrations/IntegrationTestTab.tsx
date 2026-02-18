import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Check, ExternalLink, RefreshCw, TestTube, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TestResult {
  id: string;
  source: string;
  platform: string;
  link: string;
  use_pixel: boolean;
  status: 'success' | 'error' | 'pending';
  created_at: string;
}

export function IntegrationTestTab() {
  const { user } = useAuth();
  const [trafficSource, setTrafficSource] = useState('');
  const [platform, setPlatform] = useState('');
  const [usePixel, setUsePixel] = useState(false);
  const [testLink, setTestLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTests = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('integration_tests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setTestResults(data.map(t => ({
        id: t.id,
        source: t.source,
        platform: t.platform,
        link: t.link,
        use_pixel: t.use_pixel,
        status: t.status as TestResult['status'],
        created_at: t.created_at,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTests();
  }, [user]);

  const copyLink = () => {
    if (!testLink) {
      toast.error('Insira um link primeiro');
      return;
    }
    navigator.clipboard.writeText(testLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runTest = async () => {
    if (!testLink || !trafficSource || !platform) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    window.open(testLink, '_blank');

    const { data, error } = await supabase
      .from('integration_tests')
      .insert({
        user_id: user.id,
        source: trafficSource,
        platform,
        link: testLink,
        use_pixel: usePixel,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao salvar teste');
      return;
    }

    if (data) {
      setTestResults(prev => [{
        id: data.id,
        source: data.source,
        platform: data.platform,
        link: data.link,
        use_pixel: data.use_pixel,
        status: data.status as TestResult['status'],
        created_at: data.created_at,
      }, ...prev]);
    }

    toast.success('Teste iniciado! Siga o funil até o checkout.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Test Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Teste a integração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            É importante que o link que vai ser inserido para teste seja o mesmo que vai em sua campanha 
            (se tiver cloacker, use o link do cloacker), dessa forma conseguimos testar de forma mais eficiente.
          </p>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm">
              <span className="font-semibold text-foreground">Como testar:</span>{' '}
              <span className="text-muted-foreground">
                Siga o início do funil até o checkout e então gere um pagamento. 
                Se estiver tudo certo, você receberá um email confirmando e aparecerá aqui ao lado.
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fonte de Tráfego</Label>
              <Select value={trafficSource} onValueChange={setTrafficSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook Ads</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                  <SelectItem value="tiktok">TikTok Ads</SelectItem>
                  <SelectItem value="kwai">Kwai Ads</SelectItem>
                  <SelectItem value="organico">Orgânico</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotmart">Hotmart</SelectItem>
                  <SelectItem value="kiwify">Kiwify</SelectItem>
                  <SelectItem value="eduzz">Eduzz</SelectItem>
                  <SelectItem value="braip">Braip</SelectItem>
                  <SelectItem value="monetizze">Monetizze</SelectItem>
                  <SelectItem value="perfectpay">PerfectPay</SelectItem>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="usePixel"
              checked={usePixel}
              onCheckedChange={(checked) => setUsePixel(checked === true)}
            />
            <Label htmlFor="usePixel" className="text-sm cursor-pointer">
              Utiliza o Pixel?
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Link</Label>
            <Input
              value={testLink}
              onChange={(e) => setTestLink(e.target.value)}
              placeholder="Cole o link aqui..."
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={copyLink} className="gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            <Button onClick={runTest} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Testar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Últimos testes</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchTests}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <TestTube className="w-12 h-12 mb-4 opacity-30" />
              <p>Nenhum teste realizado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testResults.map((result) => (
                <div
                  key={result.id}
                  className="p-3 rounded-lg border border-border bg-muted/30 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground capitalize">
                      {result.source} → {result.platform}
                    </span>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      result.status === 'success' && 'bg-success/20 text-success',
                      result.status === 'error' && 'bg-destructive/20 text-destructive',
                      result.status === 'pending' && 'bg-warning/20 text-warning',
                    )}>
                      {result.status === 'success' ? 'Sucesso' : result.status === 'error' ? 'Erro' : 'Pendente'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(result.created_at).toLocaleString('pt-BR')}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{result.link}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
