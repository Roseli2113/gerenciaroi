import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Facebook, Radio, Code, Zap, Key, ShoppingCart, XCircle, RefreshCw, User, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface UserPanelData {
  metaConnection: any | null;
  metaSyncStatus?: {
    state: 'not_connected' | 'cached' | 'live_synced' | 'permissions_error' | 'fetch_error';
    message?: string;
  };
  profile: any | null;
  adAccounts: any[];
  sales: any[];
  webhooks: any[];
  pixels: any[];
  pixelMetaIds: any[];
  rules: any[];
  credentials: any[];
}

interface AdminUserPanelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string | null;
  userName: string | null;
}

export function AdminUserPanelDialog({ open, onOpenChange, userId, userEmail, userName }: AdminUserPanelDialogProps) {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<UserPanelData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('admin-user-panel', {
        body: { targetUserId: userId },
      });
      if (error) throw error;
      if (!result || result.error) throw new Error(result?.error || 'Resposta vazia do servidor');
      setData(result);
    } catch (err: any) {
      console.error('Error fetching user panel:', err);
      toast.error(`Erro ao carregar painel: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResyncMeta = async () => {
    setSyncing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('admin-user-panel', {
        body: { targetUserId: userId, action: 'resync-meta' },
      });
      if (error) throw error;
      if (!result || result.error) throw new Error(result?.error || 'Erro ao ressincronizar');
      setData(result);
      if (result.metaSyncStatus?.state === 'live_synced') {
        toast.success(`Sincronizado! ${result.adAccounts.length} contas encontradas.`);
      } else if (result.metaSyncStatus?.state === 'permissions_error') {
        toast.error('Erro de permissão Meta. O usuário precisa reconectar a integração.');
      } else {
        toast.warning(result.metaSyncStatus?.message || 'Sincronização concluída com avisos.');
      }
    } catch (err: any) {
      console.error('Error resyncing Meta:', err);
      toast.error(`Erro ao ressincronizar: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (open && userId) {
      setData(null);
      fetchData();
    }
  }, [open, userId]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setData(null);
    onOpenChange(isOpen);
  };

  const InfoRow = ({ label, value, copyable }: { label: string; value: string | null | undefined; copyable?: boolean }) => (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-foreground font-medium">{value || '—'}</span>
        {copyable && value && (
          <button onClick={() => copyText(value, label)} className="text-muted-foreground hover:text-foreground transition-colors">
            {copiedField === label ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Painel Completo do Usuário</DialogTitle>
          <DialogDescription>
            {userName || 'Sem nome'} • {userEmail || 'Sem email'} • ID: {userId.slice(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : data ? (
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="bg-muted h-auto p-1 flex-wrap">
              <TabsTrigger value="profile" className="gap-1.5 text-xs">
                <User className="w-3.5 h-3.5" /> Perfil
              </TabsTrigger>
              <TabsTrigger value="meta" className="gap-1.5 text-xs">
                <Facebook className="w-3.5 h-3.5" /> Meta ({data.adAccounts.length})
              </TabsTrigger>
              <TabsTrigger value="sales" className="gap-1.5 text-xs">
                <ShoppingCart className="w-3.5 h-3.5" /> Vendas ({data.sales.length})
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="gap-1.5 text-xs">
                <Radio className="w-3.5 h-3.5" /> Webhooks ({data.webhooks.length})
              </TabsTrigger>
              <TabsTrigger value="pixels" className="gap-1.5 text-xs">
                <Code className="w-3.5 h-3.5" /> Pixels ({data.pixels.length})
              </TabsTrigger>
              <TabsTrigger value="rules" className="gap-1.5 text-xs">
                <Zap className="w-3.5 h-3.5" /> Regras ({data.rules.length})
              </TabsTrigger>
              <TabsTrigger value="credentials" className="gap-1.5 text-xs">
                <Key className="w-3.5 h-3.5" /> Credenciais ({data.credentials.length})
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-3">
              {data.profile ? (
                <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                  <InfoRow label="Nome" value={data.profile.display_name} />
                  <InfoRow label="Email" value={data.profile.email} copyable />
                  <InfoRow label="Celular" value={data.profile.phone} copyable />
                  <InfoRow label="Plano" value={data.profile.plan || 'free'} />
                  <InfoRow label="Status Plano" value={data.profile.plan_status} />
                  <InfoRow label="Bloqueado" value={data.profile.is_blocked ? 'Sim' : 'Não'} />
                  <InfoRow label="Som de Notificação" value={data.profile.notification_sound} />
                  <InfoRow label="Notif. Email" value={data.profile.notify_email ? 'Sim' : 'Não'} />
                  <InfoRow label="Notif. Push" value={data.profile.notify_push ? 'Sim' : 'Não'} />
                  <InfoRow label="Cadastro" value={new Date(data.profile.created_at).toLocaleDateString('pt-BR')} />
                  <InfoRow label="User ID" value={userId} copyable />
                </div>
              ) : (
                <p className="text-center py-6 text-muted-foreground">Perfil não encontrado</p>
              )}
            </TabsContent>

            {/* Meta Tab */}
            <TabsContent value="meta" className="space-y-4">
              {data.metaConnection ? (
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Facebook className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-foreground">{data.metaConnection.meta_user_name || 'Sem nome'}</span>
                        <Badge className="bg-success/20 text-success border-0">Conectado</Badge>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleResyncMeta} disabled={syncing}>
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Sincronizando...' : 'Ressincronizar'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email: {data.metaConnection.meta_user_email || '—'} • 
                      Expira: {new Date(data.metaConnection.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                    {data.metaSyncStatus && (
                      <Badge variant={
                        data.metaSyncStatus.state === 'live_synced' ? 'default' :
                        data.metaSyncStatus.state === 'permissions_error' ? 'destructive' : 'secondary'
                      } className={data.metaSyncStatus.state === 'live_synced' ? 'bg-success/20 text-success border-0 text-xs' : 'text-xs'}>
                        {data.metaSyncStatus.state === 'live_synced' ? '✓ Ao vivo' :
                         data.metaSyncStatus.state === 'cached' ? '📦 Cache' :
                         data.metaSyncStatus.state === 'permissions_error' ? '⚠ Sem permissão' :
                         data.metaSyncStatus.state === 'fetch_error' ? '⚠ Erro' : '—'}
                      </Badge>
                    )}
                  </div>
                  
                  {data.metaSyncStatus?.message && (
                    <Alert variant={data.metaSyncStatus.state === 'permissions_error' ? 'destructive' : 'default'}>
                      <AlertDescription>{data.metaSyncStatus.message}</AlertDescription>
                    </Alert>
                  )}

                  <p className="text-sm font-medium text-foreground">Contas de Anúncio ({data.adAccounts.length})</p>
                  {data.adAccounts.length > 0 ? (
                    <div className="space-y-2">
                      {data.adAccounts.map((acc: any) => (
                        <div key={acc.id || acc.account_id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
                          <div>
                            <span className="font-medium text-foreground">{acc.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{acc.account_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{acc.currency}</span>
                            {acc.is_active ? (
                              <Badge className="bg-success/20 text-success border-0 text-xs">Ativa</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Inativa</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{data.metaSyncStatus?.message || 'Nenhuma conta de anúncio'}</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <XCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Meta Ads não conectado</p>
                </div>
              )}
            </TabsContent>

            {/* Sales Tab */}
            <TabsContent value="sales" className="space-y-2">
              {data.sales.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {data.sales.map((sale: any) => (
                    <div key={sale.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
                      <div>
                        <span className="font-medium text-foreground">{sale.product_name || sale.platform}</span>
                        <p className="text-xs text-muted-foreground">
                          {sale.customer_name || sale.customer_email || '—'} • {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-foreground">R$ {Number(sale.amount).toFixed(2).replace('.', ',')}</span>
                        <p className="text-xs">
                          <Badge variant={sale.status === 'approved' ? 'default' : 'secondary'} className={sale.status === 'approved' ? 'bg-success/20 text-success border-0' : ''}>
                            {sale.status}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-muted-foreground">Nenhuma venda registrada</p>
              )}
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks" className="space-y-2">
              {data.webhooks.length > 0 ? (
                <div className="space-y-3">
                  {data.webhooks.map((wh: any) => (
                    <div key={wh.id} className="p-3 bg-muted/30 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm">{wh.name}</span>
                          <Badge variant="secondary" className="text-xs">{wh.platform}</Badge>
                        </div>
                        <Badge variant={wh.status === 'active' ? 'default' : 'secondary'} className={wh.status === 'active' ? 'bg-success/20 text-success border-0' : ''}>
                          {wh.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {wh.webhook_url && (
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs bg-muted p-1.5 rounded break-all text-muted-foreground flex-1">{wh.webhook_url}</code>
                          <button onClick={() => copyText(wh.webhook_url, 'Webhook URL')} className="text-muted-foreground hover:text-foreground shrink-0">
                            {copiedField === 'Webhook URL' ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                      {wh.token && (
                        <p className="text-xs text-muted-foreground">Token: {wh.token.slice(0, 12)}...</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-muted-foreground">Nenhum webhook configurado</p>
              )}
            </TabsContent>

            {/* Pixels Tab */}
            <TabsContent value="pixels" className="space-y-3">
              {data.pixels.length > 0 ? (
                <div className="space-y-3">
                  {data.pixels.map((px: any) => {
                    const metaIds = (data.pixelMetaIds || []).filter((m: any) => m.pixel_id === px.id);
                    return (
                      <div key={px.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground text-sm">{px.name}</span>
                            <Badge variant="secondary" className="text-xs">{px.pixel_type}</Badge>
                          </div>
                          <Badge variant={px.status === 'active' ? 'default' : 'secondary'} className={px.status === 'active' ? 'bg-success/20 text-success border-0' : ''}>
                            {px.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          <span>Compra: {px.purchase_send_config}</span>
                          <span>Valor: {px.purchase_value_type}</span>
                          <span>Checkout: {px.initiate_checkout_rule}</span>
                          <span>Detecção: {px.checkout_detection_rule}</span>
                          <span>Lead: {px.lead_rule}</span>
                          <span>Carrinho: {px.add_to_cart_rule}</span>
                          <span>IP: {px.ip_config}</span>
                        </div>
                        {metaIds.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-border">
                            <p className="text-xs font-medium text-foreground">Pixel IDs Meta ({metaIds.length})</p>
                            {metaIds.map((m: any) => (
                              <div key={m.id} className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">{m.apelido || '—'}</span>
                                <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{m.meta_pixel_id}</code>
                                <button onClick={() => copyText(m.meta_pixel_id, 'Pixel ID')} className="text-muted-foreground hover:text-foreground">
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-6 text-muted-foreground">Nenhum pixel configurado</p>
              )}
            </TabsContent>

            {/* Rules Tab */}
            <TabsContent value="rules" className="space-y-2">
              {data.rules.length > 0 ? (
                <div className="space-y-2">
                  {data.rules.map((rule: any) => (
                    <div key={rule.id} className="p-3 bg-muted/30 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground text-sm">{rule.name}</span>
                        {rule.is_active ? (
                          <Badge className="bg-success/20 text-success border-0">Ativa</Badge>
                        ) : (
                          <Badge variant="secondary">Inativa</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        <span>Condição: {rule.condition_type} ({rule.condition_value})</span>
                        <span>Ação: {rule.action_type}</span>
                        <span>Frequência: {rule.frequency}</span>
                        <span>Aplicado a: {rule.applied_to}</span>
                        <span>Execuções: {rule.executions}</span>
                        <span>Última: {rule.last_execution ? new Date(rule.last_execution).toLocaleDateString('pt-BR') : '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-muted-foreground">Nenhuma regra configurada</p>
              )}
            </TabsContent>

            {/* Credentials Tab */}
            <TabsContent value="credentials" className="space-y-2">
              {data.credentials.length > 0 ? (
                <div className="space-y-2">
                  {data.credentials.map((cred: any) => (
                    <div key={cred.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
                      <div>
                        <span className="font-medium text-foreground">{cred.name}</span>
                        <p className="text-xs text-muted-foreground">Criada: {new Date(cred.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <Badge variant={cred.status === 'active' ? 'default' : 'secondary'} className={cred.status === 'active' ? 'bg-success/20 text-success border-0' : ''}>
                        {cred.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-muted-foreground">Nenhuma credencial</p>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
