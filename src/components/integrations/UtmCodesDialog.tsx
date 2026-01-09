import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface UtmCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: 'facebook' | 'google' | 'kwai' | 'tiktok';
}

const platformCodes = {
  facebook: {
    title: 'Facebook',
    codes: [
      {
        name: 'Hotmart',
        code: 'utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}&xcod=FBhQwK21wXxR{{campaign.name}}|{{campaign.id}}hQwK21wXxR{{adset.name}}|{{adset.id}}hQwK21wXxR{{ad.name}}|{{ad.id}}hQwK21wXxR{{placement}}',
      },
      {
        name: 'Cartpanda',
        code: 'utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}&cid=73327864163',
      },
      {
        name: 'Outra',
        code: 'utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}',
      },
    ],
  },
  google: {
    title: 'Google',
    codes: [
      {
        name: 'Hotmart',
        code: 'utm_source=google&utm_campaign={campaignid}&utm_medium={adgroupid}&utm_content={creative}&utm_term={keyword}&xcod=GOOGLEhQwK21wXxR{campaignid}hQwK21wXxR{adgroupid}hQwK21wXxR{creative}hQwK21wXxR{keyword}',
      },
      {
        name: 'Cartpanda',
        code: 'utm_source=google&utm_campaign={campaignid}&utm_medium={adgroupid}&utm_content={creative}&utm_term={keyword}&cid=73327864163',
      },
      {
        name: 'Outra',
        code: 'utm_source=google&utm_campaign={campaignid}&utm_medium={adgroupid}&utm_content={creative}&utm_term={keyword}',
      },
    ],
  },
  kwai: {
    title: 'Kwai',
    codes: [
      {
        name: 'Hotmart',
        code: 'utm_source=kwai&utm_campaign=__CAMPAIGN_NAME__|__CAMPAIGN_ID__&utm_medium=__ADGROUP_NAME__|__ADGROUP_ID__&utm_content=__CREATIVE_NAME__|__CREATIVE_ID__&xcod=KWAIhQwK21wXxR__CAMPAIGN_ID__hQwK21wXxR__ADGROUP_ID__hQwK21wXxR__CREATIVE_ID__',
      },
      {
        name: 'Cartpanda',
        code: 'utm_source=kwai&utm_campaign=__CAMPAIGN_NAME__|__CAMPAIGN_ID__&utm_medium=__ADGROUP_NAME__|__ADGROUP_ID__&utm_content=__CREATIVE_NAME__|__CREATIVE_ID__&cid=73327864163',
      },
      {
        name: 'Outra',
        code: 'utm_source=kwai&utm_campaign=__CAMPAIGN_NAME__|__CAMPAIGN_ID__&utm_medium=__ADGROUP_NAME__|__ADGROUP_ID__&utm_content=__CREATIVE_NAME__|__CREATIVE_ID__',
      },
    ],
  },
  tiktok: {
    title: 'TikTok',
    codes: [
      {
        name: 'Hotmart',
        code: 'utm_source=tiktok&utm_campaign=__CAMPAIGN_NAME__|__CAMPAIGN_ID__&utm_medium=__AID_NAME__|__AID__&utm_content=__CID_NAME__|__CID__&xcod=TIKTOKhQwK21wXxR__CAMPAIGN_ID__hQwK21wXxR__AID__hQwK21wXxR__CID__',
      },
      {
        name: 'Cartpanda',
        code: 'utm_source=tiktok&utm_campaign=__CAMPAIGN_NAME__|__CAMPAIGN_ID__&utm_medium=__AID_NAME__|__AID__&utm_content=__CID_NAME__|__CID__&cid=73327864163',
      },
      {
        name: 'Outra',
        code: 'utm_source=tiktok&utm_campaign=__CAMPAIGN_NAME__|__CAMPAIGN_ID__&utm_medium=__AID_NAME__|__AID__&utm_content=__CID_NAME__|__CID__',
      },
    ],
  },
};

export function UtmCodesDialog({ open, onOpenChange, platform }: UtmCodesDialogProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const data = platformCodes[platform];

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    toast.success('Código copiado!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-bold">Obtenha os códigos de UTMs do {data.title}</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            apropriados para a sua plataforma de vendas:
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {data.codes.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium text-foreground">{item.name}</span>
              <Button
                size="sm"
                onClick={() => copyToClipboard(item.code, index)}
                className="gap-2"
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            Utiliza cloaker?{' '}
            <a href="#" className="text-primary underline hover:no-underline">
              Clique aqui
            </a>{' '}
            para verificar como configurar os parâmetros juntamente aos cloakers.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
