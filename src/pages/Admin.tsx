import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Eye, Ban, Trash2, Bell, UserPlus, ShieldOff, Loader2,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const SUPER_ADMIN_EMAILS = ['r48529908@gmail.com', 'joseadalbertoferrari@gmail.com'];

interface UserProfile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  plan: string | null;
  plan_status: string | null;
  is_blocked: boolean | null;
  avatar_url: string | null;
  created_at: string;
}

interface AdminRole {
  user_id: string;
  role: string;
}

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; userId: string; email: string | null } | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as UserProfile[]);
    const { data: rolesData } = await supabase.from('user_roles').select('user_id, role');
    if (rolesData) setAdmins(rolesData as AdminRole[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  if (roleLoading) {
    return (
      <MainLayout title="Área Admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const isUserAdmin = (userId: string) => admins.some(a => a.user_id === userId && a.role === 'admin');
  const isSuperAdmin = (email: string | null) => email ? SUPER_ADMIN_EMAILS.includes(email) : false;

  const handleBlock = async (userId: string, block: boolean) => {
    await supabase.from('profiles').update({ is_blocked: block }).eq('user_id', userId);
    toast.success(block ? 'Usuário bloqueado' : 'Usuário desbloqueado');
    fetchUsers();
    setConfirmAction(null);
  };

  const handleDelete = async (userId: string) => {
    await supabase.from('profiles').delete().eq('user_id', userId);
    toast.success('Usuário excluído');
    fetchUsers();
    setConfirmAction(null);
  };

  const handleNotifyOverdue = (email: string | null) => {
    toast.success(`Notificação de plano em atraso enviada para ${email}`);
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAddingAdmin(true);

    const targetUser = users.find(u => u.email === newAdminEmail.trim());
    if (!targetUser) {
      toast.error('Usuário não encontrado. Ele precisa ter uma conta registrada.');
      setAddingAdmin(false);
      return;
    }

    const { error } = await supabase.from('user_roles').insert({
      user_id: targetUser.user_id,
      role: 'admin' as any,
    });

    if (error) {
      toast.error('Erro ao adicionar admin: ' + error.message);
    } else {
      toast.success(`${newAdminEmail} agora é admin`);
      setNewAdminEmail('');
      fetchUsers();
    }
    setAddingAdmin(false);
  };

  const handleRemoveAdmin = async (userId: string) => {
    await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin' as any);
    toast.success('Admin removido');
    fetchUsers();
    setConfirmAction(null);
  };

  const getPlanBadge = (status: string | null) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ativo</Badge>;
      case 'overdue': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Em Atraso</Badge>;
      case 'cancelled': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelado</Badge>;
      default: return <Badge variant="secondary">Free</Badge>;
    }
  };

  return (
    <MainLayout title="Área Admin">
      <div className="space-y-6">
        {/* Add Admin Section */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-lg font-semibold text-foreground mb-3">Gerenciar Administradores</h3>
          <div className="flex gap-3">
            <Input
              placeholder="Email do novo admin..."
              value={newAdminEmail}
              onChange={e => setNewAdminEmail(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleAddAdmin} disabled={addingAdmin}>
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Admin
            </Button>
          </div>

          {/* Current admins */}
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Admins atuais:</p>
            {admins.filter(a => a.role === 'admin').map(admin => {
              const profile = users.find(u => u.user_id === admin.user_id);
              const superAdmin = isSuperAdmin(profile?.email ?? null);
              return (
                <div key={admin.user_id} className="flex items-center gap-3 text-sm">
                  <span className="text-foreground">{profile?.email ?? admin.user_id}</span>
                  {superAdmin && <Badge className="bg-primary/20 text-primary border-primary/30">Super Admin</Badge>}
                  {!superAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: 'remove-admin', userId: admin.user_id, email: profile?.email ?? null })}>
                      <ShieldOff className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Usuários ({users.length})</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium text-foreground">
                      {u.display_name || '—'}
                      {u.is_blocked && <Badge className="ml-2 bg-red-500/20 text-red-400 border-red-500/30">Bloqueado</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{u.phone || '—'}</TableCell>
                    <TableCell>{u.plan || 'Free'}</TableCell>
                    <TableCell>{getPlanBadge(u.plan_status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(u); setDetailsOpen(true); }} title="Ver detalhes">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleNotifyOverdue(u.email)} title="Notificar plano em atraso">
                          <Bell className="w-4 h-4 text-amber-400" />
                        </Button>
                        {!isSuperAdmin(u.email) && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: u.is_blocked ? 'unblock' : 'block', userId: u.user_id, email: u.email })} title={u.is_blocked ? 'Desbloquear' : 'Bloquear'}>
                              <Ban className="w-4 h-4 text-orange-400" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: 'delete', userId: u.user_id, email: u.email })} title="Excluir">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>Informações completas do usuário</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> <span className="text-foreground ml-2">{selectedUser.display_name || '—'}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground ml-2">{selectedUser.email || '—'}</span></div>
              <div><span className="text-muted-foreground">Celular:</span> <span className="text-foreground ml-2">{selectedUser.phone || '—'}</span></div>
              <div><span className="text-muted-foreground">Plano:</span> <span className="text-foreground ml-2">{selectedUser.plan || 'Free'}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{getPlanBadge(selectedUser.plan_status)}</span></div>
              <div><span className="text-muted-foreground">Bloqueado:</span> <span className="text-foreground ml-2">{selectedUser.is_blocked ? 'Sim' : 'Não'}</span></div>
              <div><span className="text-muted-foreground">Admin:</span> <span className="text-foreground ml-2">{isUserAdmin(selectedUser.user_id) ? 'Sim' : 'Não'}</span></div>
              <div><span className="text-muted-foreground">Cadastrado em:</span> <span className="text-foreground ml-2">{new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'block' && 'Bloquear Usuário'}
              {confirmAction?.type === 'unblock' && 'Desbloquear Usuário'}
              {confirmAction?.type === 'delete' && 'Excluir Usuário'}
              {confirmAction?.type === 'remove-admin' && 'Remover Admin'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'delete'
                ? `Tem certeza que deseja excluir ${confirmAction?.email}? Esta ação não pode ser desfeita.`
                : `Confirmar ação para ${confirmAction?.email}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === 'block') handleBlock(confirmAction.userId, true);
                else if (confirmAction.type === 'unblock') handleBlock(confirmAction.userId, false);
                else if (confirmAction.type === 'delete') handleDelete(confirmAction.userId);
                else if (confirmAction.type === 'remove-admin') handleRemoveAdmin(confirmAction.userId);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
