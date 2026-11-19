# Send sign-in OTPs with TextBee

The site already requests and verifies phone OTPs through Supabase Auth. This Edge Function replaces only the SMS delivery step: Supabase still generates and verifies the OTP; TextBee delivers it through your paired, enabled Android phone. TextBee uses the account's default device unless you add a device ID to the function.

## 1. Keep the API key private

Do not paste the TextBee key into `script.js`, `supabase-config.js`, `.env` committed to Git, or any website setting prefixed with `NEXT_PUBLIC_`. It grants access to the TextBee account. In Supabase Dashboard, open **Edge Functions → Secrets** and add:

| Name | Value |
| --- | --- |
| `TEXTBEE_API_KEY` | The TextBee key supplied by the project owner |
| `SEND_SMS_HOOK_SECRET` | The signing secret created in the Send SMS Auth Hook settings in step 3 |

## 2. Deploy the Edge Function

From this repository folder, authenticate the Supabase CLI and deploy the function:

```sh
npx supabase login
npx supabase link --project-ref wsqrjjittsatmrjiwlzt
npx supabase functions deploy textbee-send-sms
```

The function is configured with JWT verification disabled because Supabase Auth signs its hook requests using the hook secret. The function verifies that signature before sending any SMS.

## 3. Connect the Supabase Auth hook

In Supabase Dashboard, open **Authentication → Hooks → Send SMS**, enable the hook, and set its URI to:

```text
https://wsqrjjittsatmrjiwlzt.supabase.co/functions/v1/textbee-send-sms
```

Create or copy the hook signing secret, save the same secret as `SEND_SMS_HOOK_SECRET` in Edge Function Secrets, then save the hook settings. Enable Phone sign-in under **Authentication → Providers**. The existing site `/auth/v1/otp` and `/auth/v1/verify` calls then use this hook automatically.

TextBee must have a verified account and an enabled, online default device. A successful TextBee response means the SMS was queued; the phone and SIM still need to be available to send it.
