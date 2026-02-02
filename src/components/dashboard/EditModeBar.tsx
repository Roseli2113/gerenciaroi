import { Pencil, Monitor, RotateCcw, X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditModeBarProps {
  isEditMode: boolean;
  saving: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export function EditModeBar({
  isEditMode,
  saving,
  onToggleEdit,
  onSave,
  onCancel,
  onReset,
}: EditModeBarProps) {
  if (!isEditMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleEdit}
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        Editar Dashboard
      </Button>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-between gap-4 p-3 rounded-lg",
      "bg-primary text-primary-foreground"
    )}>
      <div className="flex items-center gap-3">
        <Pencil className="h-4 w-4" />
        <span className="text-sm font-medium">
          Você está editando esse dashboard para:
        </span>
        <div className="flex items-center gap-2 bg-primary-foreground/20 px-3 py-1 rounded-md">
          <Monitor className="h-4 w-4" />
          <span className="text-sm">Desktop</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="gap-2 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Redefinir configurações
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onSave}
          disabled={saving}
          className="gap-2 bg-white text-primary hover:bg-white/90"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar
        </Button>
      </div>
    </div>
  );
}
