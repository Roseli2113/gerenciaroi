import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

interface EditAdSetBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adSetName: string;
  currentBudget: number | null;
  budgetType: 'daily' | 'total' | null;
  onSave: (budget: number, budgetType: 'daily' | 'total') => Promise<boolean>;
}

export function EditAdSetBudgetDialog({
  open,
  onOpenChange,
  adSetName,
  currentBudget,
  budgetType,
  onSave,
}: EditAdSetBudgetDialogProps) {
  const [budget, setBudget] = useState(currentBudget?.toString() || '');
  const [type, setType] = useState<'daily' | 'total'>(budgetType || 'daily');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const budgetValue = parseFloat(budget.replace(',', '.'));
    if (isNaN(budgetValue) || budgetValue <= 0) {
      return;
    }

    setIsSaving(true);
    const success = await onSave(budgetValue, type);
    setIsSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Orçamento do Conjunto</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Conjunto de Anúncios</Label>
            <p className="font-medium text-foreground">{adSetName}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Tipo de Orçamento</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as 'daily' | 'total')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily-adset" />
                <Label htmlFor="daily-adset" className="font-normal cursor-pointer">
                  Orçamento Diário
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="total" id="total-adset" />
                <Label htmlFor="total-adset" className="font-normal cursor-pointer">
                  Orçamento Total
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="budget-adset">Valor (R$)</Label>
            <Input
              id="budget-adset"
              type="text"
              placeholder="0,00"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !budget}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
