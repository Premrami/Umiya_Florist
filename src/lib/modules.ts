import { z } from 'zod';
import { phoneSchema, optionalPhoneSchema } from './phone-validation';
const text = z.string().trim().min(1).max(500),
  notes = z.string().max(5000).optional(),
  id = z.string().uuid(),
  money = z.coerce.number().int().min(0).max(1e12),
  date = z.iso.date();
const image = z
  .string()
  .max(2000)
  .refine((s) => {
    if (/^\/images\/[a-zA-Z0-9_.-]+$/.test(s)) return true;
    try {
      const u = new URL(s);
      return (
        u.protocol === 'https:' &&
        (u.hostname === 'images.unsplash.com' || u.hostname.endsWith('.supabase.co'))
      );
    } catch {
      return false;
    }
  }, 'Use an approved HTTPS media URL');
const httpsUrl = z.url().refine((value) => /^https:\/\//i.test(value), 'Use a secure HTTPS URL');
const publication = z.enum(['draft', 'published', 'archived']);
export type Field = {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | 'any';
};
export type ModuleSpec = {
  table: string;
  title: string;
  permission: string;
  schema: z.ZodType<Record<string, unknown>>;
  fields: Field[];
  columns: string[];
  readonly?: boolean;
};
const f = (
  key: string,
  label: string,
  type = 'text',
  required = true,
  options?: string[],
): Field => ({ key, label, type, required, options });
export const specs: Record<string, ModuleSpec> = {
  clients: {
    table: 'customers',
    title: 'Clients',
    permission: 'crm',
    schema: z.object({
      name: text,
      phone: phoneSchema,
      email: z.union([z.email(), z.literal('')]).optional(),
      whatsapp: notes,
      customer_type: text,
      billing_address: notes,
      delivery_address: notes,
      area: notes,
      notes,
      status: z.enum(['active', 'archived']).default('active'),
    }),
    fields: [
      f('name', 'Full name'),
      f('phone', 'Phone (digits, country code)', 'tel'),
      f('email', 'Email', 'email', false),
      f('customer_type', 'Customer type', 'select', true, [
        'Regular Pooja Customer',
        'Bouquet Customer',
        'Event Customer',
        'Corporate Customer',
        'Other',
      ]),
      f('billing_address', 'Billing address', 'textarea', false),
      f('delivery_address', 'Delivery address', 'textarea', false),
      f('area', 'Area', 'text', false),
      f('notes', 'Internal notes', 'textarea', false),
      f('status', 'Status', 'select', true, ['active', 'archived']),
    ],
    columns: ['name', 'phone', 'customer_type', 'area', 'status'],
  },
  subscriptions: {
    table: 'flower_subscriptions',
    title: 'Subscriptions',
    permission: 'operations',
    schema: z.object({
      customer_id: id,
      name: text,
      daily_amount: money,
      frequency: z.enum(['daily', 'weekdays', 'weekly']),
      start_date: date,
      end_date: z.union([date, z.literal('')]).transform((v) => v || null),
      status: z.enum(['active', 'paused', 'cancelled', 'completed']),
      address: notes,
      notes,
    }),
    fields: [
      f('customer_id', 'Client', 'customer'),
      f('name', 'Subscription name'),
      f('daily_amount', 'Daily price (paise)', 'number'),
      f('frequency', 'Frequency', 'select', true, ['daily', 'weekdays', 'weekly']),
      f('start_date', 'Start date', 'date'),
      f('end_date', 'End date', 'date', false),
      f('address', 'Delivery address', 'textarea', false),
      f('status', 'Status', 'select', true, ['active', 'paused', 'cancelled', 'completed']),
      f('notes', 'Instructions', 'textarea', false),
    ],
    columns: ['name', 'customer_id', 'daily_amount', 'frequency', 'status'],
  },
  deliveries: {
    table: 'delivery_records',
    title: 'Daily deliveries',
    permission: 'operations',
    schema: z.object({
      status: z.enum(['pending', 'delivered', 'skipped', 'cancelled', 'failed']),
      amount: money,
      notes,
    }),
    fields: [
      f('status', 'Status', 'select', true, [
        'pending',
        'delivered',
        'skipped',
        'cancelled',
        'failed',
      ]),
      f('amount', 'Actual amount (paise)', 'number'),
      f('notes', 'Notes', 'textarea', false),
    ],
    columns: ['delivery_date', 'subscription_id', 'status', 'amount'],
    readonly: true,
  },
  events: {
    table: 'events',
    title: 'Events',
    permission: 'operations',
    schema: z.object({
      customer_id: id,
      name: text,
      event_type: text,
      event_date: date,
      venue: text,
      agreed_amount: money,
      status: z.enum([
        'inquiry',
        'quotation_prepared',
        'quotation_sent',
        'negotiating',
        'confirmed',
        'planning',
        'in_progress',
        'completed',
        'cancelled',
      ]),
      notes,
    }),
    fields: [
      f('name', 'Event title'),
      f('customer_id', 'Client', 'customer'),
      f('event_type', 'Event type'),
      f('event_date', 'Event date', 'date'),
      f('venue', 'Venue'),
      f('agreed_amount', 'Agreed revenue (paise)', 'number'),
      f('status', 'Status', 'select', true, [
        'inquiry',
        'quotation_prepared',
        'quotation_sent',
        'negotiating',
        'confirmed',
        'planning',
        'in_progress',
        'completed',
        'cancelled',
      ]),
      f('notes', 'Notes', 'textarea', false),
    ],
    columns: ['name', 'event_date', 'venue', 'agreed_amount', 'status'],
  },
  inquiries: {
    table: 'inquiries',
    title: 'Inquiries',
    permission: 'crm',
    schema: z.object({
      status: z.enum([
        'new',
        'contacted',
        'qualified',
        'quotation_sent',
        'converted',
        'closed',
        'spam',
      ]),
      notes,
      followup_at: z
        .union([z.iso.datetime({ local: true }), z.literal('')])
        .transform((v) => v || null)
        .optional(),
    }),
    fields: [
      f('status', 'Status', 'select', true, [
        'new',
        'contacted',
        'qualified',
        'quotation_sent',
        'converted',
        'closed',
        'spam',
      ]),
      f('notes', 'Internal notes', 'textarea', false),
    ],
    columns: ['name', 'phone', 'type', 'message', 'status'],
    readonly: true,
  },
  catalog: {
    table: 'catalog_items',
    title: 'Flower catalog',
    permission: 'content',
    schema: z.object({
      name: text,
      category: text,
      description: notes,
      image_url: image,
      price: z.union([z.literal(''), money]).transform((v) => (v === '' ? null : v)),
      status: publication,
      sort_order: z.coerce.number().int().min(0).default(0),
    }),
    fields: [
      f('name', 'Collection name'),
      f('category', 'Category'),
      f('description', 'Description', 'textarea', false),
      f('image_url', 'Image URL (from media library)'),
      f('price', 'Starting price (paise)', 'number', false),
      f('sort_order', 'Display order', 'number'),
      f('status', 'Publishing', 'select', true, ['draft', 'published', 'archived']),
    ],
    columns: ['name', 'category', 'price', 'status'],
  },
  inventory: {
    table: 'inventory_items',
    title: 'Inventory',
    permission: 'operations',
    schema: z.object({
      name: text,
      item_type: text,
      unit: z.enum(['stems', 'bunches', 'kg', 'packets', 'pieces']),
      reorder_threshold: z.coerce.number().min(0),
      unit_cost: money,
      status: z.enum(['active', 'archived']),
    }),
    fields: [
      f('name', 'Item name'),
      f('item_type', 'Type', 'select', true, [
        'Fresh flowers',
        'Artificial flowers',
        'Packaging',
        'Decoration materials',
        'Accessories',
        'Consumables',
      ]),
      f('unit', 'Unit', 'select', true, ['stems', 'bunches', 'kg', 'packets', 'pieces']),
      { ...f('reorder_threshold', 'Reorder level', 'number'), step: 'any' },
      f('unit_cost', 'Unit cost (paise)', 'number'),
      f('status', 'Status', 'select', true, ['active', 'archived']),
    ],
    columns: ['name', 'item_type', 'unit', 'stock', 'reorder_threshold'],
  },
  cms: {
    table: 'site_sections',
    title: 'Website CMS',
    permission: 'content',
    schema: z.object({
      key: z.enum([
        'hero',
        'about',
        'pooja',
        'contact',
        'footer',
        'collections',
        'decorations',
        'work',
        'why',
        'testimonials',
        'social',
      ]),
      draft: z.object({
        headline: text,
        description: z.string().max(3000),
        image_url: image.optional(),
      }),
    }),
    fields: [
      f('key', 'Section', 'select', true, [
        'hero',
        'about',
        'pooja',
        'contact',
        'footer',
        'collections',
        'decorations',
        'work',
        'why',
        'testimonials',
        'social',
      ]),
      f('draft.headline', 'Headline'),
      f('draft.description', 'Description', 'textarea'),
      f('draft.image_url', 'Image URL', 'url', false),
    ],
    columns: ['key', 'draft', 'published_at'],
  },
  marketing: {
    table: 'campaigns',
    title: 'Marketing',
    permission: 'marketing',
    schema: z.object({
      name: text,
      message: z.string().min(5).max(3000),
      status: z.enum(['draft', 'prepared', 'archived']),
    }),
    fields: [
      f('name', 'Campaign name'),
      f('message', 'Message', 'textarea'),
      f('status', 'Status', 'select', true, ['draft', 'prepared', 'archived']),
    ],
    columns: ['name', 'message', 'status'],
  },
  invoices: {
    table: 'invoices',
    title: 'Invoices',
    permission: 'finance',
    schema: z.object({}),
    fields: [],
    columns: ['number', 'customer_id', 'period', 'total', 'credits', 'paid', 'balance', 'status'],
    readonly: true,
  },
  payments: {
    table: 'payments',
    title: 'Payments',
    permission: 'finance',
    schema: z.object({}),
    fields: [],
    columns: ['invoice_id', 'amount', 'method', 'reference', 'created_at'],
    readonly: true,
  },
  quotations: {
    table: 'quotations',
    title: 'Quotations',
    permission: 'finance',
    schema: z.object({
      customer_id: id,
      name: text,
      valid_until: date,
      total: money,
      snapshot: z.object({ description: z.string().min(2).max(3000) }),
    }),
    fields: [
      f('name', 'Quotation title'),
      f('customer_id', 'Client', 'customer'),
      f('valid_until', 'Valid until', 'date'),
      f('total', 'Total (paise)', 'number'),
      f('snapshot.description', 'Scope and line breakdown', 'textarea'),
    ],
    columns: ['number', 'name', 'valid_until', 'total', 'status'],
  },
  media: {
    table: 'media_assets',
    title: 'Media library',
    permission: 'content',
    schema: z.object({ alt_text: notes }),
    fields: [],
    columns: ['name', 'alt_text', 'mime_type', 'bytes', 'path'],
    readonly: true,
  },
  staff: {
    table: 'profiles',
    title: 'Staff & roles',
    permission: 'owner',
    schema: z.object({
      display_name: text,
      role: z.enum(['owner', 'admin', 'manager', 'staff', 'accountant', 'editor']),
      active: z.boolean(),
    }),
    fields: [],
    columns: ['display_name', 'role', 'active'],
    readonly: true,
  },
  settings: {
    table: 'site_settings',
    title: 'Settings',
    permission: 'owner',
    schema: z.object({
      private: z
        .object({
          invoice_prefix: z.string().regex(/^[A-Z0-9-]{1,12}$/),
          quotation_prefix: z.string().regex(/^[A-Z0-9-]{1,12}$/),
          due_days: z.coerce.number().int().min(0).max(365),
          gstin: z.string().regex(/^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/),
          tax_bps: z.coerce.number().int().min(0).max(2800),
          invoice_footer: z.string().max(1000),
          payment_instructions: z.string().max(1000),
          retention_days: z.coerce.number().int().min(30).max(3650),
          default_delivery_charge: money,
          inquiry_alert_phone: z
            .string()
            .regex(/^$|^\+[1-9]\d{7,14}$/)
            .default(''),
          inquiry_whatsapp_enabled: z
            .union([z.boolean(), z.literal('true')])
            .transform((v) => v === true || v === 'true')
            .default(false),
          inquiry_sms_enabled: z
            .union([z.boolean(), z.literal('true')])
            .transform((v) => v === true || v === 'true')
            .default(false),
        })
        .refine((v) => !v.tax_bps || v.gstin.length === 15, 'Tax requires a verified GSTIN'),
      public: z.object({
        name: text,
        email: z.union([z.email(), z.literal('')]).optional(),
        logo_url: z.union([image, z.literal('')]).optional(),
        service_areas: z.string().max(500).optional(),
        map_url: z.union([httpsUrl, z.literal('')]).optional(),
        google_business: z.union([httpsUrl, z.literal('')]).optional(),
        phone: optionalPhoneSchema,
        whatsapp: optionalPhoneSchema,
        address: z.string().max(500),
        hours: z.string().max(300),
        instagram: z.union([httpsUrl, z.literal('')]),
      }),
    }),
    fields: [
      f('private.invoice_prefix', 'Invoice prefix'),
      f('private.quotation_prefix', 'Quotation prefix'),
      { ...f('private.due_days', 'Default due days', 'number'), max: 365 },
      f('private.gstin', 'GSTIN (only if registered)', 'text', false),
      { ...f('private.tax_bps', 'Tax basis points (1800 = 18%, 0 = none)', 'number'), max: 2800 },
      f('private.invoice_footer', 'Invoice footer', 'textarea', false),
      f('private.payment_instructions', 'Payment instructions', 'textarea', false),
      {
        ...f('private.retention_days', 'Retention preference (days)', 'number'),
        min: 30,
        max: 3650,
      },
      f('private.default_delivery_charge', 'Default delivery charge (paise)', 'number'),
      f('private.inquiry_alert_phone', 'Admin inquiry alert phone (+country code)', 'tel', false),
      f(
        'private.inquiry_whatsapp_enabled',
        'Enable WhatsApp inquiry alerts to admin',
        'checkbox',
        false,
      ),
      f('private.inquiry_sms_enabled', 'Enable SMS inquiry alerts to admin', 'checkbox', false),
      f('public.name', 'Business name'),
      f('public.email', 'Business email', 'email', false),
      f('public.logo_url', 'Logo image URL', 'url', false),
      f('public.service_areas', 'Service areas', 'text', false),
      f('public.map_url', 'Map URL', 'url', false),
      f('public.google_business', 'Google Business Profile URL', 'url', false),
      f('public.phone', 'Phone', 'tel', false),
      f('public.whatsapp', 'WhatsApp', 'tel', false),
      f('public.address', 'Verified address', 'textarea', false),
      f('public.hours', 'Opening hours', 'text', false),
      f('public.instagram', 'Instagram', 'url', false),
    ],
    columns: ['public'],
    readonly: true,
  },
};

specs.services = {
  table: 'services',
  title: 'Decoration services',
  permission: 'content',
  schema: z.object({ name: text, description: notes, image_url: image, status: publication }),
  fields: [
    f('name', 'Service title'),
    f('description', 'Description', 'textarea'),
    f('image_url', 'Image URL'),
    f('status', 'Publishing', 'select', true, ['draft', 'published', 'archived']),
  ],
  columns: ['name', 'description', 'status'],
};
specs.portfolio = {
  table: 'portfolio_projects',
  title: 'Portfolio',
  permission: 'content',
  schema: z.object({
    name: text,
    description: notes,
    image_url: image,
    permission_confirmed: z.coerce.boolean(),
    status: publication,
  }),
  fields: [
    f('name', 'Project title'),
    f('description', 'Description', 'textarea'),
    f('image_url', 'Approved image URL'),
    f('permission_confirmed', 'Publication permission confirmed', 'checkbox'),
    f('status', 'Publishing', 'select', true, ['draft', 'published', 'archived']),
  ],
  columns: ['name', 'permission_confirmed', 'status'],
};
specs.testimonials = {
  table: 'testimonials',
  title: 'Testimonials',
  permission: 'content',
  schema: z.object({
    display_name: text,
    quote: text,
    permission_confirmed: z.coerce.boolean(),
    status: publication,
  }),
  fields: [
    f('display_name', 'Approved customer display name'),
    f('quote', 'Verified customer words', 'textarea'),
    f('permission_confirmed', 'Permission confirmed', 'checkbox'),
    f('status', 'Publishing', 'select', true, ['draft', 'published', 'archived']),
  ],
  columns: ['display_name', 'quote', 'status'],
};
specs.social = {
  table: 'social_posts',
  title: 'Social gallery',
  permission: 'content',
  schema: z.object({ name: text, image_url: image, alt_text: text, status: publication }),
  fields: [
    f('name', 'Caption'),
    f('image_url', 'Image URL'),
    f('alt_text', 'Image description'),
    f('status', 'Publishing', 'select', true, ['draft', 'published', 'archived']),
  ],
  columns: ['name', 'alt_text', 'status'],
};
specs.faqs = {
  table: 'faqs',
  title: 'Frequently asked questions',
  permission: 'content',
  schema: z.object({ name: text, answer: text, status: publication }),
  fields: [
    f('name', 'Question'),
    f('answer', 'Answer', 'textarea'),
    f('status', 'Publishing', 'select', true, ['draft', 'published', 'archived']),
  ],
  columns: ['name', 'answer', 'status'],
};
