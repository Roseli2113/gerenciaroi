import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Mail, ShieldCheck, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import logoImg from '@/assets/Logo_gerencia_roi.png';

const DataDeletion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Delete user data from all tables
      await supabase.from('rule_execution_logs').delete().eq('user_id', user.id);
      await supabase.from('automation_rules').delete().eq('user_id', user.id);
      await supabase.from('sales').delete().eq('user_id', user.id);
      await supabase.from('webhooks').delete().eq('user_id', user.id);
      await supabase.from('api_credentials').delete().eq('user_id', user.id);
      await supabase.from('pixel_meta_ids').delete().eq('user_id', user.id);
      await supabase.from('pixels').delete().eq('user_id', user.id);
      await supabase.from('meta_ad_accounts').delete().eq('user_id', user.id);
      await supabase.from('meta_connections').delete().eq('user_id', user.id);
      await supabase.from('dashboard_layouts').delete().eq('user_id', user.id);
      await supabase.from('integration_tests').delete().eq('user_id', user.id);
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);
      await supabase.auth.signOut();
      toast.success('Seus dados foram excluídos com sucesso.');
      navigate('/landing');
    } catch (err) {
      toast.error('Erro ao excluir dados. Tente novamente ou entre em contato pelo e-mail.');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/landing" className="flex items-center gap-3">
            <img src={logoImg} alt="Gerencia ROI" className="w-10 h-10 rounded-lg" />
            <span className="font-bold text-lg">Gerencia ROI</span>
          </Link>
          <Link to="/landing">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <Trash2 className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Exclusão de Dados do Usuário</h1>
          <p className="text-muted-foreground text-lg">
            Você tem o direito de solicitar a exclusão permanente de todos os seus dados pessoais armazenados em nossa plataforma.
          </p>
        </div>

        {/* Warning */}
        <Card className="border-destructive/30 bg-destructive/5 mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">Atenção — Ação Irreversível</h3>
                <p className="text-sm text-muted-foreground">
                  A exclusão dos seus dados é permanente e não pode ser desfeita. Após a conclusão do processo, 
                  você perderá acesso à plataforma e todos os dados associados à sua conta serão removidos definitivamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What will be deleted */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">O que será excluído</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                'Dados do perfil (nome, e-mail, telefone, foto de perfil)',
                'Histórico de vendas e transações registradas na plataforma',
                'Campanhas e configurações de anúncios sincronizadas',
                'Webhooks, pixels e credenciais de integração',
                'Regras de automação criadas',
                'Dados de rastreamento UTM e visitantes ao vivo',
                'Preferências de notificação e configurações da conta',
                'Layouts personalizados do dashboard',
                'Logs de execução de regras',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Trash2 className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* How to request */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Como solicitar a exclusão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Option 1: Inside the app */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Pela própria plataforma</h4>
                <p className="text-sm text-muted-foreground">
                  Acesse sua conta, vá em <strong>Perfil → Configurações da Conta</strong> e clique em 
                  <strong> "Excluir minha conta"</strong>. A exclusão será processada imediatamente após a confirmação.
                </p>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Option 2: By email */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Por e-mail</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Envie um e-mail para o nosso suporte solicitando a exclusão dos seus dados. 
                  Inclua o e-mail cadastrado na sua conta para que possamos identificar e processar sua solicitação.
                </p>
                <a
                  href="mailto:contato@adsroi.com.br?subject=Solicitação de Exclusão de Dados&body=Olá, gostaria de solicitar a exclusão permanente de todos os meus dados pessoais armazenados na plataforma Gerencia ROI. E-mail da conta: [SEU E-MAIL AQUI]"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  contato@adsroi.com.br
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing time */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Prazo de Processamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Após a confirmação da solicitação, seus dados serão excluídos em até <strong>30 dias úteis</strong>, 
              conforme exigido pela Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). 
              Você receberá uma confirmação por e-mail assim que o processo for concluído.
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              Alguns dados poderão ser mantidos pelo prazo mínimo exigido por lei para fins fiscais, 
              contábeis ou de cumprimento de obrigações legais, após o qual serão definitivamente excluídos.
            </p>
          </CardContent>
        </Card>

        {/* Delete button */}
        {user && (
          <Card className="mb-8 border-destructive/30">
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Você está logado como <strong>{user.email}</strong>. Clique abaixo para excluir permanentemente todos os seus dados.
              </p>
              <Button variant="destructive" className="gap-2" onClick={() => setShowConfirm(true)}>
                <Trash2 className="w-4 h-4" />
                Excluir minha conta e dados
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Confirm dialog */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão permanente</DialogTitle>
              <DialogDescription>
                Todos os seus dados serão excluídos permanentemente e você será desconectado. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={deleting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting} className="gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? 'Excluindo...' : 'Sim, excluir tudo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contact */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Dúvidas sobre sua privacidade?{' '}
            <a href="mailto:contato@adsroi.com.br" className="text-primary hover:underline">
              Entre em contato conosco
            </a>{' '}
            ou consulte nossa{' '}
            <Link to="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </Link>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          GERENCIA ROI 2026 - TODOS OS DIREITOS RESERVADOS.
        </div>
      </footer>
    </div>
  );
};

export default DataDeletion;
