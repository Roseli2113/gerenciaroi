import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

interface BulkBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemCount: number;
  entityType: 'campaign' | 'adset';
  onSave: (budget: number, budgetType: 'daily' | 'total') => Promise<boolean>;
}

export function BulkBudgetDialog({
  open, onOpenChange, itemCount, entityType, onSave,
}: BulkBudgetDialogProps) {
  const [budget, setBudget] = useState('');
  const [type, setType] = useState<'daily' | 'total'>('daily');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const budgetValue = parseFloat(budget.replace(',', '.'));
    if (isNaN(budgetValue) || budgetValue <= 0) return;

    setIsSaving(true);
    const success = await onSave(budgetValue, type);
    setIsSaving(false);
    if (success) onOpenChange(false);
  };

  const label = entityType === 'campaign' ? 'campanhas' : 'conjuntos';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Orçamento em Massa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium text-foreground">
              O novo orçamento será aplicado a <strong>{itemCount} {label}</strong> selecionadas.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Orçamento</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as 'daily' | 'total')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="bulk-daily" />
                <Label htmlFor="bulk-daily" className="font-normal cursor-pointer">Orçamento Diário</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="total" id="bulk-total" />
                <Label htmlFor="bulk-total" className="font-normal cursor-pointer">Orçamento Total</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bulk-budget">Valor (R$)</Label>
            <Input
              id="bulk-budget"
              type="text"
              placeholder="0,00"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving || !budget}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Aplicar a {itemCount} {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
