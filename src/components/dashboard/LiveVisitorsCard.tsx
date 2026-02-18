import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BrazilMap } from './BrazilMap';

interface LiveVisitor {
  id: string;
  session_id: string;
  page_url: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  last_seen_at: string;
}

export function LiveVisitorsCard() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<LiveVisitor[]>([]);

  const fetchVisitors = async () => {
    if (!user) return;
    const cutoff = new Date(Date.now() - 60000).toISOString();
    const { data } = await supabase
      .from('live_visitors')
      .select('*')
      .eq('user_id', user.id)
      .gt('last_seen_at', cutoff)
      .order('last_seen_at', { ascending: false });
    if (data) setVisitors(data as LiveVisitor[]);
  };

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('live-visitors-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_visitors', filter: `user_id=eq.${user.id}` },
        () => { fetchVisitors(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Group by location
  const locationGroups = visitors.reduce<Record<string, { count: number; city: string; region: string; country: string }>>((acc, v) => {
    const key = `${v.city || ''}|${v.region || ''}|${v.country || ''}`;
    if (!acc[key]) {
      acc[key] = { count: 0, city: v.city || 'Desconhecido', region: v.region || '', country: v.country || '' };
    }
    acc[key].count++;
    return acc;
  }, {});

  const locations = Object.values(locationGroups).sort((a, b) => b.count - a.count);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Visitantes ao Vivo
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </span>
            <span className="text-2xl font-bold text-foreground">{visitors.length}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {visitors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            Nenhum visitante online no momento
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mini Brazil Map */}
            <div className="flex items-center justify-center rounded-lg bg-card/40 p-2 min-h-[160px]">
              <BrazilMap locations={locations} />
            </div>
            {/* Location list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {locations.map((loc, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-card/60">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-foreground">
                      {loc.city !== 'Desconhecido' ? `${loc.city}` : ''}
                      {loc.region ? `${loc.city !== 'Desconhecido' ? ', ' : ''}${loc.region}` : ''}
                    </span>
                    {loc.country && (
                      <span className="text-muted-foreground text-xs">• {loc.country}</span>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {loc.count} {loc.count === 1 ? 'pessoa' : 'pessoas'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
