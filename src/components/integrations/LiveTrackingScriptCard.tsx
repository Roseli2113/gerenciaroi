import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function LiveTrackingScriptCard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const script = `<!-- Gerencia ROI - Rastreamento ao Vivo -->
<script>
(function(){
  var uid="${user?.id || 'SEU_USER_ID'}";
  var sid=Math.random().toString(36).substr(2,12)+Date.now().toString(36);
  var url="https://zwylxoajyyjflvvcwpvz.supabase.co/functions/v1/track-visitor";
  var geo={country:null,region:null,city:null};
  function send(action){
    var data=JSON.stringify({user_id:uid,session_id:sid,page_url:location.href,action:action,country:geo.country,region:geo.region,city:geo.city});
    if(navigator.sendBeacon){navigator.sendBeacon(url,data)}
    else{fetch(url,{method:"POST",body:data,headers:{"Content-Type":"application/json"},keepalive:true})}
  }
  fetch("https://ipapi.co/json/").then(function(r){return r.json()}).then(function(d){
    geo.country=d.country_name||null;geo.region=d.region||null;geo.city=d.city||null;
    send("heartbeat");
  }).catch(function(){send("heartbeat")});
  setInterval(function(){send("heartbeat")},15000);
  window.addEventListener("beforeunload",function(){send("leave")});
  document.addEventListener("visibilitychange",function(){
    if(document.hidden){send("leave")}else{send("heartbeat")}
  });
})();
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    toast.success('Script copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Script de Visitantes ao Vivo</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Cole este script na sua página de vendas para rastrear visitantes em tempo real
              </p>
            </div>
          </div>
          <Badge className="bg-success/20 text-success border-0">Novo</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs overflow-x-auto max-h-48 overflow-y-auto">
            <code className="text-foreground/80">{script}</code>
          </pre>
        </div>
        <Button onClick={handleCopy} className="gap-2 w-full">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar Script'}
        </Button>
        <p className="text-xs text-muted-foreground">
          💡 Cole antes do <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> da sua página de vendas. 
          O script envia sinais a cada 15 segundos e detecta quando o visitante sai da página.
        </p>
      </CardContent>
    </Card>
  );
}
