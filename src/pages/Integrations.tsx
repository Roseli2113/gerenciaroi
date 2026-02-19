import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  XCircle,
  List,
  FileCode,
  Download,
  Play,
  Trash2
} from 'lucide-react';
import { useMetaAuth } from '@/hooks/useMetaAuth';
import { useWebhooks } from '@/hooks/useWebhooks';
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
import { ApiCredentialsCard } from '@/components/integrations/ApiCredentialsCard';
import { UtmCodesDialog } from '@/components/integrations/UtmCodesDialog';
import { UtmScriptsDialog } from '@/components/integrations/UtmScriptsDialog';
import { CreateWebhookDialog } from '@/components/integrations/CreateWebhookDialog';
import { AddPixelDrawer } from '@/components/integrations/AddPixelDrawer';
import { IntegrationTestTab } from '@/components/integrations/IntegrationTestTab';
import { LiveTrackingScriptCard } from '@/components/integrations/LiveTrackingScriptCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PixelRecord {
  id: string;
  name: string;
  pixel_type: string;
  purchase_product: string;
  status: string;
}

export default function Integrations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, isLoading, connection, connect, disconnect, refreshAdAccounts, toggleAccountActive } = useMetaAuth();
  const { webhooks, loading: webhooksLoading, createWebhook, deleteWebhook, toggleWebhookStatus } = useWebhooks();
  const [enabledAccounts, setEnabledAccounts] = useState<Record<string, boolean>>({});
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [metaExpanded, setMetaExpanded] = useState(true);
  
  // UTM Dialog states
  const [utmCodeDialogOpen, setUtmCodeDialogOpen] = useState(false);
  const [utmCodePlatform, setUtmCodePlatform] = useState<'facebook' | 'google' | 'kwai' | 'tiktok'>('facebook');
  const [utmScriptsDialogOpen, setUtmScriptsDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [pixelDrawerOpen, setPixelDrawerOpen] = useState(false);
  const [editingPixelId, setEditingPixelId] = useState<string | null>(null);
  const [pixels, setPixels] = useState<PixelRecord[]>([]);
  const [pixelsLoading, setPixelsLoading] = useState(false);

  const fetchPixels = useCallback(async () => {
    if (!user) return;
    setPixelsLoading(true);
    const { data, error } = await supabase
      .from('pixels')
      .select('id, name, pixel_type, purchase_product, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setPixels(data);
    setPixelsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPixels();
  }, [fetchPixels]);

  const togglePixelStatus = async (pixel: PixelRecord) => {
    const newStatus = pixel.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('pixels').update({ status: newStatus }).eq('id', pixel.id);
    if (error) { toast.error('Erro ao atualizar status'); return; }
    toast.success(newStatus === 'active' ? 'Pixel ativado' : 'Pixel desativado');
    fetchPixels();
  };

  const deletePixel = async (pixelId: string) => {
    const { error } = await supabase.from('pixels').delete().eq('id', pixelId);
    if (error) { toast.error('Erro ao deletar pixel'); return; }
    toast.success('Pixel deletado com sucesso');
    fetchPixels();
  };

  const openUtmCodeDialog = (platform: 'facebook' | 'google' | 'kwai' | 'tiktok') => {
    setUtmCodePlatform(platform);
    setUtmCodeDialogOpen(true);
  };

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
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <p className="font-bold text-foreground text-sm">Configuração COMPLETA!</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Deseja reiniciar a configuração?{' '}
              <button
                onClick={() => navigate('/onboarding')}
                className="text-primary underline hover:text-primary/80 font-medium transition-colors"
              >
                Clique aqui para reiniciar
              </button>
            </p>
          </div>
        )}

        {/* Meta Ads Connection Card - always visible at top */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Facebook className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">Meta Ads</span>
                  {isConnected ? (
                    <Badge className="bg-success/20 text-success border-0">Conectado</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">Não conectado</Badge>
                  )}
                </div>
                {isConnected && connection?.user ? (
                  <p className="text-sm text-muted-foreground truncate">
                    {connection.user.name}{connection.user.email ? ` • ${connection.user.email}` : ''}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Conecte sua conta Business Manager do Meta
                  </p>
                )}
              </div>
              <div className="shrink-0">
                {isConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnect}
                    disabled={isLoading}
                    className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    onClick={connect}
                    disabled={isLoading}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Facebook className="w-4 h-4" />
                    )}
                    Conectar Conta
                  </Button>
                )}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Webhooks</CardTitle>
                    <Radio className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Adicione webhooks para se conectar com as plataformas de venda:
                  </p>
                  
                  {/* Webhooks List */}
                  {webhooksLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : webhooks.length > 0 ? (
                    <div className="space-y-2">
                      {webhooks.map((webhook) => (
                        <div 
                          key={webhook.id} 
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{webhook.name}</p>
                              <Badge variant="outline" className="text-xs capitalize">
                                {webhook.platform}
                              </Badge>
                            </div>
                            <p className={`text-xs ${webhook.status === 'active' ? 'text-success' : 'text-muted-foreground'}`}>
                              Status: {webhook.status === 'active' ? 'Ativado' : 'Inativo'}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => toggleWebhookStatus(
                                  webhook.id, 
                                  webhook.status === 'active' ? 'inactive' : 'active'
                                )}
                              >
                                {webhook.status === 'active' ? 'Desativar' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteWebhook(webhook.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <Button className="gap-2" onClick={() => setWebhookDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Adicionar Webhook
                  </Button>
                </CardContent>
              </Card>

              <ApiCredentialsCard />
            </div>
          </TabsContent>

          {/* UTMs Tab */}
          <TabsContent value="utms" className="space-y-6">
            {/* Códigos Section */}
            <Card>
              <CardHeader>
                <CardTitle>Códigos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Facebook UTM */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Código de UTMs do Facebook</p>
                      <p className="text-sm text-muted-foreground">Copie o código para colocar nos anúncios do Facebook</p>
                    </div>
                  </div>
                  <Button onClick={() => openUtmCodeDialog('facebook')} className="gap-2">
                    <List className="w-4 h-4" />
                    Ver opções
                  </Button>
                </div>

                {/* Google UTM */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">G</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Código de UTMs do Google</p>
                      <p className="text-sm text-muted-foreground">Copie o código para colocar nos anúncios do Google</p>
                    </div>
                  </div>
                  <Button disabled className="gap-2 opacity-50 cursor-not-allowed">
                    Em Breve
                  </Button>
                </div>

                {/* Kwai UTM */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">K</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Código de UTMs do Kwai</p>
                      <p className="text-sm text-muted-foreground">Copie o código para colocar nos anúncios do Kwai</p>
                    </div>
                  </div>
                  <Button disabled className="gap-2 opacity-50 cursor-not-allowed">
                    Em Breve
                  </Button>
                </div>

                {/* TikTok UTM */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <span className="text-white text-lg font-bold">T</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Código de UTMs do TikTok</p>
                      <p className="text-sm text-muted-foreground">Copie o código para colocar nos anúncios do TikTok</p>
                    </div>
                  </div>
                  <Button disabled className="gap-2 opacity-50 cursor-not-allowed">
                    Em Breve
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Scripts Section */}
            <Card>
              <CardHeader>
                <CardTitle>Scripts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Script de UTMs */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <FileCode className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Script de UTMs</p>
                      <p className="text-sm text-muted-foreground">Use esse script nas suas PVs para capturar as UTMs</p>
                    </div>
                  </div>
                  <Button onClick={() => setUtmScriptsDialogOpen(true)} className="gap-2">
                    <List className="w-4 h-4" />
                    Ver opções
                  </Button>
                </div>

                {/* Script de Back Redirect */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Script de Back Redirect</p>
                      <p className="text-sm text-muted-foreground">Use esse script na sua PV para usar back redirect com UTMs</p>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Baixar
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* Live Tracking Script */}
            <LiveTrackingScriptCard />
          </TabsContent>

          {/* Pixel Tab */}
          <TabsContent value="pixel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pixels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Utilize Pixels para aumentar a inteligência das campanhas:</p>
                
                {pixelsLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

                {pixels.map((pixel) => (
                  <div key={pixel.id} className="border border-border rounded-lg p-4 flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{pixel.name}</p>
                      <p className="text-sm text-muted-foreground">ID: {pixel.id.replace(/-/g, '').slice(0, 24)}</p>
                      <p className="text-sm text-muted-foreground">Tipo: {pixel.pixel_type === 'meta' ? 'Meta' : pixel.pixel_type === 'google' ? 'Google' : 'TikTok'}</p>
                      <p className="text-sm text-muted-foreground">Produto: {pixel.purchase_product === 'any' ? 'Qualquer' : 'Específico'}</p>
                      <p className="text-sm text-muted-foreground">Status: {pixel.status === 'active' ? 'Ativado' : 'Desativado'}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => togglePixelStatus(pixel)}>
                          {pixel.status === 'active' ? 'Desativar Pixel' : 'Ativar Pixel'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEditingPixelId(pixel.id);
                          setPixelDrawerOpen(true);
                        }}>
                          Editar Dados
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deletePixel(pixel.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar Pixel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}

                <Button className="gap-2" onClick={() => { setEditingPixelId(null); setPixelDrawerOpen(true); }}>
                  Adicionar Pixel
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">WhatsApp Business</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    Em breve você poderá conectar seu WhatsApp Business para automações e notificações diretas.
                  </p>
                </div>
                <Badge className="bg-warning/20 text-warning border-warning/30 text-sm px-4 py-1">
                  Em Breve
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testes Tab */}
          <TabsContent value="testes" className="space-y-6">
            <IntegrationTestTab />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <UtmCodesDialog 
          open={utmCodeDialogOpen} 
          onOpenChange={setUtmCodeDialogOpen} 
          platform={utmCodePlatform} 
        />
        <UtmScriptsDialog 
          open={utmScriptsDialogOpen} 
          onOpenChange={setUtmScriptsDialogOpen} 
        />
        <CreateWebhookDialog
          open={webhookDialogOpen}
          onOpenChange={setWebhookDialogOpen}
          onCreateWebhook={createWebhook}
        />
        <AddPixelDrawer
          open={pixelDrawerOpen}
          onOpenChange={(open) => { setPixelDrawerOpen(open); if (!open) setEditingPixelId(null); }}
          onSaved={fetchPixels}
          editingPixelId={editingPixelId}
        />
      </div>
    </MainLayout>
  );
}
