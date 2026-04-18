import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Wallet, Plus, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts';
import { cn } from '@/lib/utils';

export function BudgetAlertCard() {
  const { alerts, loading, createAlert, updateAlert, deleteAlert } = useBudgetAlerts();
  const [budget, setBudget] = useState('');
  const [threshold, setThreshold] = useState('90');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    const b = Number(budget);
    const t = Number(threshold);
    if (!b || b <= 0) return;
    if (!t || t < 1 || t > 100) return;
    setSubmitting(true);
    const ok = await createAlert(b, t, name.trim() || undefined);
    setSubmitting(false);
    if (ok) {
      setBudget('');
      setThreshold('90');
      setName('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Alerta de Saldo de Anúncios
        </CardTitle>
        <CardDescription>
          Defina um valor de orçamento. Quando o gasto se aproximar, você receberá uma notificação.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create form */}
        <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
          <div className="space-y-1.5">
            <Label className="text-xs">Apelido (opcional)</Label>
            <Input
              placeholder="Ex: Conta Principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Valor (R$)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder="100.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Avisar em (%)</Label>
              <Input
                type="number"
                min="1"
                max="100"
                placeholder="90"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="w-full gap-2"
            onClick={handleCreate}
            disabled={submitting || !budget || !threshold}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar Alerta
          </Button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhum alerta configurado
            </p>
          ) : (
            alerts.map((alert) => {
              const spent = alert.last_spent ?? 0;
              const pct = alert.budget_amount > 0 ? (spent / alert.budget_amount) * 100 : 0;
              const reachedThreshold = pct >= alert.alert_threshold;
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-xl border space-y-2',
                    reachedThreshold ? 'border-warning/50 bg-warning/10' : 'border-border/50 bg-muted/20'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {reachedThreshold && <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
                      <p className="text-sm font-medium truncate">
                        {alert.account_name || 'Alerta de Saldo'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={(checked) => updateAlert(alert.id, { is_active: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteAlert(alert.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>R$ {spent.toFixed(2)} de R$ {alert.budget_amount.toFixed(2)}</span>
                      <span>Avisar em {alert.alert_threshold}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all',
                          reachedThreshold ? 'bg-warning' : 'bg-primary'
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
