# Operating Umiya Studio

## First setup

The initial owner must be invited in Supabase Auth and receive a matching active owner profile. There is no self-registration or default password. Configure verified business contact details and approve all imagery before launch. Invoice settings include document prefix, due days, footer, payment instructions, GSTIN and a flat tax rate in basis points. Keep tax at zero unless your accountant approves the rule; this does not supply a full statutory GST breakdown. Staff invitations are owner-only; set the email template described in the deployment guide.

## Website

Use Website CMS to save section drafts, then open the protected unpublished preview. Publish explicitly. Catalog, Services, Portfolio, Testimonials, Social Gallery and FAQs have separate publishing states. In a record’s Photo field, choose Upload photo to select a JPEG, PNG or WebP from your device (up to 10 MB), or Choose from Media library to reuse an existing public photo. Review the preview, then save the record. No image URL copying is needed. Uploads are saved in the public Media library even before the record is saved; use only imagery approved for public display. For occasion photos, open Decoration services, add or edit the occasion, choose its photo and set its publishing state to Published. The website accepts the listed occasion names and their singular forms, such as wedding or Weddings. Publishing a testimonial or portfolio photograph requires permission confirmation. Never place private customer material in the public media library.

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

## Launch readiness and public details

Owners can review the launch-readiness panel in Settings. Complete the verified public phone/email, structured shop address, privacy contact email, approved retention text and review date. Leave unknown facts blank; the public site avoids claiming a complete local-business address without them. The panel identifies missing setup and does not certify message delivery, accounting or security.

Public content updates may be cached for up to 60 seconds; successful Studio public-content saves/publishes invalidate the website cache. Authorized unpublished preview always reads fresh data. Validation errors now identify and focus the affected field.

### Occasion photos: gallery or main section image

Open **Decoration services → Manage occasion photos**. Choose Weddings, Balloon Decorations or another occasion. The summary shows which occasion you are editing, its current main image, any draft main image, and the published gallery-photo count.

Choose **Photo use**:

- **Gallery photos only:** upload or select up to 20 photos per batch. These appear only in that occasion's customer gallery. The main section image stays unchanged.
- **Main section image only:** select one photo for the front of that occasion's section. This does not add it to the gallery. Select the same photo separately as a gallery photo if you want it in both places.

Choose **Published — show on website** and save to make the change live, or keep **Draft — keep in Studio**. A draft main image does not replace the published main image. To publish it later, select the saved photo from the Media library using the main-image option and choose Published.

Gallery photos remain individual records in Decoration services, labelled by occasion and shown with thumbnails. Edit a record's description or set its status to Archived to hide that gallery photo. Main images are managed through Manage occasion photos, independently of these gallery records. No database migration is needed: gallery entries use existing decoration-service records and main images use reserved CMS snapshots hidden from the general CMS editor.

Upload JPEG, PNG or WebP files up to 10 MB per photo. Successfully uploaded files remain in the public Media library if you close the form without saving; use only approved public images. Changing Photo use starts a fresh selection; uploaded files can be selected again from the library.

Customers open the occasion-specific gallery button beside **Let’s dream together**. They can select a thumbnail, use Previous/Next or keyboard arrows, return to thumbnails, and close with Escape. Only published gallery photos are shown; occasions without photos display an empty message.

To remove an occasion gallery photo, choose **Delete photo** beside its thumbnail and confirm the preview. It disappears from the website gallery and active list. The shared media file and main section image stay available. Use **Show deleted photos → Restore photo** to restore the assignment as a draft, then Edit and publish when ready.
