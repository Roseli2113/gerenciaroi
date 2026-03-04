import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const { token, email, utm_data, page_url } = body

    if (!token || !email) {
      return new Response(
        JSON.stringify({ error: 'token and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate token exists in webhooks table
    const { data: webhook } = await supabase
      .from('webhooks')
      .select('id')
      .eq('token', token)
      .eq('status', 'active')
      .maybeSingle()

    if (!webhook) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert: if same email + token exists in last 30 min, update it
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: existing } = await supabase
      .from('checkout_tracking')
      .select('id')
      .eq('webhook_token', token)
      .eq('customer_email', email.toLowerCase().trim())
      .gte('created_at', thirtyMinAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('checkout_tracking')
        .update({ utm_data, page_url, created_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('checkout_tracking')
        .insert({
          webhook_token: token,
          customer_email: email.toLowerCase().trim(),
          utm_data: utm_data || {},
          page_url: page_url || null,
        })
    }

    // Cleanup old entries (older than 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('checkout_tracking')
      .delete()
      .lt('created_at', oneDayAgo)

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('track-checkout error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
