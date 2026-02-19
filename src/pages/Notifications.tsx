import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Bell, Mail, MessageSquare, Smartphone, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Volume2, Play, Trash2, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSaleNotification, SOUND_OPTIONS, type SoundId } from '@/hooks/useSaleNotification';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const Notifications = () => {
  const { user } = useAuth();
  const { selectedSound, updateSound, previewSound } = useSaleNotification();
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [settings, setSettings] = useState({
    notify_email: true,
    notify_push: true,
    notify_sms: false,
    notify_slack: false,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('notify_email, notify_push, notify_sms, notify_slack')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setSettings({
          notify_email: data.notify_email ?? true,
          notify_push: data.notify_push ?? true,
          notify_sms: data.notify_sms ?? false,
          notify_slack: data.notify_slack ?? false,
        });
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  const toggleSetting = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ [key]: newValue, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) {
      setSettings(prev => ({ ...prev, [key]: !newValue }));
      toast.error('Erro ao salvar configuração');
    }
  };

  const deleteNotification = (id: string) => {
    setNotificationsList(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
  };

  const settingsList = [
    { id: 'notify_email' as const, label: 'Notificações por Email', description: 'Receba alertas importantes no seu email', icon: Mail },
    { id: 'notify_push' as const, label: 'Notificações Push', description: 'Alertas em tempo real no navegador', icon: Bell },
    { id: 'notify_sms' as const, label: 'Notificações SMS', description: 'Mensagens de texto para alertas críticos', icon: Smartphone },
    { id: 'notify_slack' as const, label: 'Integração Slack', description: 'Envie notificações para seu canal Slack', icon: MessageSquare },
  ];

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
              {notificationsList.length > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllRead}>
                  Marcar todas como lidas
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {notificationsList.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <BellOff className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Nenhuma notificação</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Você ainda não tem notificações. Elas aparecerão aqui quando suas regras forem executadas.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                notificationsList.map((notification) => (
                  <Card key={notification.id} className={cn(
                    'transition-all hover:shadow-card-hover',
                    !notification.read && 'border-primary/30 bg-primary/5'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'p-2 rounded-xl shrink-0',
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Settings Column */}
          <div className="space-y-6">
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações</CardTitle>
                <CardDescription>
                  Escolha como deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settingsList.map((setting) => (
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
                    <Switch
                      checked={settings[setting.id]}
                      onCheckedChange={() => toggleSetting(setting.id)}
                      disabled={!loaded}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Sale Notification Sound */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Som de Venda
                </CardTitle>
                <CardDescription>
                  Som tocado quando uma nova venda é recebida
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedSound}
                  onValueChange={(value) => updateSound(value as SoundId)}
                  className="space-y-3"
                >
                  {SOUND_OPTIONS.map((sound) => (
                    <div key={sound.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={sound.id} id={`notif-${sound.id}`} />
                        <Label htmlFor={`notif-${sound.id}`} className="cursor-pointer font-medium">
                          {sound.label}
                        </Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewSound(sound.id)}
                        className="gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Ouvir
                      </Button>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Notifications;
