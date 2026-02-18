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

// Animated pulse line component
function PulseLineGraph({ count }: { count: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const amplitude = Math.min(h * 0.35, 16 + count * 2);
    const speed = 1.2;

    const draw = () => {
      offsetRef.current += speed;
      ctx.clearRect(0, 0, w, h);

      // Gradient fill
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      const style = getComputedStyle(document.documentElement);
      const primary = style.getPropertyValue('--primary').trim();
      grad.addColorStop(0, `hsla(${primary}, 0.05)`);
      grad.addColorStop(0.5, `hsla(${primary}, 0.15)`);
      grad.addColorStop(1, `hsla(${primary}, 0.05)`);

      // Draw wave fill
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x++) {
        const y = h / 2 + Math.sin((x + offsetRef.current) * 0.04) * amplitude
          + Math.sin((x + offsetRef.current * 0.7) * 0.02) * (amplitude * 0.5);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw wave line
      const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
      lineGrad.addColorStop(0, `hsla(${primary}, 0.2)`);
      lineGrad.addColorStop(0.3, `hsla(${primary}, 0.8)`);
      lineGrad.addColorStop(0.7, `hsla(${primary}, 0.8)`);
      lineGrad.addColorStop(1, `hsla(${primary}, 0.2)`);

      ctx.beginPath();
      for (let x = 0; x <= w; x++) {
        const y = h / 2 + Math.sin((x + offsetRef.current) * 0.04) * amplitude
          + Math.sin((x + offsetRef.current * 0.7) * 0.02) * (amplitude * 0.5);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glow dot at right edge
      const lastY = h / 2 + Math.sin((w + offsetRef.current) * 0.04) * amplitude
        + Math.sin((w + offsetRef.current * 0.7) * 0.02) * (amplitude * 0.5);
      ctx.beginPath();
      ctx.arc(w - 2, lastY, 4, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${primary})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w - 2, lastY, 8, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${primary}, 0.2)`;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
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
