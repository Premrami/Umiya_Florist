# Integrations and external setup

## Supabase

The SSR client uses cookie storage, server-side user verification and a Next.js session-refresh proxy. User-bound queries rely on RLS. Public inquiry writes use a restricted server-only RPC and a salted hash rate key. Production assumes Vercel controls `x-vercel-forwarded-for`; another host must supply a trusted proxy adapter. Without a trusted host, the local fallback is a shared rate bucket, never arbitrary forwarded-header trust.

No actual Supabase project, Auth email, Storage upload or PostgREST request has been verified. Embedded PostgreSQL tests are not proof of those transports.

Official reference: https://supabase.com/docs/guides/auth/server-side/creating-a-client

## Razorpay

Secret credentials remain server-side. Payment links are explicitly created for finalized invoice balances with provider notifications disabled. Webhook verification signs original raw bytes with HMAC-SHA256, compares in constant time, and fetches provider state before posting a transaction. Invoice/link/order/payment IDs, amount and INR currency are checked. Unique provider events and payment IDs prevent duplicate credit. A browser callback never marks an invoice paid.

Partial receipts remain distinct from full collection. Expired/cancelled link states are synchronized. Processed refunds are fetched and recorded in a separate ledger, with unique refund IDs and a refundable-amount check. The application does not initiate refunds. Link creation followed by a database failure requires manual reconciliation in the provider console before retrying; the invoice reference ID limits duplicate creation. Production multi-process retry/load testing is still required.

Official contracts consulted: https://razorpay.com/docs/api/payments/payment-links/create-standard/ · https://razorpay.com/docs/webhooks/payment-links/ · https://razorpay.com/docs/webhooks/validate-test/

## WhatsApp

Invoice sharing uses supported click-to-chat. New-inquiry admin WhatsApp and SMS alerts use the server-side Twilio integration described in [the alert setup guide](inquiry-alerts.md); these channels stay off until configured. The owner reviews and opens an individual message. Files are downloaded for manual attachment. Logs distinguish prepared, opened, manually sent and failed. No bulk send, automatic attachment, delivered or read claim exists. Invoice access uses a random 256-bit token; only its SHA-256 hash is stored, expiring after seven days and revocable.

## Resend

Manually reviewed transactional invoice emails use Resend's HTTP API and an idempotency header. The recipient must match the customer's stored email. A successful API response is logged as provider_accepted, never delivered. Setup requires an API key and verified sending domain. Provider delivery/bounce webhooks and quotation email sharing remain pending. No automatic monthly email dispatch occurs.

Official API: https://resend.com/docs/api-reference/emails/send-email

## Monitoring

Sentry is optional and disabled without its DSN. Provider transport and error capture need staging verification. No production monitoring or alert delivery has been claimed.
