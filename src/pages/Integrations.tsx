import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Megaphone, 
  Radio, 
  Link2, 
  Code, 
  MessageCircle, 
  TestTube,
  Facebook,
  ChevronDown,
  MoreVertical,
  Plus
} from 'lucide-react';

const mockProfiles = [
  { id: 1, name: 'Roseli Oliveira' },
];

const mockAdAccounts = [
  { id: 1, name: 'AGUA LIFE', status: 'Desabilitada', enabled: false },
  { id: 2, name: 'BM - 02 ROSELI', status: 'Ativa', enabled: true },
];

export default function Integrations() {
  const [adAccounts, setAdAccounts] = useState(mockAdAccounts);
  const [allEnabled, setAllEnabled] = useState(false);

  const toggleAllAccounts = (enabled: boolean) => {
    setAllEnabled(enabled);
    setAdAccounts(adAccounts.map(acc => ({ ...acc, enabled })));
  };

  const toggleAccount = (id: number) => {
    setAdAccounts(adAccounts.map(acc => 
      acc.id === id ? { ...acc, enabled: !acc.enabled } : acc
    ));
  };

  return (
    <MainLayout title="Integrações">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
          <p className="text-muted-foreground">Gerencie suas conexões e integrações</p>
        </div>

        {/* Configuration Banner */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Configuração COMPLETA!</p>
                <p className="text-sm text-muted-foreground">
                  Deseja reiniciar a configuração?{' '}
                  <button className="text-primary underline hover:no-underline">
                    Clique aqui para reiniciar
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="anuncios" className="space-y-6">
          <TabsList className="bg-card border border-border h-auto p-1 flex-wrap">
            <TabsTrigger value="anuncios" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Megaphone className="w-4 h-4" />
              Anúncios
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Radio className="w-4 h-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="utms" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Link2 className="w-4 h-4" />
              UTMs
            </TabsTrigger>
            <TabsTrigger value="pixel" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Code className="w-4 h-4" />
              Pixel
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="testes" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TestTube className="w-4 h-4" />
              Testes
            </TabsTrigger>
          </TabsList>

          {/* Anúncios Tab */}
          <TabsContent value="anuncios" className="space-y-6">
            {/* Meta Ads Card */}
            <Card>
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <Facebook className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">Meta Ads</CardTitle>
                  </div>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Connected Profiles */}
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Conecte seus perfis por aqui:</p>
                  {mockProfiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-foreground">{profile.name}</span>
                      <button className="text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar perfil
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ad Accounts Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Contas de Anúncio (Meta)</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Ativar todas:</span>
                    <Switch checked={allEnabled} onCheckedChange={toggleAllAccounts} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Escolha suas contas de anúncio:</p>
                {adAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-foreground">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        status: <span className={account.status === 'Ativa' ? 'text-green-500' : 'text-muted-foreground'}>{account.status}</span>
                      </p>
                    </div>
                    <Switch checked={account.enabled} onCheckedChange={() => toggleAccount(account.id)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Webhooks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Configure seus webhooks para receber notificações em tempo real sobre eventos das suas campanhas.</p>
                <Button className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Webhook
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* UTMs Tab */}
          <TabsContent value="utms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de UTMs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Configure seus parâmetros UTM padrão para rastreamento de campanhas.</p>
                <Button className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Template UTM
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pixel Tab */}
          <TabsContent value="pixel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pixel de Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Gerencie seus pixels de conversão para rastrear ações dos usuários.</p>
                <Button className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Pixel
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integração WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conecte seu WhatsApp Business para receber notificações e interagir com leads.</p>
                <Button className="mt-4 gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Conectar WhatsApp
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testes Tab */}
          <TabsContent value="testes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Testes de Integração</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Execute testes para verificar se suas integrações estão funcionando corretamente.</p>
                <Button className="mt-4 gap-2">
                  <TestTube className="w-4 h-4" />
                  Executar Testes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
