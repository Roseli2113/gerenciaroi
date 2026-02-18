import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { user_id, session_id, page_url, action } = body;

    if (!user_id || !session_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id or session_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If action is "leave", delete the session
    if (action === 'leave') {
      await supabase.from('live_visitors').delete().eq('session_id', session_id);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get geolocation from IP using free API
    let country = null, region = null, city = null;
    try {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                 req.headers.get('cf-connecting-ip') || '';
      
      if (ip && ip !== '127.0.0.1' && ip !== '::1') {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city&lang=pt-BR`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.country) {
            country = geo.country;
            region = geo.regionName || null;
            city = geo.city || null;
          }
        }
      }
    } catch (e) {
      console.log('Geo lookup failed:', e);
    }

    // Upsert visitor session
    const { error } = await supabase.from('live_visitors').upsert(
      {
        user_id,
        session_id,
        page_url: page_url || null,
        country,
        region,
        city,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'session_id' }
    );

    if (error) {
      console.error('Upsert error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean up stale sessions (older than 60 seconds)
    const cutoff = new Date(Date.now() - 60000).toISOString();
    await supabase.from('live_visitors').delete().lt('last_seen_at', cutoff);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
