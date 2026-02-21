import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import logoImg from '@/assets/Logo_gerencia_roi.png';

const SOUND_OPTIONS = [
  { id: 'cash-money', label: 'Cash Money', file: '/sounds/cash-money.mp3' },
  { id: 'cash-register', label: 'Cash Register', file: '/sounds/cash-register.mp3' },
  { id: 'cha-ching', label: 'Cha-Ching', file: '/sounds/cha-ching.mp3' },
] as const;

export type SoundId = typeof SOUND_OPTIONS[number]['id'];

export { SOUND_OPTIONS };

export function useSaleNotification() {
  const { user } = useAuth();
  const [selectedSound, setSelectedSound] = useState<SoundId>('cash-money');
  const [enabled, setEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(() => Notification.permission === 'granted');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const knownSalesRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // Load preference from profile
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('notification_sound')
        .eq('user_id', user.id)
        .single();
      if (data?.notification_sound) {
        setSelectedSound(data.notification_sound as SoundId);
      }
    };
    load();
  }, [user]);

  // Preload audio
  useEffect(() => {
    const sound = SOUND_OPTIONS.find(s => s.id === selectedSound);
    if (sound) {
      audioRef.current = new Audio(sound.file);
      audioRef.current.preload = 'auto';
    }
  }, [selectedSound]);

  // Save preference
  const updateSound = async (soundId: SoundId) => {
    setSelectedSound(soundId);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ notification_sound: soundId })
      .eq('user_id', user.id);
  };

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') { setPushEnabled(true); return true; }
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    const granted = result === 'granted';
    setPushEnabled(granted);
    return granted;
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, icon: logoImg, badge: logoImg, silent: true });
    } catch { /* mobile Safari may not support */ }
  }, []);

  const playSound = () => {
    if (!enabled || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const previewSound = (soundId: SoundId) => {
    const sound = SOUND_OPTIONS.find(s => s.id === soundId);
    if (!sound) return;
    const audio = new Audio(sound.file);
    audio.play().catch(() => {});
  };

  // Listen for new sales via realtime
  useEffect(() => {
    if (!user) return;

    // Load existing sale IDs first to avoid playing on page load
    const loadExisting = async () => {
      const { data } = await supabase
        .from('sales')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) {
        data.forEach(s => knownSalesRef.current.add(s.id));
      }
      initialLoadDone.current = true;
    };
    loadExisting();

    const channel = supabase
      .channel('sale-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!initialLoadDone.current) return;
          const newSale = payload.new as any;
          if (knownSalesRef.current.has(newSale.id)) return;
          knownSalesRef.current.add(newSale.id);

          // Play sound and show toast + browser notification
          playSound();
          const amount = Number(newSale.amount || 0);
          const title = `💰 Nova venda: R$ ${amount.toFixed(2)}`;
          const body = newSale.customer_name || newSale.platform || 'Venda recebida!';
          toast.success(title, { description: body, duration: 6000 });
          showBrowserNotification(title, body);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, enabled, selectedSound, showBrowserNotification]);

  return {
    selectedSound,
    updateSound,
    enabled,
    setEnabled,
    previewSound,
    pushEnabled,
    requestPushPermission,
    SOUND_OPTIONS,
  };
}
