import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
          <p className="text-sm text-muted-foreground text-center">
            {visitors.length} {visitors.length === 1 ? 'visitante' : 'visitantes'} online agora
          </p>
        )}
      </CardContent>
    </Card>
  );
}
