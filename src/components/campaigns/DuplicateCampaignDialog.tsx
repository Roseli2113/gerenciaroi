import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2, CalendarIcon, Power, PowerOff } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DuplicateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: 'campanha' | 'conjunto' | 'anúncio';
  accounts?: Array<{ id: string; name: string; account_id: string }>;
  currentAccountId?: string;
  onDuplicate: (targetAccountId: string | null, copies: number, statusOption: string, scheduledDate?: string) => Promise<boolean>;
}

export function DuplicateCampaignDialog({
  open,
  onOpenChange,
  itemName,
  itemType,
  accounts = [],
  currentAccountId,
  onDuplicate,
}: DuplicateCampaignDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'same' | 'other'>('same');
  const [copies, setCopies] = useState(1);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusOption, setStatusOption] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE');
  const [useSchedule, setUseSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState('00:00');

  const otherAccounts = accounts.filter(a => a.account_id !== currentAccountId);

  const handleDuplicate = async () => {
    setIsLoading(true);
    const targetAccount = selectedOption === 'other' ? selectedAccountId : null;
    
    let isoDate: string | undefined;
    if (useSchedule && scheduledDate) {
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const dt = new Date(scheduledDate);
      dt.setHours(hours, minutes, 0, 0);
      isoDate = dt.toISOString();
    }

    const success = await onDuplicate(targetAccount, copies, statusOption, isoDate);
    setIsLoading(false);
    if (success) {
      onOpenChange(false);
      setCopies(1);
      setSelectedOption('same');
      setSelectedAccountId(null);
      setStatusOption('ACTIVE');
      setUseSchedule(false);
      setScheduledDate(undefined);
      setScheduledTime('00:00');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Duplique sua {itemType}</DialogTitle>
          <DialogDescription>
            Escolha como quer duplicar sua {itemType}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Same account option */}
          <button
            type="button"
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-colors",
              selectedOption === 'same'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            )}
            onClick={() => setSelectedOption('same')}
          >
            <p className="font-semibold text-sm text-foreground">Mesma Conta de Anúncio</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sua {itemType} será duplicada na mesma conta de anúncio a que pertence.
            </p>
          </button>

          {/* Other account option */}
          <button
            type="button"
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-colors",
              selectedOption === 'other'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            )}
            onClick={() => setSelectedOption('other')}
          >
            <p className="font-semibold text-sm text-foreground">Outra Conta de Anúncio</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sua {itemType} será duplicada em outra conta de anúncio que você escolher.
            </p>
          </button>

          {/* Account selector for "other" option */}
          {selectedOption === 'other' && otherAccounts.length > 0 && (
            <div className="pl-4">
              <label className="text-xs text-muted-foreground mb-1 block">Conta de destino</label>
              <select
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                <option value="">Selecione uma conta</option>
                {otherAccounts.map(acc => (
                  <option key={acc.id} value={acc.account_id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedOption === 'other' && otherAccounts.length === 0 && (
            <p className="text-xs text-muted-foreground pl-4">Nenhuma outra conta disponível.</p>
          )}

          {/* Status selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Status da cópia</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors text-sm font-medium",
                  statusOption === 'ACTIVE'
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:border-muted-foreground/50 text-muted-foreground"
                )}
                onClick={() => setStatusOption('ACTIVE')}
              >
                <Power className="w-4 h-4" />
                Ativa
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors text-sm font-medium",
                  statusOption === 'PAUSED'
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:border-muted-foreground/50 text-muted-foreground"
                )}
                onClick={() => setStatusOption('PAUSED')}
              >
                <PowerOff className="w-4 h-4" />
                Pausada
              </button>
            </div>
          </div>

          {/* Schedule toggle */}
          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={useSchedule}
                onChange={(e) => setUseSchedule(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-muted-foreground text-xs">Agendar ativação</span>
            </label>
          </div>

          {/* Date & time picker */}
          {useSchedule && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-9 justify-start text-left font-normal text-sm",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-28">
                <label className="text-xs text-muted-foreground mb-1 block">Horário</label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          )}

          {/* Copy count */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Quantidade de cópias</label>
            <Input
              type="number"
              min={1}
              max={10}
              value={copies}
              onChange={(e) => setCopies(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="h-9"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={isLoading || (selectedOption === 'other' && !selectedAccountId)}
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Duplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
