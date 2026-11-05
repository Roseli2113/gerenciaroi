import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { getViewAs, stopViewAs } from '@/lib/viewAs';

export function ViewAsBanner() {
  const v = getViewAs();
  if (!v) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 bg-warning text-warning-foreground px-4 py-2 text-sm font-medium">
      <Eye className="w-4 h-4" />
      <span>Vendo o painel de <strong>{v.name || v.email}</strong>{v.name && v.email ? ` (${v.email})` : ''} — somente visualização</span>
      <Button size="sm" variant="secondary" onClick={stopViewAs}>Sair e voltar ao Admin</Button>
    </div>
  );
}
