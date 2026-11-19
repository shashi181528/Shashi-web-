import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const rawBody = await request.text()
  const hookSecret = Deno.env.get('SEND_SMS_HOOK_SECRET')
  const textbeeApiKey = Deno.env.get('TEXTBEE_API_KEY')
  if (!hookSecret || !textbeeApiKey) {
    return new Response('SMS delivery is not configured.', { status: 500 })
  }

  let event: { user?: { phone?: string }; sms?: { otp?: string } }
  try {
    const secretValue = hookSecret.replace(/^v1,whsec_/, '')
    const webhook = new Webhook(secretValue)
    event = webhook.verify(rawBody, Object.fromEntries(request.headers)) as typeof event
  } catch {
    return new Response('Invalid Auth Hook signature.', { status: 401 })
  }

  const phone = event.user?.phone
  const otp = event.sms?.otp
  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone) || !otp || !/^\d{4,10}$/.test(otp)) {
    return new Response('The Auth Hook payload is missing a valid phone number or OTP.', { status: 400 })
  }

  const smsResponse = await fetch('https://api.textbee.dev/api/v1/gateway/send-sms', {
    method: 'POST',
    headers: { 'x-api-key': textbeeApiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipients: [phone],
      message: `Your Together We Are verification code is ${otp}. Do not share this code.`
    })
  })

  if (!smsResponse.ok) {
    // Never log or return the API key, OTP, phone number, or upstream response body.
    return new Response('The SMS provider could not queue the verification message.', { status: 502 })
  }

  return new Response(null, { status: 200 })
})
