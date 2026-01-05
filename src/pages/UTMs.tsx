import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link2, Copy, Check, TrendingUp, Eye, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const utmPerformance = [
  { source: 'facebook', medium: 'cpc', campaign: 'produto_premium', visits: 4520, conversions: 156, revenue: 12450, cpa: 8.50 },
  { source: 'instagram', medium: 'social', campaign: 'stories_janeiro', visits: 2340, conversions: 89, revenue: 7120, cpa: 9.20 },
  { source: 'facebook', medium: 'remarketing', campaign: 'carrinho_abandonado', visits: 1890, conversions: 124, revenue: 9920, cpa: 5.10 },
  { source: 'instagram', medium: 'influencer', campaign: 'parceria_jan', visits: 3450, conversions: 67, revenue: 5360, cpa: 12.30 },
];

const UTMs = () => {
  const [copied, setCopied] = useState(false);
  const [utmSource, setUtmSource] = useState('facebook');
  const [utmMedium, setUtmMedium] = useState('cpc');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://seusite.com/produto');

  const generatedUrl = `${baseUrl}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MainLayout title="UTMs e Rastreamento">
      <div className="space-y-6">
        {/* UTM Builder */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Gerador de UTMs</CardTitle>
                <CardDescription>
                  Crie URLs com parâmetros UTM para rastrear suas campanhas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">URL Base</Label>
                <Input
                  id="baseUrl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://seusite.com/produto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">utm_source</Label>
                <Input
                  id="source"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="facebook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medium">utm_medium</Label>
                <Input
                  id="medium"
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  placeholder="cpc"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign">utm_campaign</Label>
                <Input
                  id="campaign"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="produto_premium"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 flex items-center gap-4">
              <code className="flex-1 text-sm text-foreground break-all">
                {generatedUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="shrink-0 gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-success" />
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
          </CardContent>
        </Card>

        {/* UTM Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por UTM</CardTitle>
            <CardDescription>
              Acompanhe o desempenho das suas campanhas rastreadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Source</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Eye className="w-3 h-3" />
                      Visitas
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      Conversões
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utmPerformance.map((utm, index) => (
                  <TableRow key={index} className="border-border">
                    <TableCell className="font-medium">{utm.source}</TableCell>
                    <TableCell className="text-muted-foreground">{utm.medium}</TableCell>
                    <TableCell className="text-muted-foreground">{utm.campaign}</TableCell>
                    <TableCell className="text-right">
                      {utm.visits.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-medium text-success">
                      {utm.conversions}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {utm.revenue.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        'font-medium',
                        utm.cpa < 8 ? 'text-success' : utm.cpa > 10 ? 'text-warning' : 'text-foreground'
                      )}>
                        R$ {utm.cpa.toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default UTMs;
