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

// Animated bar graph that pulses and scrolls left to right
function PulseBarGraph({ count }: { count: number }) {
  const [bars, setBars] = useState<number[]>([]);
  const animRef = useRef<number>(0);
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    // Initialize bars
    const numBars = 30;
    barsRef.current = Array.from({ length: numBars }, () => Math.random() * 0.5 + 0.2);
    setBars([...barsRef.current]);

    const animate = () => {
      // Shift bars left and add a new bar on the right
      barsRef.current.shift();
      const base = Math.min(0.3 + count * 0.05, 0.9);
      const newBar = Math.random() * (1 - base * 0.5) * base + base * 0.3;
      barsRef.current.push(newBar);
      setBars([...barsRef.current]);
      animRef.current = setTimeout(() => {
        animRef.current = requestAnimationFrame(() => animate());
      }, 120) as unknown as number;
    };

    // Use setTimeout to control speed
    const startTimeout = setTimeout(() => {
      const step = () => {
        barsRef.current.shift();
        const base = Math.min(0.3 + count * 0.05, 0.9);
        const newBar = Math.random() * (1 - base * 0.5) * base + base * 0.3;
        barsRef.current.push(newBar);
        setBars([...barsRef.current]);
      };
      const interval = setInterval(step, 150);
      animRef.current = interval as unknown as number;
    }, 100);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(animRef.current);
    };
  }, [count]);

  const W = 300;
  const H = 60;
  const barWidth = W / bars.length - 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {bars.map((h, i) => {
        const barH = h * H * 0.85;
        const x = i * (barWidth + 2) + 1;
        const y = H - barH;
        const opacity = 0.4 + (i / bars.length) * 0.6;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barH}
            rx={2}
            fill="url(#barGrad)"
            opacity={opacity}
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
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
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
