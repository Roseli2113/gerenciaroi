import { useState, useEffect } from 'react';
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
  ChevronUp,
  MoreVertical,
  Plus,
  Loader2,
  LogOut,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useMetaAuth } from '@/hooks/useMetaAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function Integrations() {
  const { isConnected, isLoading, connection, connect, disconnect, refreshAdAccounts, toggleAccountActive } = useMetaAuth();
  const [enabledAccounts, setEnabledAccounts] = useState<Record<string, boolean>>({});
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [metaExpanded, setMetaExpanded] = useState(true);

  // Load initial enabled states from connection
  useEffect(() => {
    if (connection?.adAccounts) {
      const initialState: Record<string, boolean> = {};
      connection.adAccounts.forEach(acc => {
        initialState[acc.id] = acc.is_active || false;
      });
      setEnabledAccounts(initialState);
    }
  }, [connection?.adAccounts]);

  const toggleAccount = async (accountId: string) => {
    const newValue = !enabledAccounts[accountId];
    
    setTogglingIds(prev => new Set(prev).add(accountId));
    
    const success = await toggleAccountActive(accountId, newValue);
    
    if (success) {
      // If activating, deactivate all others locally
      if (newValue) {
        const newState: Record<string, boolean> = {};
        Object.keys(enabledAccounts).forEach(id => {
          newState[id] = id === accountId;
        });
        setEnabledAccounts(newState);
      } else {
        setEnabledAccounts(prev => ({ ...prev, [accountId]: false }));
      }
    }
    
    setTogglingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(accountId);
      return newSet;
    });
  };

  const getAccountStatusLabel = (status: number) => {
    switch (status) {
      case 1: return { label: 'Ativa', color: 'text-success' };
      case 2: return { label: 'Desativada', color: 'text-destructive' };
      case 3: return { label: 'Não suportada', color: 'text-muted-foreground' };
      case 7: return { label: 'Pendente de revisão', color: 'text-warning' };
      case 8: return { label: 'Pendente de fechamento', color: 'text-warning' };
      case 9: return { label: 'Em período de graça', color: 'text-warning' };
      case 100: return { label: 'Temporariamente indisponível', color: 'text-warning' };
      case 101: return { label: 'Permanentemente indisponível', color: 'text-destructive' };
      default: return { label: 'Desconhecido', color: 'text-muted-foreground' };
    }
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
        {isConnected && (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-semibold text-foreground">Configuração COMPLETA!</p>
                    <p className="text-sm text-muted-foreground">
                      Conectado como <span className="text-foreground font-medium">{connection?.user.name}</span>
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={disconnect}
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Desconectar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
            <Collapsible open={metaExpanded} onOpenChange={setMetaExpanded}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <Facebook className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">Meta Ads</CardTitle>
                          {isConnected ? (
                            <Badge className="bg-success/20 text-success border-0">
                              Conectado
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">
                              Desconectado
                            </Badge>
                          )}
                        </div>
                      </div>
                      {metaExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    {!isConnected ? (
                      /* Not Connected State */
                      <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-blue-600/10 flex items-center justify-center">
                          <Facebook className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            Conecte sua conta Meta Ads
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                            Ao conectar sua conta, você poderá visualizar e gerenciar suas campanhas, 
                            criar regras automáticas e acompanhar métricas em tempo real.
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Button 
                            onClick={connect} 
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 gap-2"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Facebook className="w-4 h-4" />
                            )}
                            Conectar com Facebook
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Permissões necessárias: ads_read, ads_management
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Connected State */
                      <>
                        {/* Connected Profiles */}
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">Perfil conectado:</p>
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {connection?.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span className="text-foreground font-medium">{connection?.user.name}</span>
                                {connection?.user.email && (
                                  <p className="text-xs text-muted-foreground">{connection.user.email}</p>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-5 h-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={refreshAdAccounts}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Atualizar contas
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={disconnect}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <LogOut className="w-4 h-4 mr-2" />
                                  Desconectar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Ad Accounts */}
                        {connection?.adAccounts && connection.adAccounts.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">
                                Contas de Anúncio ({connection.adAccounts.length})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Ative uma conta para gerenciar campanhas
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              {connection.adAccounts.map((account) => {
                                const status = getAccountStatusLabel(account.account_status);
                                const isToggling = togglingIds.has(account.id);
                                return (
                                  <div 
                                    key={account.id} 
                                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-foreground">{account.name}</p>
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className={status.color}>{status.label}</span>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-muted-foreground">{account.currency}</span>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-muted-foreground">{account.timezone_name}</span>
                                      </div>
                                    </div>
                                    {isToggling ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Switch 
                                        checked={enabledAccounts[account.id] || false} 
                                        onCheckedChange={() => toggleAccount(account.id)} 
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {connection?.adAccounts && connection.adAccounts.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            <XCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhuma conta de anúncio encontrada.</p>
                            <p className="text-sm">Verifique se você tem acesso a contas de anúncio no Meta Business.</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Google Ads Card (placeholder) */}
            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">G</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">Google Ads</CardTitle>
                    <Badge variant="secondary">Em breve</Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* TikTok Ads Card (placeholder) */}
            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <span className="text-white text-lg font-bold">T</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">TikTok Ads</CardTitle>
                    <Badge variant="secondary">Em breve</Badge>
                  </div>
                </div>
              </CardHeader>
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
                <CardTitle>WhatsApp Business</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conecte seu WhatsApp Business para automações e notificações.</p>
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
                <CardTitle>Ambiente de Testes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Teste suas integrações antes de ir para produção.</p>
                <Button className="mt-4 gap-2">
                  <TestTube className="w-4 h-4" />
                  Iniciar Teste
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
