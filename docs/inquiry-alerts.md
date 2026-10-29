# WhatsApp and SMS alerts for new inquiries

The website saves each inquiry first, then processes a separate alert for WhatsApp and SMS. Daily flower alerts include the client's name, phone, flowers, delivery frequency, address, preferred date, budget and message when supplied. Other inquiry types include their relevant fields. These are admin notifications, not messages to customers. No photo/file upload is added.

## Current activation state

The code is implemented, but phone delivery stays off until the owner configures a Twilio account, sender(s), approved WhatsApp template and recipient. No live Twilio delivery has been tested. Mock tests confirm API formatting, not receipt on a phone.

## One-time setup

1. Apply `supabase/migrations/014_inquiry_notifications.sql` in the project's Supabase SQL Editor. This creates the queue and its permissions. It does not create alerts for old inquiries.
2. Create and fund your own Twilio account at https://console.twilio.com/ . Complete sender onboarding. Verify your admin number for trial testing as required by Twilio; trial accounts have delivery restrictions.
3. Register a WhatsApp sender using Twilio's onboarding and obtain approval for the template below. Store its `HX...` Content SID. A regular personal WhatsApp login or a click-to-chat link cannot send these automatic alerts. The sandbox is for connectivity experiments; the production custom template needs the appropriate sender/approval.
4. Configure a supported SMS sender or Messaging Service. Confirm delivery to your admin country with Twilio. For India, check the current international/domestic route requirements; domestic alphanumeric senders require DLT registration. Long SMS messages can be billed as multiple segments. Do not use shortened URLs.
5. Add these server-only values to `.env.local` and your deployment's environment settings. Never put them in `NEXT_PUBLIC_` variables or share secret keys in chat:

   ```dotenv
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_WHATSAPP_FROM=+COUNTRY_CODE_AND_SENDER
   TWILIO_WHATSAPP_CONTENT_SID=HX...
   TWILIO_SMS_FROM=+COUNTRY_CODE_AND_SENDER
   # Or use a Messaging Service instead of SMS_FROM:
   TWILIO_SMS_MESSAGING_SERVICE_SID=MG...
   ```

6. Rebuild/restart the local website, or redeploy after changing hosted environment settings.
7. Sign in as owner, open **Settings**, and edit the business settings. Enter **Admin inquiry alert phone (+country code)** in `+91...` format. Enable the WhatsApp and/or SMS inquiry alert checkboxes and save. These values are stored in private owner settings, not public site settings. The recipient is always this admin number; visitors cannot override it.
8. Open **Inquiries → Admin inquiry alerts** to check readiness. Submit one new test inquiry and verify receipt on the actual admin phone in both channels. Provider acceptance is not proof of delivery. Confirm the approved template and SMS sender work before public launch.

## WhatsApp template

Create an English text template containing these five numbered variables, in this exact order:

```text
Umiya Florist studio alert: a new {{1}} inquiry has been received.
Client name: {{2}}.
Client contact number: {{3}}.
Submitted requirements: {{4}}.
Inquiry reference: {{5}}.
Please review the complete inquiry in Umiya Studio before contacting the client.
```

- `1`: inquiry type, for example `Pooja Flower Subscription`.
- `2`: client name.
- `3`: client phone.
- `4`: labeled submitted fields and message, flattened to one line.
- `5`: first eight characters of the inquiry ID.

Use realistic sample values when requesting approval. Variables contain no line breaks. Very long submissions are shortened with `[More in Umiya Studio]`; the complete original stays in Inquiries. SMS bodies are capped at 1,500 UTF-16 code units, WhatsApp details at 900. Marketing consent is not required to notify your own admin about a customer-initiated inquiry; it remains separate and is never enabled by this feature.

## Queue and recovery

A database trigger creates exactly one job per inquiry/channel in the same transaction as the inquiry insert. Idempotent re-submission creates no additional jobs. `next/server`'s `after()` attempts immediate delivery after the visitor receives the saved confirmation. Failure to contact Twilio does not change the inquiry's saved status.

The owner panel shows pending, sending, off, setup-needed, accepted-by-provider, failed and uncertain states. **Retry alert** is available only for known failures/setup/off states once that channel is ready, with at most five processing attempts. There is no automatic resend of accepted or uncertain messages. Do not treat a successful REST response as delivered or read. Delivery callbacks/reconciliation are not implemented; use Twilio logs to confirm receipt and investigate uncertainty.

A worker crash after a send may leave the outcome unknown. Leases older than five minutes become uncertain on the next worker run; check provider logs before any manual remediation. A retry for an old disabled job sends that old inquiry only when the owner explicitly selects it.

For pending jobs left after a process crash, schedule an HTTPS request to `/api/cron/inquiry-alerts` on your hosting platform. Configure a random server-only `CRON_SECRET` of at least 32 characters, and supply `Authorization: Bearer <CRON_SECRET>`. The endpoint claims at most four pending jobs per run using row locks and skips already-claimed jobs. Choose a scheduler interval supported by your hosting plan; no scheduler is created automatically. Local computers do not deliver while the website/server is stopped. A hosted deployment is needed for continuous availability.

## Primary references

- WhatsApp templates: https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates
- Template variables: https://www.twilio.com/docs/content/using-variables-with-content-api
- Messages API: https://www.twilio.com/docs/messaging/api/message-resource
- India SMS routes: https://www.twilio.com/en-us/guidelines/in/sms
