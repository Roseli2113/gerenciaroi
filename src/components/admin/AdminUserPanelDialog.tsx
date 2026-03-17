import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Facebook, Radio, Code, Zap, Key, ShoppingCart, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface UserPanelData {
  metaConnection: any | null;
  adAccounts: any[];
  sales: any[];
  webhooks: any[];
  pixels: any[];
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
  const [data, setData] = useState<UserPanelData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('admin-user-panel', {
        body: { targetUserId: userId },
      });

      if (error) throw error;
      if (!result || result.error) {
        throw new Error(result?.error || 'Resposta vazia do servidor');
      }

      setData(result);
    } catch (err: any) {
      console.error('Error fetching user panel:', err);
      toast.error(`Erro ao carregar painel: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Painel do Usuário</DialogTitle>
          <DialogDescription>
            {userName || 'Sem nome'} • {userEmail || 'Sem email'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : data ? (
          <Tabs defaultValue="meta" className="space-y-4">
            <TabsList className="bg-muted h-auto p-1 flex-wrap">
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

            {/* Meta Tab */}
            <TabsContent value="meta" className="space-y-4">
              {data.metaConnection ? (
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <Facebook className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-foreground">{data.metaConnection.meta_user_name || 'Sem nome'}</span>
                      <Badge className="bg-success/20 text-success border-0">Conectado</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email: {data.metaConnection.meta_user_email || '—'} • 
                      Expira: {new Date(data.metaConnection.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <p className="text-sm font-medium text-foreground">Contas de Anúncio ({data.adAccounts.length})</p>
                  {data.adAccounts.length > 0 ? (
                    <div className="space-y-2">
                      {data.adAccounts.map((acc: any) => (
                        <div key={acc.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
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
                    <p className="text-sm text-muted-foreground">Nenhuma conta de anúncio</p>
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
                <div className="space-y-2">
                  {data.webhooks.map((wh: any) => (
                    <div key={wh.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
                      <div>
                        <span className="font-medium text-foreground">{wh.name}</span>
                        <p className="text-xs text-muted-foreground">{wh.platform}</p>
                      </div>
                      <Badge variant={wh.status === 'active' ? 'default' : 'secondary'} className={wh.status === 'active' ? 'bg-success/20 text-success border-0' : ''}>
                        {wh.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-muted-foreground">Nenhum webhook configurado</p>
              )}
            </TabsContent>

            {/* Pixels Tab */}
            <TabsContent value="pixels" className="space-y-2">
              {data.pixels.length > 0 ? (
                <div className="space-y-2">
                  {data.pixels.map((px: any) => (
                    <div key={px.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
                      <div>
                        <span className="font-medium text-foreground">{px.name}</span>
                        <p className="text-xs text-muted-foreground">{px.pixel_type}</p>
                      </div>
                      <Badge variant={px.status === 'active' ? 'default' : 'secondary'} className={px.status === 'active' ? 'bg-success/20 text-success border-0' : ''}>
                        {px.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  ))}
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
                    <div key={rule.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
                      <div>
                        <span className="font-medium text-foreground">{rule.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {rule.condition_type} → {rule.action_type} • {rule.executions} execuções
                        </p>
                      </div>
                      {rule.is_active ? (
                        <Badge className="bg-success/20 text-success border-0">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
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
