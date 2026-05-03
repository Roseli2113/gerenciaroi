import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Send, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CapiEvent {
  id: string;
  sale_id: string | null;
  meta_pixel_id: string;
  event_name: string;
  status: string;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
  event_payload: Record<string, unknown>;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pending: { label: 'Pendente', variant: 'secondary', icon: Clock },
  processing: { label: 'Processando', variant: 'outline', icon: Loader2 },
  sent: { label: 'Enviado', variant: 'default', icon: CheckCircle2 },
  failed: { label: 'Falhou', variant: 'destructive', icon: XCircle },
};

export function CapiEventsMonitor() {
  const [events, setEvents] = useState<CapiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('capi_event_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      toast.error('Erro ao carregar eventos');
    } else {
      setEvents((data ?? []) as CapiEvent[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRetry = async (id: string) => {
    setRetrying(id);
    const { error } = await supabase
      .from('capi_event_queue')
      .update({
        status: 'pending',
        attempts: 0,
        next_attempt_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao reenfileirar');
      setRetrying(null);
      return;
    }
    // Dispara o worker
    await supabase.functions.invoke('capi-queue-worker');
    toast.success('Reenviado para a fila', {
      style: { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' },
    });
    setRetrying(null);
    await load();
  };

  const handleProcessNow = async () => {
    setProcessing(true);
    const { data, error } = await supabase.functions.invoke('capi-queue-worker');
    if (error) {
      toast.error('Erro ao processar fila');
    } else {
      const result = data as { processed?: number; succeeded?: number; failed?: number };
      toast.success(`Processados: ${result.processed ?? 0} • OK: ${result.succeeded ?? 0} • Falhou: ${result.failed ?? 0}`, {
        style: { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' },
      });
    }
    setProcessing(false);
    await load();
  };

  const stats = {
    pending: events.filter(e => e.status === 'pending').length,
    processing: events.filter(e => e.status === 'processing').length,
    sent: events.filter(e => e.status === 'sent').length,
    failed: events.filter(e => e.status === 'failed').length,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Fila de Eventos - Conversions API
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Eventos enviados ao Facebook (Purchase / InitiateCheckout) com retentativas automáticas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={handleProcessNow} disabled={processing}>
            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Processar agora
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">Pendentes</div>
            <div className="text-2xl font-semibold">{stats.pending}</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">Processando</div>
            <div className="text-2xl font-semibold">{stats.processing}</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">Enviados</div>
            <div className="text-2xl font-semibold text-green-600">{stats.sent}</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">Falhados</div>
            <div className="text-2xl font-semibold text-destructive">{stats.failed}</div>
          </div>
        </div>

        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhum evento na fila ainda.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-2 font-medium">Evento</th>
                  <th className="p-2 font-medium">Pixel</th>
                  <th className="p-2 font-medium">Status</th>
                  <th className="p-2 font-medium">Tentativas</th>
                  <th className="p-2 font-medium">Próxima</th>
                  <th className="p-2 font-medium">Erro</th>
                  <th className="p-2 font-medium">Criado</th>
                  <th className="p-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => {
                  const cfg = STATUS_CONFIG[evt.status] ?? STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <tr key={evt.id} className="border-t border-border">
                      <td className="p-2 font-medium">{evt.event_name}</td>
                      <td className="p-2 text-muted-foreground font-mono text-xs">{evt.meta_pixel_id}</td>
                      <td className="p-2">
                        <Badge variant={cfg.variant} className="gap-1">
                          <Icon className={`h-3 w-3 ${evt.status === 'processing' ? 'animate-spin' : ''}`} />
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="p-2">{evt.attempts}/{evt.max_attempts}</td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {evt.status === 'sent'
                          ? '—'
                          : format(new Date(evt.next_attempt_at), "dd/MM HH:mm", { locale: ptBR })}
                      </td>
                      <td className="p-2 text-xs text-destructive max-w-[220px] truncate" title={evt.last_error ?? ''}>
                        {evt.last_error ?? '—'}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {format(new Date(evt.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </td>
                      <td className="p-2">
                        {evt.status !== 'sent' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(evt.id)}
                            disabled={retrying === evt.id}
                          >
                            {retrying === evt.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Reenviar
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
