export const inr = (p: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(p / 100);
export function integerMoney(n: number) {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error('Amount must be integer paise');
  return n;
}
export function calculateBill(
  deliveries: { id: string; status: string; amount: number }[],
  extra = 0,
  discount = 0,
) {
  integerMoney(extra);
  integerMoney(discount);
  const seen = new Set<string>();
  const lines = deliveries.filter((d) => {
    if (seen.has(d.id)) throw new Error('Duplicate delivery');
    seen.add(d.id);
    integerMoney(d.amount);
    return d.status === 'delivered';
  });
  const subtotal = lines.reduce((n, d) => n + d.amount, 0),
    total = subtotal + extra - discount;
  if (!Number.isSafeInteger(total) || total < 0) throw new Error('Invalid total');
  return { lines, subtotal, extra, discount, total };
}
export function isPaused(date: string, pauses: { start_date: string; end_date: string }[]) {
  return pauses.some((p) => date >= p.start_date && date <= p.end_date);
}
export const modules = [
  'dashboard',
  'inquiries',
  'clients',
  'subscriptions',
  'deliveries',
  'events',
  'quotations',
  'invoices',
  'payments',
  'catalog',
  'inventory',
  'cms',
  'media',
  'marketing',
  'reports',
  'staff',
  'settings',
  'services',
  'portfolio',
  'testimonials',
  'social',
  'faqs',
] as const;
export const rolePermissions: Record<string, string[]> = {
  owner: ['owner', 'crm', 'operations', 'finance', 'content', 'marketing'],
  admin: ['crm', 'operations', 'finance', 'content', 'marketing'],
  manager: ['crm', 'operations'],
  staff: ['assigned'],
  accountant: ['finance'],
  editor: ['content'],
};
export function can(role: string, permission: string) {
  return rolePermissions[role]?.includes(permission) ?? false;
}
