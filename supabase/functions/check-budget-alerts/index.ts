import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META_API_VERSION = 'v21.0'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all active budget alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('budget_alerts')
      .select('*')
      .eq('is_active', true)

    if (alertsError) throw alertsError
    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No active alerts' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${alerts.length} active budget alerts`)

    let triggered = 0
    let checked = 0

    // Group alerts by user to fetch their meta connection once
    const alertsByUser = new Map<string, typeof alerts>()
    for (const a of alerts) {
      if (!alertsByUser.has(a.user_id)) alertsByUser.set(a.user_id, [])
      alertsByUser.get(a.user_id)!.push(a)
    }

    for (const [userId, userAlerts] of alertsByUser) {
      // Get user's meta connection
      const { data: connection } = await supabase
        .from('meta_connections')
        .select('access_token, expires_at')
        .eq('user_id', userId)
        .maybeSingle()

      if (!connection?.access_token) {
        console.log(`User ${userId} has no meta connection, skipping`)
        continue
      }

      const expiresAt = new Date(connection.expires_at).getTime()
      if (expiresAt < Date.now()) {
        console.log(`User ${userId} meta token expired, skipping`)
        continue
      }

      for (const alert of userAlerts) {
        if (!alert.account_id) continue
        checked++

        try {
          // Fetch current spend from Meta API
          const url = `https://graph.facebook.com/${META_API_VERSION}/act_${alert.account_id}/insights?fields=spend&date_preset=maximum&access_token=${connection.access_token}`
          const resp = await fetch(url)
          const data = await resp.json()

          if (!resp.ok) {
            console.error(`Meta API error for account ${alert.account_id}:`, data)
            continue
          }

          const spend = Number(data?.data?.[0]?.spend ?? 0)
          const pct = alert.budget_amount > 0 ? (spend / alert.budget_amount) * 100 : 0

          // Update last_spent
          await supabase
            .from('budget_alerts')
            .update({ last_spent: spend })
            .eq('id', alert.id)

          // Check if threshold reached and not recently alerted
          if (pct >= alert.alert_threshold) {
            const lastAlertSent = alert.last_alert_sent_at
              ? new Date(alert.last_alert_sent_at).getTime()
              : 0
            const hoursSinceAlert = (Date.now() - lastAlertSent) / (1000 * 60 * 60)

            // Only re-alert every 6 hours
            if (hoursSinceAlert >= 6) {
              const accountLabel = alert.account_name || `Conta ${alert.account_id}`
              await supabase.functions.invoke('send-push', {
                body: {
                  user_id: userId,
                  title: '⚠️ Saldo de Anúncios Acabando',
                  body: `${accountLabel}: R$ ${spend.toFixed(2)} de R$ ${alert.budget_amount.toFixed(2)} (${pct.toFixed(0)}%)`,
                  url: '/notifications',
                  tag: `budget-alert-${alert.id}`,
                },
              })

              await supabase
                .from('budget_alerts')
                .update({ last_alert_sent_at: new Date().toISOString() })
                .eq('id', alert.id)

              triggered++
              console.log(`Triggered alert for user ${userId}, account ${alert.account_id}`)
            }
          }
        } catch (err) {
          console.error(`Error processing alert ${alert.id}:`, err)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, checked, triggered }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('check-budget-alerts error:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
