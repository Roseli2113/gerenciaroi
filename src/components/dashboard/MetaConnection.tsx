import { Facebook, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MetaConnectionProps {
  isConnected?: boolean;
}

export function MetaConnection({ isConnected = false }: MetaConnectionProps) {
  return (
    <div className={cn(
      'rounded-2xl border p-6 transition-all',
      isConnected 
        ? 'border-success/30 bg-success/5' 
        : 'border-primary/30 bg-primary/5'
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          isConnected ? 'bg-success/20' : 'bg-primary/20'
        )}>
          <Facebook className={cn(
            'w-6 h-6',
            isConnected ? 'text-success' : 'text-primary'
          )} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Meta Ads</h3>
            {isConnected ? (
              <div className="flex items-center gap-1 text-success text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Conectado
              </div>
            ) : (
              <div className="flex items-center gap-1 text-warning text-sm">
                <AlertCircle className="w-4 h-4" />
                Não conectado
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isConnected 
              ? '3 contas de anúncio • 12 campanhas ativas'
              : 'Conecte sua conta para gerenciar campanhas'
            }
          </p>
        </div>

        <Button 
          variant={isConnected ? 'outline' : 'default'}
          className={cn(
            !isConnected && 'gradient-primary text-primary-foreground hover:opacity-90'
          )}
        >
          {isConnected ? 'Gerenciar' : 'Conectar Meta Ads'}
        </Button>
      </div>
    </div>
  );
}
