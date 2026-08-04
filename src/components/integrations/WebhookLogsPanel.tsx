import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, ChevronDown, ChevronRight, ScrollText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WebhookLog {
  id: string;
  platform: string | null;
  token_hint: string | null;
  status: string;
  http_status: number | null;
  message: string | null;
  sale_id: string | null;
  payload: unknown;
  headers: unknown;
  created_at: string;
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'processed':
      return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
    case 'error':
      return 'bg-destructive/15 text-destructive border-destructive/30';
    default:
      return 'bg-primary/15 text-primary border-primary/30';
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'processed':
      return 'Processado';
    case 'error':
      return 'Erro';
    case 'received':
      return 'Recebido';
    default:
      return status;
  }
};

export function WebhookLogsPanel() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (platformFilter !== 'all') {
        query = query.eq('platform', platformFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data || []) as unknown as WebhookLog[]);
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
      toast.error('Erro ao carregar logs de webhooks');
    } finally {
      setLoading(false);
    }
  }, [user, platformFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Realtime-ish refresh
  useEffect(() => {
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const platforms = Array.from(new Set(logs.map((l) => l.platform).filter(Boolean))) as string[];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="w-4 h-4" />
          Logs de Webhooks
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas plataformas</SelectItem>
              <SelectItem value="adsroi">adsroi</SelectItem>
              {platforms
                .filter((p) => p !== 'adsroi')
                .map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum evento recebido ainda. Envie um teste pela plataforma para ver o registro aqui.
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const isOpen = expanded === log.id;
              return (
                <div key={log.id} className="rounded-lg border border-border">
                  <button
                    onClick={() => setExpanded(isOpen ? null : log.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                    )}
                    <Badge variant="outline" className={statusVariant(log.status)}>
                      {statusLabel(log.status)}
                    </Badge>
                    <span className="text-sm font-medium">{log.platform || '—'}</span>
                    {log.http_status && (
                      <span className="text-xs text-muted-foreground">HTTP {log.http_status}</span>
                    )}
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {log.message || ''}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Token: </span>
                          <span className="font-mono">{log.token_hint || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Venda: </span>
                          <span className="font-mono">{log.sale_id || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Recebido em: </span>
                          <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1">Payload</p>
                        <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto max-h-72">
                          {JSON.stringify(log.payload ?? {}, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1">Headers</p>
                        <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto max-h-48">
                          {JSON.stringify(log.headers ?? {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
