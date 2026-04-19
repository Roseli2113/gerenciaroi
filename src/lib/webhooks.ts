const FALLBACK_SUPABASE_URL = 'https://zwylxoajyyjflvvcwpvz.supabase.co';

export const buildWebhookUrl = (platform: string, token: string, event?: string) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL ?? FALLBACK_SUPABASE_URL;
  const params = new URLSearchParams({
    platform: platform.toLowerCase(),
    token,
  });

  if (event) {
    params.set('event', event);
  }

  return `${baseUrl}/functions/v1/webhook-receiver?${params.toString()}`;
};