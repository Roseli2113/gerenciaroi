import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LowifyPayload {
  id?: string | number;
  sale_id?: string;
  event?: string;
  transaction_id?: string;
  order_id?: string;
  status?: string;
  sale_amount?: number;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  buyer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  product?: {
    id?: string | number;
    name?: string;
    price?: number;
  };
  offer?: {
    id?: string | number;
    name?: string;
  };
  payment?: {
    amount?: number;
    currency?: string;
    method?: string;
  };
  value?: number;
  price?: number;
  amount?: number;
  currency?: string;
  payment_type?: string;
  commission?: number;
  [key: string]: unknown;
}

async function logWebhookEvent(
  supabase: ReturnType<typeof createClient>,
  entry: {
    user_id?: string | null;
    platform?: string | null;
    token_hint?: string | null;
    status: string;
    http_status?: number | null;
    message?: string | null;
    sale_id?: string | null;
    payload?: unknown;
    headers?: Record<string, string> | null;
  }
) {
  try {
    await supabase.from('webhook_logs').insert({
      user_id: entry.user_id ?? null,
      platform: entry.platform ?? null,
      token_hint: entry.token_hint ?? null,
      status: entry.status,
      http_status: entry.http_status ?? null,
      message: entry.message ?? null,
      sale_id: entry.sale_id ?? null,
      payload: entry.payload ?? null,
      headers: entry.headers ?? null,
    })
  } catch (err) {
    console.error('Failed to write webhook log:', err)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const safeHeaders: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase()
    safeHeaders[k] = (k === 'authorization' || k === 'x-api-key' || k === 'x-webhook-token')
      ? `${value.slice(0, 8)}…`
      : value
  })

  try {
    const url = new URL(req.url)
    const authHeader = req.headers.get('authorization') || ''
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : null
    let platform = url.searchParams.get('platform') || 'unknown'

    const rawBody = await req.text()
    let payload: LowifyPayload
    try {
      payload = JSON.parse(rawBody || '{}')
    } catch {
      await logWebhookEvent(supabase, {
        platform,
        status: 'error',
        http_status: 400,
        message: 'Payload inválido (não é JSON)',
        payload: { raw: rawBody.slice(0, 5000) },
        headers: safeHeaders,
      })
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    const webhookToken =
      url.searchParams.get('token') ||
      req.headers.get('x-webhook-token') ||
      req.headers.get('x-api-key') ||
      (typeof (payload as Record<string, unknown>).api_key === 'string'
        ? (payload as Record<string, unknown>).api_key as string
        : null) ||
      (typeof (payload as Record<string, unknown>).token === 'string'
        ? (payload as Record<string, unknown>).token as string
        : null) ||
      (bearerToken && !bearerToken.includes('.') ? bearerToken : null)

    console.log('Received webhook:', { platform, hasToken: !!webhookToken, payload })


    let webhookConfig = null
    let userId = null

    if (webhookToken) {
      const { data: webhook, error: webhookError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('token', webhookToken)
        .eq('status', 'active')
        .maybeSingle()

      if (webhookError) {
        console.error('Webhook lookup error:', webhookError)
      }

      if (webhook) {
        webhookConfig = webhook
        userId = webhook.user_id
        if (!url.searchParams.get('platform')) {
          platform = webhook.platform
        }
      } else {
        // Fallback: token may be an API credential (e.g. AdsROI "Chave da API")
        const { data: credential, error: credError } = await supabase
          .from('api_credentials')
          .select('id, user_id')
          .eq('token', webhookToken)
          .eq('status', 'active')
          .maybeSingle()

        if (credError) console.error('API credential lookup error:', credError)

        if (credential) {
          userId = credential.user_id
          if (!url.searchParams.get('platform')) {
            platform = 'adsroi'
          }
          console.log('Authenticated via api_credentials:', credential.id)
        }
      }
    }


    if (!userId) {
      console.error('No valid webhook configuration found')
      // Try to resolve an owner (even if inactive) so the log is visible to the user
      let fallbackUser: string | null = null
      if (webhookToken) {
        const { data: anyWebhook } = await supabase
          .from('webhooks').select('user_id').eq('token', webhookToken).maybeSingle()
        fallbackUser = anyWebhook?.user_id ?? null
        if (!fallbackUser) {
          const { data: anyCred } = await supabase
            .from('api_credentials').select('user_id').eq('token', webhookToken).maybeSingle()
          fallbackUser = anyCred?.user_id ?? null
        }
      }
      await logWebhookEvent(supabase, {
        user_id: fallbackUser,
        platform,
        token_hint: webhookToken ? `${webhookToken.slice(0, 8)}…` : null,
        status: 'error',
        http_status: 400,
        message: webhookToken
          ? 'Token/chave não encontrado ou inativo'
          : 'Nenhum token/chave enviado na requisição',
        payload,
        headers: safeHeaders,
      })
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook configuration not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await logWebhookEvent(supabase, {
      user_id: userId,
      platform,
      token_hint: webhookToken ? `${webhookToken.slice(0, 8)}…` : null,
      status: 'received',
      message: 'Evento recebido',
      payload,
      headers: safeHeaders,
    })


    const saleData = await parseSaleData(platform.toLowerCase(), payload, userId, webhookConfig?.id)

    // If no campaign_id was extracted, try to look it up from checkout_tracking
    if (!saleData.campaign_id && saleData.customer_email && webhookConfig?.token) {
      try {
        const thirtyMinAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour window
        const { data: tracking } = await supabase
          .from('checkout_tracking')
          .select('utm_data')
          .eq('webhook_token', webhookConfig.token)
          .eq('customer_email', (saleData.customer_email as string).toLowerCase().trim())
          .gte('created_at', thirtyMinAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (tracking?.utm_data) {
          const utmData = tracking.utm_data as Record<string, string>
          const recoveredCampaignId = extractIdFromUtm(utmData.utm_campaign)
          if (recoveredCampaignId) {
            saleData.campaign_id = recoveredCampaignId
            console.log('Recovered campaign_id from checkout_tracking:', recoveredCampaignId)
          }
          // Also inject UTMs into raw_data for attribution
          if (saleData.raw_data && typeof saleData.raw_data === 'object') {
            (saleData.raw_data as Record<string, unknown>).tracking = utmData
          }
        }
      } catch (lookupErr) {
        console.error('Checkout tracking lookup error:', lookupErr)
      }
    }

    // Dedup logic
    let sale = null
    let saleError = null
    let existingId: string | null = null
    let existingStatus: string | null = null

    if (saleData.transaction_id) {
      const { data: existing } = await supabase
        .from('sales')
        .select('id, status')
        .eq('user_id', userId)
        .eq('transaction_id', saleData.transaction_id)
        .maybeSingle()
      if (existing) {
        existingId = existing.id
        existingStatus = existing.status
      }
    }

    if (!existingId && saleData.customer_email && saleData.product_id) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const { data: existing } = await supabase
        .from('sales')
        .select('id, status')
        .eq('user_id', userId)
        .eq('customer_email', saleData.customer_email)
        .eq('product_id', saleData.product_id)
        .gte('created_at', thirtyMinAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (existing) {
        existingId = existing.id
        existingStatus = existing.status
      }
    }

    if (existingId) {
      const { data, error } = await supabase
        .from('sales')
        .update({
          status: saleData.status,
          raw_data: saleData.raw_data,
          amount: saleData.amount,
          currency: saleData.currency,
          payment_method: saleData.payment_method,
          transaction_id: saleData.transaction_id,
        })
        .eq('id', existingId)
        .select()
        .single()
      sale = data
      saleError = error
    } else {
      const { data, error } = await supabase.from('sales').insert(saleData).select().single()
      sale = data
      saleError = error
    }

    if (saleError) {
      console.error('Error inserting sale:', saleError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save sale data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Sale recorded:', sale)

    // Send push notification based on user preferences
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('sale_notif_send_pending, sale_notif_send_approved, sale_notif_sale_value, sale_notif_product_name, sale_notif_utm_campaign, sale_notif_dashboard_name')
        .eq('user_id', userId)
        .single()

      const prefs = {
        sendPending: profile?.sale_notif_send_pending ?? 'disabled',
        sendApproved: profile?.sale_notif_send_approved ?? 'enabled',
        saleValue: profile?.sale_notif_sale_value ?? 'total',
        productName: profile?.sale_notif_product_name ?? 'hide',
        utmCampaign: profile?.sale_notif_utm_campaign ?? 'hide',
        dashboardName: profile?.sale_notif_dashboard_name ?? 'hide',
      }

      const shouldNotify =
        (!existingId && saleData.status === 'approved' && prefs.sendApproved === 'enabled') ||
        (!existingId && saleData.status === 'pending' && prefs.sendPending === 'enabled') ||
        (!!existingId && existingStatus !== 'approved' && saleData.status === 'approved' && prefs.sendApproved === 'enabled')

      if (shouldNotify) {
        const amount = Number(saleData.amount || 0)
        const commission = Number(saleData.commission || 0)
        const isApproved = saleData.status === 'approved'

        // Build title
        let title = isApproved ? '💰 Venda aprovada!' : '⏳ Venda pendente!'

        // Build body parts
        const bodyParts: string[] = []

        if (prefs.saleValue !== 'hide') {
          const displayAmount = prefs.saleValue === 'net' ? (amount - commission) : amount
          bodyParts.push(`Valor: R$ ${displayAmount.toFixed(2)}`)
        }

        if (prefs.productName === 'show' && saleData.product_name) {
          bodyParts.push(`Produto: ${saleData.product_name}`)
        }

        if (prefs.utmCampaign === 'show' && saleData.campaign_id) {
          bodyParts.push(`Campanha: ${saleData.campaign_id}`)
        }

        if (prefs.dashboardName === 'show' && saleData.platform) {
          bodyParts.push(`Dashboard: ${saleData.platform}`)
        }

        const body = bodyParts.length > 0 ? bodyParts.join(' • ') : (saleData.customer_name || 'Venda recebida!')

        const pushPayload = {
          user_id: userId,
          title,
          body,
          url: '/dashboard',
          tag: `sale-${sale.id}`,
        }
        await fetch(`${supabaseUrl}/functions/v1/send-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(pushPayload),
        })
        console.log('Push notification sent for sale:', sale.id)
      }
    } catch (pushErr) {
      console.error('Push notification error:', pushErr)
    }

    // Fire Meta CAPI Purchase for approved sales
    if (saleData.status === 'approved') {
      await sendCapiEvent(supabase, userId, 'Purchase', {
        value: saleData.amount,
        currency: saleData.currency || 'BRL',
        email: saleData.customer_email,
        phone: saleData.customer_phone,
        transactionId: saleData.transaction_id,
        saleId: sale.id,
      })
    }

    // Fire Meta CAPI InitiateCheckout for pending payments (checkout started)
    if (saleData.status === 'pending') {
      await sendCapiEvent(supabase, userId, 'InitiateCheckout', {
        value: saleData.amount,
        currency: saleData.currency || 'BRL',
        email: saleData.customer_email,
        phone: saleData.customer_phone,
        transactionId: saleData.transaction_id,
        saleId: sale.id,
      })
    }

    return new Response(
      JSON.stringify({ success: true, sale_id: sale.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ---- Meta Conversions API (CAPI) ----

async function sendCapiEvent(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  eventName: string,
  data: { value: number; currency: string; email?: string | null; phone?: string | null; transactionId?: string | null; saleId?: string | null }
) {
  try {
    const { data: pixels, error: pixelError } = await supabase
      .from('pixels')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (pixelError || !pixels?.length) {
      console.log('No active pixels found for CAPI, skipping')
      return
    }

    const queueRows: Record<string, unknown>[] = []

    for (const pixel of pixels) {
      const { data: metaPixels } = await supabase
        .from('pixel_meta_ids')
        .select('id, meta_pixel_id, token')
        .eq('pixel_id', pixel.id)

      if (!metaPixels?.length) continue

      for (const mp of metaPixels) {
        if (!mp.meta_pixel_id) continue

        const userData: Record<string, string> = {}
        if (data.email) userData.em = await hashSha256(data.email.toLowerCase().trim())
        if (data.phone) {
          const cleanPhone = data.phone.replace(/\D/g, '')
          if (cleanPhone) userData.ph = await hashSha256(cleanPhone)
        }

        const eventPayload = {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_id: data.transactionId || `${eventName}_${Date.now()}_${mp.meta_pixel_id}`,
          user_data: userData,
          custom_data: { value: data.value, currency: data.currency },
        }

        queueRows.push({
          user_id: userId,
          sale_id: data.saleId ?? null,
          pixel_meta_id_ref: mp.id,
          meta_pixel_id: mp.meta_pixel_id,
          event_name: eventName,
          event_payload: eventPayload,
          status: 'pending',
          next_attempt_at: new Date().toISOString(),
        })
      }
    }

    if (queueRows.length) {
      const { error: insErr } = await supabase.from('capi_event_queue').insert(queueRows)
      if (insErr) console.error('Failed to enqueue CAPI events:', insErr)
      else console.log(`Enqueued ${queueRows.length} CAPI ${eventName} events`)

      // Dispara worker imediatamente (fire-and-forget)
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        fetch(`${supabaseUrl}/functions/v1/capi-queue-worker`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceKey}`,
          },
        }).catch((e) => console.error('Worker trigger failed:', e))
      } catch (e) {
        console.error('Worker trigger error:', e)
      }
    }
  } catch (err) {
    console.error('sendCapiEvent error:', err)
  }
}

async function hashSha256(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ---- Sale Parsing ----

function extractIdFromUtm(utmValue: string | null | undefined): string | null {
  if (!utmValue) return null
  const parts = utmValue.split('|')
  if (parts.length >= 2) {
    const id = parts[parts.length - 1].trim()
    return id || null
  }
  return null
}

function getTrackingObject(payload: LowifyPayload): Record<string, unknown> {
  const raw = payload as Record<string, unknown>
  // Check nested objects where platforms may place UTM data
  for (const key of ['tracking', 'utm_params', 'utms', 'metadata']) {
    if (raw[key] && typeof raw[key] === 'object') {
      const obj = raw[key] as Record<string, unknown>
      if (obj.utm_campaign || obj.utm_source || obj.utm_medium) {
        return obj
      }
    }
  }
  return raw
}

function extractCampaignId(payload: LowifyPayload): string | null {
  const tracking = getTrackingObject(payload)
  
  // Try utm_campaign in "Name|ID" format first
  const fromUtm = extractIdFromUtm(tracking.utm_campaign as string)
  if (fromUtm) return fromUtm
  
  // Try utm_medium and utm_content as fallback
  const fromMedium = extractIdFromUtm(tracking.utm_medium as string)
  if (fromMedium) return fromMedium
  
  const fromContent = extractIdFromUtm(tracking.utm_content as string)
  if (fromContent) return fromContent

  // Try tracking.campaign_id directly (some platforms pass numeric Meta campaign IDs here)
  const trackingCampaignId = tracking.campaign_id
  if (trackingCampaignId && String(trackingCampaignId).length > 8) {
    return String(trackingCampaignId)
  }

  return null
}

function detectCurrency(payload: LowifyPayload): string {
  // Check explicit currency fields
  if (payload.payment?.currency) return payload.payment.currency.toUpperCase()
  const raw = payload as Record<string, unknown>
  if (typeof raw.currency === 'string' && raw.currency) return (raw.currency as string).toUpperCase()
  // Default to BRL
  return 'BRL'
}

async function getUsdToBrlRate(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    const data = await res.json()
    if (data?.rates?.BRL) return data.rates.BRL
  } catch (err) {
    console.error('Exchange rate fetch error:', err)
  }
  // Fallback rate if API fails
  return 5.25
}

async function convertToBrl(amount: number, currency: string): Promise<{ amount: number; currency: string }> {
  if (currency === 'BRL' || !currency) return { amount, currency: 'BRL' }
  if (currency === 'USD') {
    const rate = await getUsdToBrlRate()
    const converted = Math.round(amount * rate * 100) / 100
    console.log(`Converting USD ${amount} to BRL ${converted} (rate: ${rate})`)
    return { amount: converted, currency: 'BRL' }
  }
  // For other currencies, keep original
  return { amount, currency }
}

async function parseSaleData(platform: string, payload: LowifyPayload, userId: string, webhookId: string | null) {
  const campaignId = extractCampaignId(payload)
  const originalCurrency = detectCurrency(payload)

  const baseData = {
    user_id: userId,
    webhook_id: webhookId,
    platform: platform,
    raw_data: payload,
    campaign_id: campaignId,
  }

  let rawAmount: number
  let saleData: Record<string, unknown>

  switch (platform) {
    case 'lowify':
      rawAmount = payload.sale_amount || payload.product?.price || payload.payment?.amount || payload.value || payload.price || 0
      saleData = {
        ...baseData,
        transaction_id: payload.sale_id?.toString() || payload.transaction_id || payload.order_id || payload.id?.toString() || null,
        status: mapStatus(payload.status || payload.event || 'unknown'),
        customer_name: payload.customer?.name || payload.buyer?.name || null,
        customer_email: payload.customer?.email || payload.buyer?.email || null,
        customer_phone: payload.customer?.phone || payload.buyer?.phone || null,
        product_name: payload.product?.name || payload.offer?.name || null,
        product_id: payload.product?.id?.toString() || payload.offer?.id?.toString() || null,
        amount: rawAmount,
        currency: originalCurrency,
        payment_method: payload.payment?.method || payload.payment_type || null,
        commission: payload.commission || 0,
      }
      break

    case 'adsroi': {
      // AdsROI envia o comprador em `buyer` e pode enviar UTMs em `tracking`/`utm_params`/`metadata`
      // ou como campos top-level (utm_source, utm_campaign, ...). Normalizamos para `raw_data.tracking`
      // para que useSalesAttribution consiga atribuir.
      const rawPayload = payload as Record<string, unknown>
      const tracking = getTrackingObject(payload)
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
      const collected: Record<string, unknown> = {}
      for (const k of utmKeys) {
        const val = (tracking as Record<string, unknown>)[k] ?? rawPayload[k]
        if (val) collected[k] = val
      }
      if (Object.keys(collected).length > 0) {
        (baseData.raw_data as Record<string, unknown>).tracking = {
          ...(typeof (baseData.raw_data as Record<string, unknown>).tracking === 'object'
            ? (baseData.raw_data as Record<string, unknown>).tracking as Record<string, unknown>
            : {}),
          ...collected,
        }
      }

      rawAmount = payload.payment?.amount || payload.amount || payload.value || payload.price || 0
      saleData = {
        ...baseData,
        transaction_id: payload.transaction_id || payload.sale_id?.toString() || payload.order_id || payload.id?.toString() || null,
        status: mapStatus(payload.status || payload.event || 'unknown'),
        customer_name: payload.buyer?.name || payload.customer?.name || null,
        customer_email: payload.buyer?.email || payload.customer?.email || null,
        customer_phone: payload.buyer?.phone || payload.customer?.phone || null,
        product_name: payload.product?.name || payload.offer?.name || null,
        product_id: payload.product?.id?.toString() || payload.offer?.id?.toString() || null,
        amount: rawAmount,
        currency: originalCurrency,
        payment_method: payload.payment?.method || payload.payment_type || null,
        commission: payload.commission || 0,
      }
      break
    }

    default:
      rawAmount = payload.payment?.amount || payload.amount || payload.value || 0
      saleData = {
        ...baseData,
        transaction_id: payload.sale_id?.toString() || payload.transaction_id || payload.id?.toString() || null,
        status: mapStatus(payload.status || payload.event || 'unknown'),
        customer_name: payload.customer?.name || null,
        customer_email: payload.customer?.email || null,
        customer_phone: payload.customer?.phone || null,
        product_name: payload.product?.name || null,
        product_id: payload.product?.id?.toString() || null,
        amount: rawAmount,
        currency: originalCurrency,
        payment_method: payload.payment?.method || null,
        commission: payload.commission || 0,
      }
      break
  }

  // Convert foreign currencies to BRL
  const converted = await convertToBrl(rawAmount, originalCurrency)
  saleData.amount = converted.amount
  saleData.currency = converted.currency

  return saleData
}

function mapStatus(status: string): string {
  const statusLower = status.toLowerCase()
  
  if (['pending', 'waiting', 'awaiting', 'waiting_payment', 'pix_pending'].some(s => statusLower.includes(s))) {
    return 'pending'
  }
  if (['refunded', 'refund', 'chargeback', 'chargedback', 'dispute'].some(s => statusLower.includes(s))) {
    return 'refunded'
  }
  if (['cancelled', 'canceled', 'expired', 'abandoned'].some(s => statusLower.includes(s))) {
    return 'cancelled'
  }
  if (['approved', 'paid', 'confirmed', 'completed'].some(s => statusLower.includes(s))) {
    return 'approved'
  }
  if (['purchase', 'sale'].some(s => statusLower.includes(s))) {
    return 'approved'
  }
  
  return statusLower
}
