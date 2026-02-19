import { useState, useEffect, useRef } from 'react';
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

// Animated bar graph: each bar represents one active visitor, scrolling left to right
function PulseBarGraph({ count }: { count: number }) {
  const [offset, setOffset] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (count <= 0) return;
    animRef.current = setInterval(() => {
      setOffset(prev => prev + 1);
    }, 200);
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [count]);

  const W = 300;
  const H = 60;
  const maxBars = Math.min(count, 30);
  const barWidth = maxBars > 0 ? Math.min(W / maxBars - 2, 20) : 10;
  const totalBarSpace = maxBars * (barWidth + 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {Array.from({ length: maxBars }, (_, i) => {
        // Each bar has a unique height that oscillates based on offset
        const seed = (i * 7 + 3) % 11;
        const wave = Math.sin((offset + i * 2) * 0.15 + seed) * 0.3 + 0.6;
        const barH = wave * H * 0.85;
        const x = i * (barWidth + 2) + (W - totalBarSpace) / 2;
        const y = H - barH;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barH}
            rx={2}
            fill="url(#barGrad)"
            opacity={0.7 + (i / maxBars) * 0.3}
          />
        );
      })}
    </svg>
  );
}

export function LiveVisitorsCard() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<LiveVisitor[]>([]);

  const fetchVisitors = async () => {
    if (!user) return;
    const cutoff = new Date(Date.now() - 30000).toISOString();
    const { data } = await supabase
      .from('live_visitors')
      .select('*')
      .eq('user_id', user.id)
      .gt('last_seen_at', cutoff)
      .order('last_seen_at', { ascending: false });
    setVisitors((data as LiveVisitor[]) || []);
  };

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 5000);
    return () => clearInterval(interval);
  }, [user]);

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
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Visitantes ao Vivo
          </CardTitle>
          <div className="flex items-center gap-2">
            {visitors.length > 0 && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
              </span>
            )}
            <span className="text-2xl font-bold text-foreground">{visitors.length}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-0 pb-0">
        {visitors.length > 0 ? (
          <div className="h-16 w-full">
            <PulseBarGraph count={visitors.length} />
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Nenhum visitante no momento</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
