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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const webhookToken = url.searchParams.get('token') || req.headers.get('x-webhook-token')
    let platform = url.searchParams.get('platform') || 'unknown'

    const payload: LowifyPayload = await req.json()

    console.log('Received webhook:', { platform, payload })

    let webhookConfig = null
    let userId = null

    if (webhookToken) {
      const { data: webhook, error: webhookError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('token', webhookToken)
        .eq('status', 'active')
        .single()

      if (webhookError) {
        console.error('Webhook lookup error:', webhookError)
      } else {
        webhookConfig = webhook
        userId = webhook.user_id
        if (!url.searchParams.get('platform')) {
          platform = webhook.platform
        }
      }
    }

    if (!userId) {
      console.error('No valid webhook configuration found')
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook configuration not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    if (saleData.transaction_id) {
      const { data: existing } = await supabase
        .from('sales')
        .select('id')
        .eq('user_id', userId)
        .eq('transaction_id', saleData.transaction_id)
        .maybeSingle()
      if (existing) existingId = existing.id
    }

    if (!existingId && saleData.customer_email && saleData.product_id) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const { data: existing } = await supabase
        .from('sales')
        .select('id')
        .eq('user_id', userId)
        .eq('customer_email', saleData.customer_email)
        .eq('product_id', saleData.product_id)
        .gte('created_at', thirtyMinAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (existing) existingId = existing.id
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

    // Send push notification for new approved sales
    if (!existingId && saleData.status === 'approved') {
      try {
        const amount = Number(saleData.amount || 0)
        const pushPayload = {
          user_id: userId,
          title: `💰 Nova venda: R$ ${amount.toFixed(2)}`,
          body: saleData.customer_name || saleData.platform || 'Venda recebida!',
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
      } catch (pushErr) {
        console.error('Push notification error:', pushErr)
      }
    }

    // Fire Meta CAPI Purchase event if sale is approved
    if (saleData.status === 'approved') {
      await sendCapiEvent(supabase, userId, 'Purchase', {
        value: saleData.amount,
        currency: saleData.currency || 'BRL',
        email: saleData.customer_email,
        phone: saleData.customer_phone,
        transactionId: saleData.transaction_id,
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
  data: { value: number; currency: string; email?: string | null; phone?: string | null; transactionId?: string | null }
) {
  try {
    // Get user's pixel configurations with tokens
    const { data: pixels, error: pixelError } = await supabase
      .from('pixels')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (pixelError || !pixels?.length) {
      console.log('No active pixels found for CAPI, skipping')
      return
    }

    for (const pixel of pixels) {
      const { data: metaPixels, error: metaError } = await supabase
        .from('pixel_meta_ids')
        .select('meta_pixel_id, token')
        .eq('pixel_id', pixel.id)

      if (metaError || !metaPixels?.length) continue

      for (const mp of metaPixels) {
        if (!mp.token || !mp.meta_pixel_id) continue

        const eventData: Record<string, unknown> = {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_id: data.transactionId || `${eventName}_${Date.now()}`,
          user_data: {},
          custom_data: {
            value: data.value,
            currency: data.currency,
          },
        }

        // Hash user data for CAPI (SHA-256)
        const userData: Record<string, string> = {}
        if (data.email) {
          userData.em = await hashSha256(data.email.toLowerCase().trim())
        }
        if (data.phone) {
          const cleanPhone = data.phone.replace(/\D/g, '')
          if (cleanPhone) userData.ph = await hashSha256(cleanPhone)
        }
        eventData.user_data = userData

        try {
          const response = await fetch(
            `https://graph.facebook.com/v21.0/${mp.meta_pixel_id}/events?access_token=${mp.token}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: [eventData] }),
            }
          )
          const result = await response.json()
          console.log(`CAPI ${eventName} sent to pixel ${mp.meta_pixel_id}:`, result)
        } catch (fetchErr) {
          console.error(`CAPI ${eventName} failed for pixel ${mp.meta_pixel_id}:`, fetchErr)
        }
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
