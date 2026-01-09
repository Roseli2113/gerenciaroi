import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CreateCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<{ token: string } | null>;
}

export function CreateCredentialDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateCredentialDialogProps) {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Digite um nome para a credencial');
      return;
    }

    setIsCreating(true);
    const result = await onCreate(name.trim());
    setIsCreating(false);
    
    if (result) {
      setCreatedToken(result.token);
    }
  };

  const handleCopy = async () => {
    if (createdToken) {
      await navigator.clipboard.writeText(createdToken);
      setCopied(true);
      toast.success('Token copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setCreatedToken(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {createdToken ? 'Credencial Criada' : 'Criar Credencial de API'}
          </DialogTitle>
        </DialogHeader>
        
        {!createdToken ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credential-name">Nome</Label>
              <Input
                id="credential-name"
                type="text"
                placeholder="Nome da Credencial"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            
            <Button 
              onClick={handleCreate} 
              disabled={isCreating || !name.trim()}
              className="w-full"
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Credencial
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <p className="text-sm text-muted-foreground">
                Copie o token abaixo. Por segurança, ele não será exibido novamente.
              </p>
              <div className="flex gap-2">
                <Input
                  value={createdToken}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
