import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_SIZE = 25
// Backoff em segundos: 30s, 1min, 2min, 5min, 15min, 30min, 1h, 2h
const BACKOFF_SECONDS = [30, 60, 120, 300, 900, 1800, 3600, 7200]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const nowIso = new Date().toISOString()

    // Pega lote de eventos pendentes prontos
    const { data: events, error } = await supabase
      .from('capi_event_queue')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lte('next_attempt_at', nowIso)
      .lt('attempts', 8)
      .order('next_attempt_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (error) throw error
    if (!events?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let succeeded = 0
    let failed = 0

    for (const evt of events) {
      // Marca como processing para evitar dupla execução
      await supabase
        .from('capi_event_queue')
        .update({ status: 'processing' })
        .eq('id', evt.id)

      // Busca token atualizado do pixel
      const { data: pixelMeta } = await supabase
        .from('pixel_meta_ids')
        .select('token, meta_pixel_id')
        .eq('id', evt.pixel_meta_id_ref)
        .maybeSingle()

      if (!pixelMeta?.token) {
        await supabase
          .from('capi_event_queue')
          .update({
            status: 'failed',
            attempts: evt.attempts + 1,
            last_error: 'Token de acesso CAPI ausente para este pixel',
            next_attempt_at: nextAttemptAt(evt.attempts + 1),
          })
          .eq('id', evt.id)
        failed++
        continue
      }

      try {
        const response = await fetch(
          `https://graph.facebook.com/v21.0/${pixelMeta.meta_pixel_id}/events?access_token=${pixelMeta.token}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [evt.event_payload] }),
          }
        )
        const result = await response.json()

        if (response.ok && !result.error) {
          await supabase
            .from('capi_event_queue')
            .update({
              status: 'sent',
              attempts: evt.attempts + 1,
              sent_at: new Date().toISOString(),
              last_response: result,
              last_error: null,
            })
            .eq('id', evt.id)
          succeeded++
        } else {
          const newAttempts = evt.attempts + 1
          const isFinal = newAttempts >= evt.max_attempts
          await supabase
            .from('capi_event_queue')
            .update({
              status: isFinal ? 'failed' : 'pending',
              attempts: newAttempts,
              last_error: result.error?.message || `HTTP ${response.status}`,
              last_response: result,
              next_attempt_at: nextAttemptAt(newAttempts),
            })
            .eq('id', evt.id)
          failed++
        }
      } catch (err) {
        const newAttempts = evt.attempts + 1
        const isFinal = newAttempts >= evt.max_attempts
        await supabase
          .from('capi_event_queue')
          .update({
            status: isFinal ? 'failed' : 'pending',
            attempts: newAttempts,
            last_error: err instanceof Error ? err.message : String(err),
            next_attempt_at: nextAttemptAt(newAttempts),
          })
          .eq('id', evt.id)
        failed++
      }
    }

    return new Response(
      JSON.stringify({ processed: events.length, succeeded, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Worker error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function nextAttemptAt(attempts: number): string {
  const idx = Math.min(attempts - 1, BACKOFF_SECONDS.length - 1)
  const delay = BACKOFF_SECONDS[Math.max(0, idx)]
  return new Date(Date.now() + delay * 1000).toISOString()
}
