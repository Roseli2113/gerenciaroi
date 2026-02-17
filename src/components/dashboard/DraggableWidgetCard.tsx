import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraggableWidgetCardProps {
  id: string;
  isEditMode: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function DraggableWidgetCard({
  id,
  isEditMode,
  onRemove,
  children,
  className,
}: DraggableWidgetCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative transition-all duration-300',
        isEditMode && 'ring-2 ring-primary/50 ring-dashed rounded-2xl',
        isDragging && 'opacity-50 shadow-2xl z-50',
        className
      )}
    >
      {isEditMode && (
        <>
          <div
            {...attributes}
            {...listeners}
            className="absolute top-3 left-3 z-10 p-1.5 rounded-lg cursor-grab hover:bg-muted bg-card/80 backdrop-blur-sm border border-border"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-10 h-7 w-7 hover:bg-destructive hover:text-destructive-foreground bg-card/80 backdrop-blur-sm border border-border"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
      {children}
    </div>
  );
}
