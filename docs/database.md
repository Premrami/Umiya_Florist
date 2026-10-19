# Database

Apply all SQL files in `supabase/migrations` in order. They target Supabase PostgreSQL with its existing `auth.users`, `storage.buckets` and `storage.objects` schemas. Never run migrations against an unrelated database.

## Relationships and invariants

- `profiles.id` references an Auth user. `has_permission` maps a profile role to an explicit permission set.
- Accountants read only the billing identity function, while direct CRM-table access stays restricted. Customers own subscriptions, invoices, quotations and events. Address, note, follow-up and marketing-consent tables retain operational history. Archiving never cascades to finances.
- Subscriptions own item prices, effective-date price changes, pauses and delivery records. `(subscription_id, delivery_date)` is unique. Itemized delivery rows retain quantities and prices. Only delivered records are billable.
- Monthly invoices are unique by subscription and billing month. `invoice_items.delivery_id` is unique. Draft adjustments are separate rows. Finalized invoice updates and line changes are blocked. Billed deliveries cannot be mutated.
- Quotations have immutable snapshots after being sent. Accepted quotations create at most one linked event through a locked transaction.
- Event tasks, expenses and private attachment metadata reference events. Material reservations are provisioned in the schema; the reservation/consumption UI is pending.
- Payment links reference an invoice and unique provider link ID. Payments have unique provider payment IDs and idempotency UUIDs. Provider events have a unique event ID. Provider refunds and invoice credits are separate immutable ledgers.
- `invoice_balances` calculates billed totals minus credits and net payments after refunds. Reporting separates invoiced revenue, collected cash, outstanding dues and agreed event contribution.
- Physical inventory derives from movement rows, with units kept per item. The stock function locks the item and refuses negative balances.
- CMS sections store draft and published JSON separately. Public views expose only published section snapshots and public settings. Portfolio/review publication requires recorded permission.

`src/types/database.ts` is generated from actual migration introspection. It includes row/insert/update types; hand-written domain validation remains in Zod. Generic operational screens deliberately use whitelisted records rather than pretending the SDK has a fully generated RPC type contract.

## Tests and live differences

The integration tests apply the actual migrations to PGlite PostgreSQL. They stub Supabase's Auth and Storage schemas, use actual roles/RLS, and skip the pgcrypto extension because the runtime already supplies `gen_random_uuid`. These tests do not exercise Supabase GoTrue, PostgREST, Storage transport or production concurrency/load. Validate those in staging.

## Backups

Enable Supabase automated backups appropriate to the plan. Decide whether point-in-time recovery is needed. Take a database dump and independently back up Storage before a migration. Perform a restore drill in a separate project and verify invoice/payment counts, totals and private-object access. Application auditing is not a substitute for backups.
