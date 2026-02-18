import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface DuplicateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: 'campanha' | 'conjunto' | 'anúncio';
  accounts?: Array<{ id: string; name: string; account_id: string }>;
  currentAccountId?: string;
  onDuplicate: (targetAccountId: string | null, copies: number) => Promise<boolean>;
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

  const otherAccounts = accounts.filter(a => a.account_id !== currentAccountId);

  const handleDuplicate = async () => {
    setIsLoading(true);
    const targetAccount = selectedOption === 'other' ? selectedAccountId : null;
    const success = await onDuplicate(targetAccount, copies);
    setIsLoading(false);
    if (success) {
      onOpenChange(false);
      setCopies(1);
      setSelectedOption('same');
      setSelectedAccountId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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

