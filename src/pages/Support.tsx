import { MainLayout } from '@/components/layout/MainLayout';
import { ExternalLink, Play, List, MessageCircle, Users } from 'lucide-react';
import whatsappIcon from '@/assets/whatsapp-icon.png';

const tutorials = [
  {
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png',
    title: 'Facebook',
    description: 'Tutoriais da plataforma',
    buttonLabel: 'Ver tutoriais',
    buttonIcon: <List className="w-4 h-4" />,
    url: '#',
  },
  {
    icon: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    title: 'Google',
    description: 'Tutoriais da plataforma',
    buttonLabel: 'Ver tutoriais',
    buttonIcon: <List className="w-4 h-4" />,
    url: '#',
  },
  {
    icon: null,
    title: 'Tutorial rápido (WhatsApp)',
    description: 'Configure sua conta para WHATSAPP em apenas 10 minutos',
    buttonLabel: 'Assistir',
    buttonIcon: <Play className="w-4 h-4" />,
    url: '#',
    isVideo: true,
  },
  {
    icon: null,
    title: 'Regras',
    description: 'Aprenda a automatizar sua operação',
    buttonLabel: 'Assistir',
    buttonIcon: <Play className="w-4 h-4" />,
    url: '#',
    isVideo: true,
  },
  {
    icon: null,
    title: 'Configuração de UTMs',
    description: 'Principais dúvidas sobre a configuração de UTMs',
    buttonLabel: 'Assistir',
    buttonIcon: <Play className="w-4 h-4" />,
    url: '#',
    isVideo: true,
  },
];

const supportItems = [
  {
    icon: 'whatsapp',
    title: 'Suporte WhatsApp',
    description: 'Entre em contato conosco',
    buttonLabel: 'Contato',
    buttonIcon: <MessageCircle className="w-4 h-4" />,
    url: 'https://wa.me/5515997109182',
  },
  {
    icon: 'whatsapp',
    title: 'Comunidade 1',
    description: 'Entre no grupo de avisos',
    buttonLabel: 'Entrar',
    buttonIcon: <Users className="w-4 h-4" />,
    url: 'https://chat.whatsapp.com/JIuY9HZ3JM91EBAhti9xIy?mode=gi_t',
  },
  {
    icon: 'whatsapp',
    title: 'Comunidade 2',
    description: 'Entre no grupo de avisos',
    buttonLabel: 'Entrar',
    buttonIcon: <Users className="w-4 h-4" />,
    disabled: true,
    url: '#',
  },
  {
    icon: 'link',
    title: 'Central de Ajuda',
    description: 'Encontre possíveis soluções para os seus problemas',
    buttonLabel: 'Abrir link',
    buttonIcon: <ExternalLink className="w-4 h-4" />,
    url: '#',
  },
];

export default function Support() {
  return (
    <MainLayout title="Suporte">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tutoriais */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Tutoriais</h2>
          <div className="space-y-1">
            {tutorials.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.isVideo ? (
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <Play className="w-5 h-5 text-destructive" />
                    </div>
                  ) : item.icon ? (
                    <img src={item.icon} alt={item.title} className="w-10 h-10 rounded-full object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <List className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  {item.buttonIcon}
                  {item.buttonLabel}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Suporte */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Suporte</h2>
          <div className="space-y-1">
            {supportItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.icon === 'whatsapp' ? (
                    <img src={whatsappIcon} alt="WhatsApp" className="w-10 h-10" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
                >
                  {item.buttonIcon}
                  {item.buttonLabel}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
