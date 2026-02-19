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
      "flex items-center gap-2 p-2 rounded-lg",
      "bg-primary text-primary-foreground"
    )}>
      <div className="flex items-center gap-1.5 bg-primary-foreground/20 px-2.5 py-1 rounded-md">
        <Monitor className="h-3.5 w-3.5" />
        <span className="text-xs">Desktop</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="gap-1.5 text-xs h-7 px-2 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Redefinir</span>
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onCancel}
        className="gap-1.5 text-xs h-7 px-2"
      >
        <X className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Cancelar</span>
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onSave}
        disabled={saving}
        className="gap-1.5 text-xs h-7 px-2 bg-white text-primary hover:bg-white/90"
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
        Salvar
      </Button>
    </div>
  );
}
