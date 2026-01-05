import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Bell, Mail, MessageSquare, Smartphone, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const notifications = [
  {
    id: '1',
    type: 'success',
    title: 'Regra executada com sucesso',
    message: 'Orçamento da campanha "Conversão - Produto Premium" aumentado em 20%',
    time: 'há 25 min',
    read: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'CPA acima do esperado',
    message: 'A campanha "Awareness - Lançamento" está com CPA de R$ 18,90',
    time: 'há 1 hora',
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'ROI positivo detectado',
    message: 'Campanha "Remarketing" atingiu ROI de 320%',
    time: 'há 2 horas',
    read: true,
  },
  {
    id: '4',
    type: 'danger',
    title: 'Campanha pausada automaticamente',
    message: 'A campanha "Tráfego - Blog Posts" foi pausada devido ao CPA alto',
    time: 'há 4 horas',
    read: true,
  },
];

const notificationSettings = [
  { id: 'email', label: 'Notificações por Email', description: 'Receba alertas importantes no seu email', icon: Mail },
  { id: 'push', label: 'Notificações Push', description: 'Alertas em tempo real no navegador', icon: Bell },
  { id: 'sms', label: 'Notificações SMS', description: 'Mensagens de texto para alertas críticos', icon: Smartphone },
  { id: 'slack', label: 'Integração Slack', description: 'Envie notificações para seu canal Slack', icon: MessageSquare },
];

const Notifications = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'info':
        return <TrendingUp className="w-5 h-5 text-primary" />;
      case 'danger':
        return <TrendingDown className="w-5 h-5 text-destructive" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <MainLayout title="Notificações">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recentes</h3>
              <Button variant="ghost" size="sm">
                Marcar todas como lidas
              </Button>
            </div>

            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card key={notification.id} className={cn(
                  'transition-all hover:shadow-card-hover',
                  !notification.read && 'border-primary/30 bg-primary/5'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'p-2 rounded-xl',
                        notification.type === 'success' && 'bg-success/20',
                        notification.type === 'warning' && 'bg-warning/20',
                        notification.type === 'info' && 'bg-primary/20',
                        notification.type === 'danger' && 'bg-destructive/20',
                      )}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações</CardTitle>
              <CardDescription>
                Escolha como deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationSettings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <setting.icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{setting.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked={setting.id === 'email' || setting.id === 'push'} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Notifications;
