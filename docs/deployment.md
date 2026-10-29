# Deployment to Vercel + Supabase

No live deployment has been performed. Use separate development, staging and production projects and secret sets.

1. Create a Supabase project in a suitable region. Disable open signups; configure invitation-only access, strong passwords, session limits and MFA according to the business's security policy. Set the Site URL to the canonical application URL.
2. Apply the numbered migrations with Supabase CLI or SQL Editor, in order, to a clean staging database. Buckets and policies are created by SQL. Inspect migration logs and RLS before using private records.
3. Add the canonical domain's `/auth/callback` and `/auth/confirm` routes to allowed redirect URLs. For invitations, configure the email template confirmation link to `https://YOUR_DOMAIN/auth/confirm?token_hash={{ .TokenHash }}&type=invite`. Recovery may use the SSR PKCE callback, or a matching custom confirmation link with `type=recovery`. Test actual delivered links; default implicit-flow invitation templates are not sufficient for these server routes.
4. Invite the owner securely in Supabase Auth. Using that actual Auth UUID, insert a profile in SQL Editor:

   ```sql
   insert into public.profiles(id,display_name,role)
   values ('ACTUAL_AUTH_USER_UUID','Owner','owner');
   ```

   This is a provisioning template, not a seed credential. Do not add an owner by untrusted client request.
5. Import this project into Vercel. Choose Next.js, Node.js 20.9+ (tested locally on 24), and the project root containing `package.json`. Build is `npm run build`; deployment output is managed by Next.js.
6. Configure `.env.example` variables separately for each environment. Never commit `.env.local`. Set `NEXT_PUBLIC_APP_URL` to the exact canonical HTTPS origin. Generate a random `INQUIRY_RATE_LIMIT_SALT`; never use the example fixtures as real data.
7. Add Supabase URL and anon key, and the server-only service-role key. Verify anonymous readers cannot access clients, drafts, invoices or storage metadata. Set Storage private/public access as created by the migrations.
8. Add Razorpay **test** credentials and a dedicated webhook secret. Register `/api/webhooks/razorpay` for payment-link paid/partial/expired/cancelled and refund.processed events. Test signatures, duplicate retries, partial payment and refunded balances. Switch to live keys only after approval and provider onboarding.
9. Verify a Resend sending domain. Set `RESEND_API_KEY` and `EMAIL_FROM`. Test reviewed invoice emails and failure reporting. Disable marketing sending until consent/opt-out operations are verified.
10. Configure optional Sentry and verify a staging error arrives without customer details. Set production log retention and access controls.
11. Enter verified contact/address/hours, social/map links and business privacy information. Obtain approved photographs and customer publication permissions. Do not add invented reviews, awards, addresses or GST data.
12. Review accounting settings with the accountant. Defaults are zero GST and an `UF-` prefix. Invoice prefix, due terms, payment instructions and a flat tax rate in basis points are configurable in Settings; nonzero tax requires a GSTIN. Intra/inter-state CGST/SGST/IGST classification, quotation taxation and formal tax-invoice compliance still require accountant-approved implementation/review. Do not treat a generic flat-tax document as legal compliance.
13. Run all checks in `docs/testing.md` against staging, including actual owner/editor/accountant sessions. Measure the public production build on representative phones/networks. Repeat mobile operation checks with real data.
14. Enable backups, test restoration, configure retention and incident contacts, register the domain and run the acceptance scenarios in the validation report. Deploy only after the unresolved scope items are addressed.

## Rollback

Keep the prior Vercel deployment available. Prefer additive schema changes; take backups before migrations. Roll back application deployment first when possible. Never blindly reverse a financial migration or drop ledgers. Restore to a separate Supabase project, reconcile new payments received since the backup, and verify before switching connections.


## Release gate, published cache and factual settings

Before a launch build run `npm run check:release` and then `npm run build:release`. The configuration gate checks presence without printing secret values; it does not prove provider delivery or production acceptance. A real `NEXT_PUBLIC_APP_URL` HTTPS origin is required. `ENFORCE_CANONICAL_HOST=true` optionally redirects the equivalent www/apex host; enable only after domain ownership and hosting routing are verified. Production HSTS is emitted only with a valid public HTTPS origin. Review the full redirect/certificate chain on the actual host.

Public home/privacy pages cache anonymous published content for 60 seconds. Successful authorized Studio changes to public modules invalidate that cache; direct database edits become visible through timed revalidation. Protected preview bypasses it. Never add session-dependent or private content to this cache.

In Studio Settings complete the structured street/city/state/postcode/two-letter country fields and privacy contact/approved retention wording/review date. The owner-only launch panel shows missing configuration; completing it is not a legal/security sign-off. No business facts are invented.

`NEXT_PUBLIC_ENABLE_WEB_VITALS` is off by default. If approved, enable it at build time only after reviewing privacy notice and log access/retention. It sends bounded first-party LCP/INP/CLS records for home/privacy without query strings or customer values; host access logs may separately contain network metadata. Establish aggregation before claiming field thresholds.
