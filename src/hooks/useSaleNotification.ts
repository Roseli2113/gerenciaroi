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

// Convert a base64 URL string to Uint8Array (for applicationServerKey)
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useSaleNotification() {
  const { user } = useAuth();
  const [selectedSound, setSelectedSound] = useState<SoundId>('cash-money');
  const [enabled, setEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const knownSalesRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // Check push status on mount - verify actual subscription exists
  useEffect(() => {
    const checkPush = async () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        setPushEnabled(false);
        return;
      }
      // Check if we have an active push subscription on our SW
      try {
        const reg = await navigator.serviceWorker.getRegistration('/push-handler');
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          setPushEnabled(!!sub);
        } else {
          setPushEnabled(false);
        }
      } catch {
        setPushEnabled(false);
      }
    };
    checkPush();
  }, []);

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

  // Register push subscription via PushManager (real Web Push)
  const registerPushSubscription = useCallback(async () => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    
    try {
      // Register the push service worker separately (won't conflict with PWA SW)
      const registration = await navigator.serviceWorker.register('/sw-push.js', { scope: '/push-handler' });
      
      // Wait for it to be active
      const sw = registration.installing || registration.waiting || registration.active;
      if (sw && sw.state !== 'activated') {
        await new Promise<void>((resolve) => {
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated') resolve();
          });
          if (sw.state === 'activated') resolve();
        });
      }

      // Get VAPID public key from env
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID_PUBLIC_KEY not configured');
        return false;
      }

      // Subscribe using THIS registration's pushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        console.error('Invalid subscription');
        return false;
      }

      // Save to database (upsert by endpoint)
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('endpoint', subJson.endpoint)
        .maybeSingle();

      if (existing) {
        // Already saved
        return true;
      }

      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      });

      if (error) {
        console.error('Error saving push subscription:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Push subscription error:', err);
      return false;
    }
  }, [user]);

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    setPushLoading(true);
    
    try {
      if (Notification.permission === 'granted') {
        setPushEnabled(true);
        await registerPushSubscription();
        return true;
      }
      if (Notification.permission === 'denied') {
        setPushLoading(false);
        return false;
      }
      
      const result = await Notification.requestPermission();
      const granted = result === 'granted';
      setPushEnabled(granted);
      
      if (granted) {
        await registerPushSubscription();
      }
      
      return granted;
    } finally {
      setPushLoading(false);
    }
  }, [registerPushSubscription]);

  // Auto-register subscription when push is already granted
  useEffect(() => {
    if (pushEnabled && user) {
      registerPushSubscription();
    }
  }, [pushEnabled, user, registerPushSubscription]);

  const sendTestPush = useCallback(async () => {
    if (!user) return;
    
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/send-push`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          title: '🔔 Teste - Gerencia ROI',
          body: '💰 Nova venda de R$ 99,90 recebida! Este é um teste.',
          url: '/dashboard',
          tag: 'test-notification',
        }),
      }
    );

    const result = await response.json();
    return result;
  }, [user]);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, icon: logoImg, badge: logoImg });
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

  // Listen for SW messages to play sound when push notification arrives
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PLAY_SALE_SOUND') {
        playSound();
        const sale = event.data.sale;
        if (sale?.body) {
          toast.success(sale.title || '💰 Nova venda!', { description: sale.body, duration: 6000 });
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handler);
    };
  }, [enabled, selectedSound]);

  // Listen for new sales via realtime
  useEffect(() => {
    if (!user) return;

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
    pushLoading,
    requestPushPermission,
    sendTestPush,
    SOUND_OPTIONS,
  };
}
