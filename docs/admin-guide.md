# Operating Umiya Studio

## First setup

The initial owner must be invited in Supabase Auth and receive a matching active owner profile. There is no self-registration or default password. Configure verified business contact details and approve all imagery before launch. Invoice settings include document prefix, due days, footer, payment instructions, GSTIN and a flat tax rate in basis points. Keep tax at zero unless your accountant approves the rule; this does not supply a full statutory GST breakdown. Staff invitations are owner-only; set the email template described in the deployment guide.

## Website

Use Website CMS to save section drafts, then open the protected unpublished preview. Publish explicitly. Catalog, Services, Portfolio, Testimonials, Social Gallery and FAQs have separate publishing states. Images are uploaded in Media Library; copy the returned image URL into the relevant record. Publishing a testimonial or portfolio photograph requires permission confirmation. Never place private customer material in the public media library.

## Clients and deliveries

Add a client with an international phone number. Duplicate active phone numbers are refused. Client details retain addresses and follow-ups. Consent/opt-out actions record evidence; do not grant consent merely because a client purchased flowers.

Add a subscription, choose daily/weekdays/weekly, and enter its fixed daily price in **paise** (₹50 = 5000). Adding flower items switches that subscription to item pricing. Schedule future fixed-rate changes with an effective date. Generate expected deliveries for a selected date; repeating the action cannot duplicate occurrences. Mark actual deliveries delivered, skipped, failed or cancelled. Add pause dates to skip pending occurrences; already billed records remain protected.

## Monthly bills

Generate monthly drafts after recording deliveries. Review each record and its PDF. Add explained adjustments (positive charge, negative discount), then finalize. Finalized values cannot be edited. Download the PDF, create a payment link if configured, or record a manual cash/bank/UPI receipt. Cancel active Razorpay links before recording manual collections to prevent competing payment paths.

Prepare WhatsApp opens an editable review. The invoice link expires after seven days; revoke it when needed. Download and attach the PDF yourself. Opening WhatsApp is logged as opened, never delivered/read. Mark sent only after actually sending it. Transactional email requires the stored customer email, an explicit review, and Resend setup; provider acceptance does not prove delivery.

Issue explained credit notes rather than changing a finalized invoice. Provider refunds update the net-payment ledger after verified processed events. This software does not initiate bank/provider refunds.

## Events

Create an event or accept a sent quotation and confirm its booking date/venue. Itemized quotation totals are calculated on the server. Record tasks and actual direct expenses. Attach private inspiration/contract files to the event; downloads are authorized with 60-second signed URLs. Event contribution means agreed revenue less direct costs, separately from cash collection. A final invoice can be created in Invoices with the event reference.

## Inventory and reports

Create an item with its unit, then record positive receipts/purchases or negative usage/wastage. Quantity is ledger-derived; do not silently overwrite stock. Reports calculate stored values and distinguish invoices from collections. CSV export is explicitly limited to the current visible page. Daily operational counts use Asia/Kolkata.

## Permissions

Owner: all configuration and operations. Admin: operations/content/finance/marketing, excluding ownership settings. Manager: CRM and operations. Accountant: finance and limited billing customer identity, with no direct access to private CRM records. Editor: published content management. Assignment-scoped field staff access is not yet enabled; the reserved staff role receives no broad business access.
