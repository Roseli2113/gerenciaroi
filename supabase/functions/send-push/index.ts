import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Web Push requires JWT signing with VAPID keys
// We implement the Web Push protocol manually using the Web Crypto API

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { user_id, title, body, url, tag } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)

    if (subError || !subscriptions?.length) {
      console.log('No push subscriptions found for user:', user_id)
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = JSON.stringify({
      title: title || '💰 Nova Venda!',
      body: body || 'Você recebeu uma nova venda!',
      url: url || '/dashboard',
      tag: tag || 'sale-notification',
    })

    let sent = 0
    let failed = 0
    const expiredIds: string[] = []

    for (const sub of subscriptions) {
      try {
        const success = await sendWebPush(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
        )
        if (success) {
          sent++
        } else {
          failed++
          expiredIds.push(sub.id)
        }
      } catch (err) {
        console.error('Push send error:', err)
        failed++
        expiredIds.push(sub.id)
      }
    }

    // Clean up expired/invalid subscriptions
    if (expiredIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expiredIds)
      console.log(`Cleaned up ${expiredIds.length} expired subscriptions`)
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-push error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ---- Web Push Protocol Implementation ----

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64
  const raw = atob(padded)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = ''
  for (const byte of arr) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<boolean> {
  const endpoint = new URL(subscription.endpoint)
  const audience = `${endpoint.protocol}//${endpoint.host}`

  // Create VAPID JWT
  const vapidToken = await createVapidJwt(audience, vapidPublicKey, vapidPrivateKey)
  const vapidKeyBytes = base64UrlToUint8Array(vapidPublicKey)

  // Encrypt payload using Web Push encryption (RFC 8291)
  const { ciphertext, salt, localPublicKey } = await encryptPayload(
    payload,
    subscription.keys.p256dh,
    subscription.keys.auth,
  )

  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    Authorization: `vapid t=${vapidToken}, k=${uint8ArrayToBase64Url(vapidKeyBytes)}`,
    TTL: '86400',
    Urgency: 'high',
  }

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers,
    body: ciphertext,
  })

  if (response.status === 201 || response.status === 200) return true
  if (response.status === 404 || response.status === 410) return false // subscription expired

  const text = await response.text()
  console.error(`Push failed: ${response.status} ${text}`)
  return response.status < 500 ? false : true // don't delete on server errors
}

async function createVapidJwt(audience: string, publicKey: string, privateKey: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' }
  const now = Math.floor(Date.now() / 1000)
  const claims = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: 'mailto:suporte@gerenciaroi.com',
  }

  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)))
  const claimsB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(claims)))
  const unsigned = `${headerB64}.${claimsB64}`

  const privateKeyBytes = base64UrlToUint8Array(privateKey)
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  ).catch(async () => {
    // Try JWK import if PKCS8 fails
    const jwk = await rawPrivateKeyToJwk(privateKeyBytes, publicKey)
    return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  })

  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      new TextEncoder().encode(unsigned),
    ),
  )

  // Convert DER signature to raw r||s format if needed
  const rawSig = derToRaw(signature)
  return `${unsigned}.${uint8ArrayToBase64Url(rawSig)}`
}

async function rawPrivateKeyToJwk(
  privateKeyBytes: Uint8Array,
  publicKeyB64: string,
): Promise<JsonWebKey> {
  const pubBytes = base64UrlToUint8Array(publicKeyB64)
  // Uncompressed public key: 0x04 || x(32) || y(32)
  const x = pubBytes.slice(1, 33)
  const y = pubBytes.slice(33, 65)
  // Private key d is 32 bytes
  const d = privateKeyBytes.length > 32 ? privateKeyBytes.slice(privateKeyBytes.length - 32) : privateKeyBytes

  return {
    kty: 'EC',
    crv: 'P-256',
    x: uint8ArrayToBase64Url(x),
    y: uint8ArrayToBase64Url(y),
    d: uint8ArrayToBase64Url(d),
    ext: true,
  }
}

function derToRaw(signature: Uint8Array): Uint8Array {
  // If already 64 bytes, it's raw
  if (signature.length === 64) return signature
  // DER: 0x30 len 0x02 rLen r 0x02 sLen s
  if (signature[0] !== 0x30) return signature
  let offset = 2
  // R
  const rLen = signature[offset + 1]
  offset += 2
  const r = signature.slice(offset, offset + rLen)
  offset += rLen
  // S
  const sLen = signature[offset + 1]
  offset += 2
  const s = signature.slice(offset, offset + sLen)

  const raw = new Uint8Array(64)
  raw.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32))
  raw.set(s.length > 32 ? s.slice(s.length - 32) : s, 64 - Math.min(s.length, 32))
  return raw
}

// ---- Web Push Encryption (aes128gcm - RFC 8291) ----

async function encryptPayload(
  payload: string,
  clientPublicKeyB64: string,
  clientAuthB64: string,
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const clientPublicKeyBytes = base64UrlToUint8Array(clientPublicKeyB64)
  const clientAuth = base64UrlToUint8Array(clientAuthB64)

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  )

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', localKeyPair.publicKey),
  )

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: clientKey },
      localKeyPair.privateKey,
      256,
    ),
  )

  const salt = crypto.getRandomValues(new Uint8Array(16))

  // HKDF to derive IKM
  const authInfo = concatBuffers(
    new TextEncoder().encode('WebPush: info\0'),
    clientPublicKeyBytes,
    localPublicKeyRaw,
  )

  const ikm = await hkdf(clientAuth, sharedSecret, authInfo, 32)

  // Derive content encryption key and nonce
  const contentEncKeyInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0')
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0')

  const contentEncKey = await hkdf(salt, ikm, contentEncKeyInfo, 16)
  const nonce = await hkdf(salt, ikm, nonceInfo, 12)

  // Encrypt with AES-128-GCM
  const paddedPayload = concatBuffers(new TextEncoder().encode(payload), new Uint8Array([2]))

  const key = await crypto.subtle.importKey('raw', contentEncKey, 'AES-GCM', false, ['encrypt'])
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, paddedPayload),
  )

  // Build aes128gcm header: salt(16) || rs(4) || idlen(1) || keyid(65) || encrypted
  const rs = new ArrayBuffer(4)
  new DataView(rs).setUint32(0, 4096)

  const header = concatBuffers(
    salt,
    new Uint8Array(rs),
    new Uint8Array([localPublicKeyRaw.length]),
    localPublicKeyRaw,
  )

  const ciphertext = concatBuffers(header, encrypted)

  return { ciphertext, salt, localPublicKey: localPublicKeyRaw }
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])

  const prk = new Uint8Array(
    await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), ikm),
  )

  const prkKey = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])

  const infoWithCounter = concatBuffers(info, new Uint8Array([1]))
  const okm = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, infoWithCounter))

  return okm.slice(0, length)
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const buf of buffers) {
    result.set(buf, offset)
    offset += buf.length
  }
  return result
}
