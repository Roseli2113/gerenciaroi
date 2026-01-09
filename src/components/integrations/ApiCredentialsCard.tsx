import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, Plus, MoreVertical, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApiCredentials, ApiCredential } from '@/hooks/useApiCredentials';
import { CreateCredentialDialog } from './CreateCredentialDialog';

export function ApiCredentialsCard() {
  const { credentials, isLoading, createCredential, deleteCredential, toggleCredentialStatus } = useApiCredentials();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreate = async (name: string) => {
    const result = await createCredential(name);
    return result;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Credenciais de API</CardTitle>
            <Key className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Adicione credenciais de API para integrar com outras ferramentas:
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {credentials.map((credential) => (
                <CredentialItem
                  key={credential.id}
                  credential={credential}
                  onDelete={() => deleteCredential(credential.id)}
                  onToggleStatus={() => 
                    toggleCredentialStatus(
                      credential.id, 
                      credential.status === 'active' ? 'inactive' : 'active'
                    )
                  }
                />
              ))}
            </div>
          )}

          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Credencial
          </Button>
        </CardContent>
      </Card>

      <CreateCredentialDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={handleCreate}
      />
    </>
  );
}

function CredentialItem({ 
  credential, 
  onDelete, 
  onToggleStatus 
}: { 
  credential: ApiCredential; 
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Token {credential.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Status: {credential.status === 'active' ? (
            <span className="text-success">Ativado</span>
          ) : (
            <span className="text-destructive">Desativado</span>
          )}
        </span>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onToggleStatus}>
            {credential.status === 'active' ? 'Desativar' : 'Ativar'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
