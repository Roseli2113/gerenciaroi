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

// Animated pulse line component using SVG for reliable rendering
function PulseLineGraph({ count }: { count: number }) {
  const [offset, setOffset] = useState(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      setOffset(prev => prev + 1.2);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const W = 300;
  const H = 60;
  const amplitude = Math.min(H * 0.35, 12 + count * 2);

  // Build wave path
  let pathD = `M 0 ${H}`;
  let lineD = '';
  for (let x = 0; x <= W; x += 2) {
    const y = H / 2 + Math.sin((x + offset) * 0.04) * amplitude
      + Math.sin((x + offset * 0.7) * 0.02) * (amplitude * 0.5);
    pathD += ` L ${x} ${y}`;
    lineD += (x === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  }
  pathD += ` L ${W} ${H} Z`;

  // Dot position at right edge
  const dotY = H / 2 + Math.sin((W + offset) * 0.04) * amplitude
    + Math.sin((W + offset * 0.7) * 0.02) * (amplitude * 0.5);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="waveFill" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="waveLine" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          <stop offset="30%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
          <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path d={pathD} fill="url(#waveFill)" />
      <path d={lineD} fill="none" stroke="url(#waveLine)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={W - 2} cy={dotY} r="6" fill="hsl(var(--primary))" opacity="0.25" />
      <circle cx={W - 2} cy={dotY} r="3" fill="hsl(var(--primary))" />
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
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </span>
            <span className="text-2xl font-bold text-foreground">{visitors.length}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-0 pb-0">
        <div className="h-16 w-full">
          <PulseLineGraph count={visitors.length} />
        </div>
      </CardContent>
    </Card>
  );
}
