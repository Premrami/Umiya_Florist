'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Flower2,
  LayoutDashboard,
  Inbox,
  Users,
  Repeat,
  Truck,
  CalendarDays,
  FileText,
  Wallet,
  Flower,
  Package,
  PanelsTopLeft,
  ImageIcon,
  Megaphone,
  BarChart3,
  Shield,
  Settings,
  Plus,
  Search,
  ArrowUpRight,
  Download,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Check,
  ExternalLink,
} from 'lucide-react';
import { modules, can, inr } from '@/lib/business';
import { specs, type Field } from '@/lib/modules';
import { useRouter } from 'next/navigation';
type Row = Record<string, any>;
const icons = [
  LayoutDashboard,
  Inbox,
  Users,
  Repeat,
  Truck,
  CalendarDays,
  FileText,
  FileText,
  Wallet,
  Flower,
  Package,
  PanelsTopLeft,
  ImageIcon,
  Megaphone,
  BarChart3,
  Shield,
  Settings,
];
const names = [
  'Overview',
  'Inquiries',
  'Clients',
  'Subscriptions',
  'Daily deliveries',
  'Events',
  'Quotations',
  'Invoices',
  'Payments',
  'Flower catalog',
  'Inventory',
  'Website CMS',
  'Media library',
  'Marketing',
  'Reports',
  'Staff & roles',
  'Settings',
];
const human = (s: string) => s.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
async function api(path: string, body?: unknown) {
  const res = await fetch(path, {
    ...(body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
}
const moneyFields = [
  'credits',
  'total',
  'paid',
  'balance',
  'amount',
  'daily_amount',
  'unit_cost',
  'agreed_amount',
  'revenue_month',
  'received_month',
  'outstanding',
];
function value(key: string, v: any) {
  if (v == null || v === '') return '—';
  if (moneyFields.includes(key)) return inr(Number(v));
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (key.endsWith('_at'))
    return new Date(v).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  if (key.endsWith('_id')) return String(v).slice(0, 8);
  return String(v);
}
export function Admin({ module, profile }: { module: string; profile: Row }) {
  const router = useRouter();
  const sidebarRef = useRef<HTMLElement>(null);
  const [rows, setRows] = useState<Row[]>([]),
    [count, setCount] = useState(0),
    [page, setPage] = useState(0),
    [search, setSearch] = useState(''),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [mobile, setMobile] = useState(false),
    [edit, setEdit] = useState<Row | null>(null),
    [action, setAction] = useState<{ name: string; row?: Row } | null>(null),
    [overview, setOverview] = useState<Row>({}),
    [customers, setCustomers] = useState<Row[]>([]),
    [detail, setDetail] = useState<Row | null>(null),
    [ledger, setLedger] = useState<Row[]>([]),
    [share, setShare] = useState<Row | null>(null),
    [email, setEmail] = useState<Row | null>(null),
    [recipients, setRecipients] = useState<Row[]>([]),
    [tasks, setTasks] = useState<Row[]>([]),
    [history, setHistory] = useState<Row>({}),
    [attachments, setAttachments] = useState<Row[]>([]);
  useEffect(() => {
    if (!mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () =>
      Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('a, button') ?? []).filter(
        (e) => e.getClientRects().length > 0,
      );
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobile(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable(),
        first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => {
      document.removeEventListener('keydown', trap);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [mobile]);
  const spec = specs[module],
    title =
      module === 'dashboard'
        ? 'Your studio, at a glance.'
        : module === 'reports'
          ? 'Business reports'
          : spec?.title;
  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      if (['dashboard', 'reports'].includes(module)) {
        setOverview((await api('/api/admin/overview')).data);
      } else {
        const r = await api(
          `/api/admin/${module}?page=${page}&search=${encodeURIComponent(search)}`,
        );
        setRows(r.data ?? []);
        setCount(r.count ?? 0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load records');
    } finally {
      setBusy(false);
    }
  }, [module, page, search]);
  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (can(profile.role, 'crm') || can(profile.role, 'finance'))
      api('/api/admin/lookups')
        .then((r) => setCustomers(r.data ?? []))
        .catch(() => {});
  }, [profile.role]);
  async function run(name: string, data: Row = {}) {
    setError('');
    try {
      const r = await api('/api/admin/actions', { action: name, ...data });
      setNotice('Saved successfully.');
      if (name === 'share') setShare(r.data);
      if (name === 'link') setNotice('Payment link created: ' + r.data.url);
      await load();
      return r.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
      throw e;
    }
  }
  async function showDetail(row: Row) {
    setDetail(row);
    setLedger([]);
    setTasks([]);
    setHistory({});
    setAttachments([]);
    if (module === 'events')
      api('/api/admin/attachments?event=' + row.id)
        .then((r) => setAttachments(r.data ?? []))
        .catch((e) => setError(String(e)));
    if (module === 'clients')
      api('/api/admin/lookups?kind=customer_history&id=' + row.id)
        .then((r) => setHistory(r.data))
        .catch((e) => setError(String(e)));
    if (module === 'events')
      api('/api/admin/lookups?kind=event_tasks&id=' + row.id)
        .then((r) => setTasks(r.data ?? []))
        .catch((e) => setError(String(e)));
    if (module === 'subscriptions')
      api('/api/admin/lookups?kind=subscription_items&id=' + row.id)
        .then((r) => setHistory({ items: r.data }))
        .catch((e) => setError(String(e)));
    if (['events', 'inventory', 'subscriptions'].includes(module)) {
      try {
        setLedger(
          (await api(`/api/admin/lookups?kind=details&module=${module}&id=${row.id}`)).data ?? [],
        );
      } catch (e) {
        setError(String(e));
      }
    }
  }
  function exportCsv() {
    const columns =
      spec?.columns ?? Object.keys(overview).filter((k) => typeof overview[k] !== 'object');
    const data = spec ? rows : [overview];
    const csv = [
      columns,
      ...data.map((r) =>
        columns.map((k) => {
          let v = value(k, r[k]);
          if (/^[=+@-]/.test(v)) v = "'" + v;
          return v;
        }),
      ),
    ]
      .map((r) => r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'umiya-' + module + '-current-page.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  const buttons = (row: Row) => (
    <div className="row-actions">
      {module === 'clients' && (
        <>
          <button onClick={() => setAction({ name: 'consent', row })}>Consent / opt-out</button>
          <button onClick={() => setAction({ name: 'address', row })}>Add address</button>
          <button onClick={() => setAction({ name: 'followup', row })}>Follow-up</button>
        </>
      )}
      <button onClick={() => showDetail(row)}>View</button>
      {spec?.fields.length > 0 && module !== 'settings' && (
        <button onClick={() => setEdit(row)}>Edit</button>
      )}
      {module === 'inquiries' && !row.customer_id && (
        <button onClick={() => run('convert', { id: row.id }).catch(() => {})}>
          Convert to client
        </button>
      )}
      {module === 'cms' && (
        <button onClick={() => run('publish', { id: row.id }).catch(() => {})}>
          Publish draft
        </button>
      )}
      {module === 'subscriptions' && (
        <>
          <button onClick={() => setAction({ name: 'pause', row })}>Pause dates</button>
          <button onClick={() => setAction({ name: 'subscription_item', row })}>
            Add flower item
          </button>
          <button onClick={() => setAction({ name: 'price', row })}>Schedule price change</button>
        </>
      )}
      {module === 'inventory' && (
        <button onClick={() => setAction({ name: 'stock', row })}>Stock movement</button>
      )}
      {module === 'events' && (
        <>
          <button onClick={() => setAction({ name: 'expense', row })}>Add expense</button>
          <button onClick={() => setAction({ name: 'task', row })}>Add task</button>
          <button onClick={() => setAction({ name: 'attachment', row })}>
            Attach private file
          </button>
        </>
      )}
      {module === 'quotations' && (
        <>
          {row.status === 'accepted' && can(profile.role, 'operations') && (
            <button onClick={() => setAction({ name: 'booking', row })}>
              Confirm event booking
            </button>
          )}
          <a href={'/api/admin/pdf?kind=quotation&id=' + row.id}>PDF</a>
          {['sent', 'accepted', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => run('quote_status', { id: row.id, status: s }).catch(() => {})}
            >
              Mark {s}
            </button>
          ))}
        </>
      )}
      {module === 'invoices' && (
        <>
          {row.status === 'draft' ? (
            <>
              <button onClick={() => setAction({ name: 'finalize', row })}>
                Review & finalize
              </button>
              <button onClick={() => setAction({ name: 'adjust', row })}>Adjust</button>
            </>
          ) : (
            <>
              <button onClick={() => setAction({ name: 'payment', row })}>Record payment</button>
              <button onClick={() => setAction({ name: 'credit', row })}>Issue credit note</button>
              <button onClick={() => run('cancel_link', { id: row.id }).catch(() => {})}>
                Cancel active payment link
              </button>
              <button onClick={() => run('link', { id: row.id }).catch(() => {})}>
                Payment link
              </button>
              <button onClick={() => run('share', { id: row.id }).catch(() => {})}>
                Prepare WhatsApp
              </button>
              <button
                onClick={async () => {
                  try {
                    const r = await api('/api/admin/actions', { action: 'share', id: row.id });
                    setEmail({
                      ...r.data,
                      invoice_id: row.id,
                      subject: 'Umiya Florist invoice UF-' + row.number,
                    });
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              >
                Review email
              </button>
              <button onClick={() => run('revoke_share', { id: row.id }).catch(() => {})}>
                Revoke shared links
              </button>
            </>
          )}
          <a href={'/api/admin/pdf?id=' + row.id}>PDF</a>
        </>
      )}
      {module === 'marketing' && (
        <button
          onClick={async () => {
            setRecipients((await api('/api/admin/lookups?kind=consented')).data ?? []);
            setDetail(row);
          }}
        >
          Review opted-in recipients
        </button>
      )}
    </div>
  );
  return (
    <div className="admin-shell">
      <aside
        ref={sidebarRef}
        role={mobile ? 'dialog' : undefined}
        aria-modal={mobile ? true : undefined}
        aria-label="Studio navigation"
        className={mobile ? 'admin-sidebar open' : 'admin-sidebar'}
      >
        <Link href="/" className="admin-brand">
          <Flower2 size={30} />
          <span>
            UMIYA<small>THE FLORAL STUDIO</small>
          </span>
        </Link>
        <button
          className="sidebar-close"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <div className="sidebar-label">WORKSPACE</div>
        <nav>
          {modules.map((m, i) => {
            if (
              (specs[m] && !can(profile.role, specs[m].permission)) ||
              (m === 'reports' && !can(profile.role, 'finance'))
            )
              return null;
            const Icon = icons[i] ?? Flower2;
            return (
              <Link key={m} href={'/admin/' + m} className={m === module ? 'active' : ''}>
                <Icon size={17} strokeWidth={1.5} />
                {names[i] ?? specs[m]?.title}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" target="_blank">
            View website <ExternalLink size={13} />
          </Link>
          <button
            onClick={async () => {
              await api('/api/auth', { action: 'logout' });
              router.replace('/login');
              router.refresh();
            }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="admin-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="admin-main">
        <header className="admin-header">
          <button
            className="admin-menu"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <Menu size={20} />
          </button>
          <span>
            Workspace <span className="muted">/ {module === 'dashboard' ? 'Overview' : title}</span>
          </span>
          <div className="admin-user">
            <span className="live-dot" /> Studio workspace{' '}
            <span className="avatar">{profile.display_name?.[0] ?? 'U'}</span>
          </div>
        </header>
        <main className="admin-content">
          <div className="admin-heading">
            <div>
              <div className="admin-eyebrow">UMIYA FLORIST · BUSINESS WORKSPACE</div>
              <h1>{title}</h1>
              <p>
                {module === 'dashboard'
                  ? 'A little clarity for a beautifully busy day.'
                  : 'Manage your ' + (title ?? 'records').toLowerCase() + ', thoughtfully.'}
              </p>
            </div>
            <div className="toolbar">
              {module === 'dashboard' ? (
                <span className="today-label">
                  {new Intl.DateTimeFormat('en-IN', {
                    dateStyle: 'long',
                    timeZone: 'Asia/Kolkata',
                  }).format(new Date())}
                </span>
              ) : (
                <button className="admin-btn secondary" onClick={exportCsv}>
                  <Download size={15} /> Export current page
                </button>
              )}
              {spec && !spec.readonly && (
                <button className="admin-btn" onClick={() => setEdit({})}>
                  <Plus size={16} /> Add{' '}
                  {module === 'clients' ? 'client' : module === 'cms' ? 'section' : 'record'}
                </button>
              )}
              {module === 'settings' && rows[0] && (
                <button className="admin-btn" onClick={() => setEdit(rows[0])}>
                  Edit settings
                </button>
              )}
            </div>
          </div>
          {error && (
            <div role="alert" className="admin-alert">
              {error} <button onClick={load}>Retry</button>
            </div>
          )}
          {notice && (
            <div role="status" className="admin-notice">
              {notice}
              <button aria-label="Dismiss notification" onClick={() => setNotice('')}>
                <X size={15} />
              </button>
            </div>
          )}
          {module === 'dashboard' || module === 'reports' ? (
            <>
              <div className="metric-grid">
                {[
                  ['revenue_month', 'Invoiced this month'],
                  ['received_month', 'Payments this month'],
                  ['outstanding', 'Outstanding dues'],
                  ['active_clients', 'Active clients'],
                  ['active_subscriptions', 'Active subscriptions'],
                  ['today_deliveries', 'Today’s deliveries'],
                  ['pending_inquiries', 'New inquiries'],
                  ['low_stock', 'Low stock items'],
                ]
                  .filter(([k]) => overview[k] != null)
                  .map(([key, label], i) => (
                    <article className="metric-card" key={key}>
                      <span>
                        {label}
                        <span className="metric-icon">{i < 3 ? '₹' : '✳'}</span>
                      </span>
                      <strong>
                        {moneyFields.includes(key) ? inr(overview[key]) : overview[key]}
                      </strong>
                      <small>
                        {i < 2
                          ? 'Current calendar month · IST'
                          : i === 2
                            ? 'Finalized invoices less recorded payments'
                            : 'From your saved records'}
                      </small>
                    </article>
                  ))}
              </div>
              {can(profile.role, 'finance') && (
                <div className="admin-chart panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Revenue & collections</h2>
                      <p>Invoiced revenue and received payments, shown separately.</p>
                    </div>
                    <span>LAST 6 MONTHS</span>
                  </div>
                  <div className="chart-legend">
                    <i /> Invoiced <i /> Collected
                  </div>
                  <div className="chart-bars">
                    {(overview.monthly_sales ?? []).map((m: Row) => {
                      const max = Math.max(
                        1,
                        ...(overview.monthly_sales ?? []).flatMap((x: Row) => [
                          x.invoiced,
                          x.collected,
                        ]),
                      );
                      return (
                        <div className="chart-month" key={m.month}>
                          <div className="bar-pair">
                            <div
                              style={{ height: Math.max(2, (m.invoiced / max) * 160) }}
                              title={'Invoiced ' + inr(m.invoiced)}
                            />
                            <div
                              style={{ height: Math.max(2, (m.collected / max) * 160) }}
                              title={'Collected ' + inr(m.collected)}
                            />
                          </div>
                          <span>{m.month}</span>
                          <small>{inr(m.invoiced)}</small>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="dashboard-bottom">
                <div className="panel">
                  <div className="panel-heading">
                    <h2>Upcoming celebrations</h2>
                    {can(profile.role, 'operations') && (
                      <Link href="/admin/events">View events ↗</Link>
                    )}
                  </div>
                  {(overview.upcoming_events ?? []).length ? (
                    (overview.upcoming_events ?? []).map((e: Row) => (
                      <div className="activity-row" key={e.id}>
                        <span className="event-day">
                          {e.event_date.slice(8)}
                          <small>
                            {new Date(e.event_date).toLocaleString('en', { month: 'short' })}
                          </small>
                        </span>
                        <div>
                          <strong>{e.name}</strong>
                          <small>{human(e.status)}</small>
                        </div>
                        <ArrowUpRight size={17} />
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <CalendarDays size={30} />
                      <p>No upcoming events to show.</p>
                    </div>
                  )}
                </div>
                <div className="panel">
                  <div className="panel-heading">
                    <h2>Recent inquiries</h2>
                    {can(profile.role, 'crm') && (
                      <Link href="/admin/inquiries">View inquiries ↗</Link>
                    )}
                  </div>
                  {overview.recent_inquiries?.length ? (
                    overview.recent_inquiries.map((q: Row) => (
                      <div key={q.id} className="activity-row">
                        <span className="avatar">{q.name[0]}</span>
                        <div>
                          <strong>{q.name}</strong>
                          <small>{q.type}</small>
                        </div>
                        <span className="badge">{q.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <Inbox size={30} />
                      <p>Your next conversation starts here.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="quick-actions panel">
                <h2>A good place to start</h2>
                {[
                  ['crm', 'clients', 'Add client'],
                  ['operations', 'events', 'Create event'],
                  ['finance', 'invoices', 'Review invoices'],
                  ['content', 'cms', 'Edit website'],
                ]
                  .filter(([p]) => can(profile.role, p))
                  .map(([, path, label]) => (
                    <Link key={path} href={'/admin/' + path}>
                      {label}
                      <ArrowUpRight size={16} />
                    </Link>
                  ))}
              </div>
            </>
          ) : (
            <>
              <div className="table-toolbar">
                {[
                  'clients',
                  'inquiries',
                  'events',
                  'catalog',
                  'inventory',
                  'marketing',
                  'quotations',
                ].includes(module) && (
                  <label className="search-box">
                    <Search size={16} />
                    <input
                      aria-label="Search records"
                      placeholder={'Search ' + title?.toLowerCase() + '…'}
                      value={search}
                      onChange={(e) => {
                        setPage(0);
                        setSearch(e.target.value);
                      }}
                    />
                  </label>
                )}
                <span>{count} records</span>
                <div className="toolbar">
                  {module === 'deliveries' && (
                    <button className="admin-btn" onClick={() => setAction({ name: 'schedule' })}>
                      Generate delivery schedule
                    </button>
                  )}
                  {module === 'invoices' && (
                    <>
                      <button
                        className="admin-btn secondary"
                        onClick={() => setAction({ name: 'invoice' })}
                      >
                        Create invoice
                      </button>
                      <button className="admin-btn" onClick={() => setAction({ name: 'monthly' })}>
                        Generate monthly drafts
                      </button>
                    </>
                  )}
                  {module === 'media' && (
                    <button className="admin-btn" onClick={() => setAction({ name: 'upload' })}>
                      Upload public image
                    </button>
                  )}
                </div>
              </div>
              {module === 'settings' && <ConfigurationStatus />}
              {module === 'events' && <EventCalendar onOpen={(row) => showDetail(row)} />}
              {module === 'staff' && (
                <button className="admin-btn" onClick={() => setAction({ name: 'invite' })}>
                  Invite staff by email
                </button>
              )}
              {module === 'staff' && (
                <div className="admin-info">
                  Accounts are invitation-only. Invite users through Supabase Auth, then assign
                  profiles using the documented owner procedure. No public registration is enabled.
                </div>
              )}
              {module === 'marketing' && (
                <div className="admin-info">
                  Prepare campaigns for customers with recorded consent. Opening WhatsApp does not
                  mean a message was sent. No bulk sending is enabled.
                </div>
              )}
              {module === 'cms' && (
                <a className="admin-btn secondary" href="/admin/preview" target="_blank">
                  Preview unpublished website ↗
                </a>
              )}
              {module === 'cms' && (
                <div className="admin-info">
                  Edits are saved as drafts. Review the draft details, then explicitly publish. Only
                  published snapshots appear on the website.
                </div>
              )}
              <div className="data-panel">
                {busy ? (
                  <div className="empty-state" aria-busy="true">
                    Loading your records…
                  </div>
                ) : !rows.length ? (
                  <div className="empty-state">
                    <Flower2 size={40} strokeWidth={1} />
                    <h2>A fresh start.</h2>
                    <p>
                      {error
                        ? 'Records could not be loaded.'
                        : 'No records here yet. Your saved business data will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          {spec.columns.map((k) => (
                            <th key={k}>{human(k)}</th>
                          ))}
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id}>
                            {spec.columns.map((k) => (
                              <td key={k}>
                                {k === 'status' ? (
                                  <span className={'badge ' + r[k]}>{human(r[k])}</span>
                                ) : k === 'customer_id' ? (
                                  (customers.find((c) => c.id === r[k])?.name ?? value(k, r[k]))
                                ) : (
                                  <span className="cell-value">{value(k, r[k])}</span>
                                )}
                              </td>
                            ))}
                            <td>{buttons(r)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="pagination">
                <span>Page {page + 1} · 25 per page</span>
                <button
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  disabled={(page + 1) * 25 >= count}
                  onClick={() => setPage(page + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}
        </main>
        <div className="admin-footer">
          Thoughtfully organised. Beautifully in bloom.<span>UMIYA STUDIO</span>
        </div>
      </div>
      {edit && module === 'quotations' && (
        <QuotationDialog
          row={edit}
          customers={customers}
          onClose={() => setEdit(null)}
          onSave={async (data) => {
            await run('save_quote', data);
            setEdit(null);
          }}
        />
      )}
      {edit && module !== 'quotations' && (
        <FormDialog
          title={edit.id ? 'Edit ' + title : 'Add ' + title}
          fields={spec.fields}
          initial={edit}
          customers={customers}
          onClose={() => setEdit(null)}
          onSave={async (values) => {
            await api('/api/admin/' + module, { ...(edit.id ? { id: edit.id } : {}), ...values });
            setEdit(null);
            setNotice('Your changes have been saved.');
            load();
          }}
        />
      )}
      {action && (
        <ActionDialog
          action={action.name}
          row={action.row}
          customers={customers}
          onClose={() => setAction(null)}
          onSubmit={async (values) => {
            if (action.name === 'invite') {
              const r = await api('/api/admin/invite', values);
              setNotice(r.message);
              setAction(null);
              load();
              return;
            }
            if (action.name === 'attachment') {
              setNotice('Private attachment saved.');
              setAction(null);
              load();
              return;
            }
            if (action.name === 'upload') {
              setNotice(values.url);
              setAction(null);
              load();
              return;
            }
            await run(action.name, { ...(action.row ? { id: action.row.id } : {}), ...values });
            setAction(null);
          }}
        />
      )}
      {detail && (
        <Dialog
          title={detail.name ?? title ?? 'Record'}
          onClose={() => {
            setDetail(null);
            setRecipients([]);
          }}
        >
          <div className="record-detail">
            {Object.entries(detail).map(([k, v]) => (
              <div key={k}>
                <strong>{human(k)}</strong>
                <pre>{typeof v === 'object' ? JSON.stringify(v, null, 2) : value(k, v)}</pre>
              </div>
            ))}
            {ledger.length > 0 && (
              <>
                <h3>History</h3>
                <pre>{JSON.stringify(ledger, null, 2)}</pre>
                {module === 'events' && (
                  <p>
                    Estimated contribution:{' '}
                    {inr(detail.agreed_amount - ledger.reduce((n, x) => n + x.amount, 0))}. Based on
                    agreed revenue less recorded direct expenses; cash collection is separate.
                  </p>
                )}
              </>
            )}
            {attachments.map((f) => (
              <div className="activity-row" key={f.id}>
                <span>{f.name}</span>
                <a href={'/api/admin/attachments?id=' + f.id}>Download private file ↗</a>
              </div>
            ))}
            {tasks.map((t) => (
              <div className="activity-row" key={t.id}>
                <span>
                  {t.name} · {t.due_date} · {t.status}
                </span>
                {t.status === 'pending' && (
                  <button
                    className="admin-btn secondary"
                    onClick={() =>
                      run('task_done', { id: t.id })
                        .then(() => showDetail(detail))
                        .catch(() => {})
                    }
                  >
                    Mark done
                  </button>
                )}
              </div>
            ))}
            {Object.entries(history).map(([key, data]) => (
              <div key={key}>
                <strong>{human(key)}</strong>
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </div>
            ))}
            {recipients.map((c) => (
              <div className="activity-row" key={c.id}>
                <strong>{c.name}</strong>
                <a
                  href={
                    'https://wa.me/' +
                    String(c.whatsapp || c.phone).replace(/\D/g, '') +
                    '?text=' +
                    encodeURIComponent(detail.message)
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Open individual WhatsApp ↗
                </a>
              </div>
            ))}
          </div>
        </Dialog>
      )}
      {email && (
        <FormDialog
          title="Review transactional invoice email"
          fields={[
            {
              key: 'to',
              label: 'Customer email (must match client record)',
              type: 'email',
              required: true,
            },
            { key: 'subject', label: 'Subject', required: true },
            { key: 'message', label: 'Message', type: 'textarea', required: true },
          ]}
          initial={email}
          customers={[]}
          onClose={() => setEmail(null)}
          onSave={async (values) => {
            const r = await api('/api/admin/email', {
              ...values,
              invoice_id: email.invoice_id,
              key: email.key ?? crypto.randomUUID(),
            });
            setNotice(r.message);
            setEmail(null);
          }}
        />
      )}
      {share && (
        <Dialog title="Review your WhatsApp message" onClose={() => setShare(null)}>
          <p className="admin-info">
            This link expires in 7 days. Download the PDF to attach it manually. Opening WhatsApp
            does not confirm sending.
          </p>
          <textarea
            className="share-message"
            value={share.message}
            onChange={(e) => setShare({ ...share, message: e.target.value })}
            rows={12}
          />
          <a
            className="admin-btn"
            target="_blank"
            rel="noreferrer"
            href={share.whatsapp.split('?')[0] + '?text=' + encodeURIComponent(share.message)}
            onClick={() =>
              run('share_status', { id: share.share_id, status: 'whatsapp_opened' }).catch(() => {})
            }
          >
            Open WhatsApp ↗
          </a>
          <a className="admin-btn secondary" href={share.invoiceUrl} target="_blank">
            Download PDF
          </a>
          <button
            className="admin-btn secondary"
            onClick={() =>
              run('share_status', { id: share.share_id, status: 'manually_sent' })
                .then(() => setShare(null))
                .catch(() => {})
            }
          >
            I have sent this message
          </button>
        </Dialog>
      )}
    </div>
  );
}
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="admin-dialog" onClose={onClose}>
      <header>
        <h2>{title}</h2>
        <button aria-label="Close dialog" onClick={() => ref.current?.close()}>
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
function FormDialog({
  title,
  fields,
  initial,
  customers,
  onClose,
  onSave,
}: {
  title: string;
  fields: Field[];
  initial: Row;
  customers: Row[];
  onClose: () => void;
  onSave: (values: Row) => Promise<void>;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const flat = Object.fromEntries(new FormData(e.currentTarget)),
      data: Row = {};
    for (const f of fields) if (f.type === 'checkbox') flat[f.key] = flat[f.key] ? 'true' : '';
    for (const [k, v] of Object.entries(flat)) {
      if (k.includes('.')) {
        const [a, b] = k.split('.');
        data[a] ??= {};
        if (v !== '') data[a][b] = v;
      } else data[k] = fields.find((f) => f.key === k)?.type === 'checkbox' ? v === 'true' : v;
    }
    try {
      await onSave(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title={title} onClose={onClose}>
      <form className="admin-form" onSubmit={submit}>
        {fields.map((f) => {
          const val = f.key.split('.').reduce<any>((v, k) => v?.[k], initial) ?? '';
          return (
            <label key={f.key}>
              {f.label}
              {f.type === 'checkbox' ? (
                <input name={f.key} type="checkbox" defaultChecked={!!val} value="true" />
              ) : f.type === 'select' || f.type === 'customer' ? (
                <select name={f.key} defaultValue={val} required={f.required}>
                  <option value="">Select…</option>
                  {f.type === 'customer'
                    ? customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    : f.options?.map((o) => (
                        <option key={o} value={o}>
                          {human(o)}
                        </option>
                      ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea name={f.key} defaultValue={val} required={f.required} rows={3} />
              ) : (
                <input
                  name={f.key}
                  defaultValue={val}
                  required={f.required}
                  type={f.type ?? 'text'}
                  step={f.type === 'number' ? 'any' : undefined}
                />
              )}
            </label>
          );
        })}
        {error && (
          <p role="alert" className="admin-alert">
            {error}
          </p>
        )}
        <button className="admin-btn" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
          <Check size={16} />
        </button>
      </form>
    </Dialog>
  );
}
function ActionDialog({
  action,
  row,
  customers,
  onClose,
  onSubmit,
}: {
  action: string;
  row?: Row;
  customers: Row[];
  onClose: () => void;
  onSubmit: (v: Row) => Promise<void>;
}) {
  const key = useRef(crypto.randomUUID());
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const definitions: Record<string, Field[]> = {
    schedule: [{ key: 'date', label: 'Delivery date', type: 'date', required: true }],
    monthly: [
      {
        key: 'month',
        label: 'Billing month (choose any day in the month)',
        type: 'date',
        required: true,
      },
    ],
    pause: [
      { key: 'start', label: 'Pause from', type: 'date', required: true },
      { key: 'end', label: 'Pause through', type: 'date', required: true },
    ],
    payment: [
      { key: 'amount', label: 'Amount received (paise)', type: 'number', required: true },
      {
        key: 'method',
        label: 'Payment method',
        type: 'select',
        options: ['cash', 'bank', 'upi'],
        required: true,
      },
      { key: 'reference', label: 'Receipt / transaction reference', required: true },
    ],
    stock: [
      { key: 'quantity', label: 'Quantity (+ received / - used)', type: 'number', required: true },
      {
        key: 'reason',
        label: 'Reason',
        type: 'select',
        options: ['purchase', 'received', 'used', 'waste', 'adjustment'],
        required: true,
      },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    invoice: [
      { key: 'customer_id', label: 'Client', type: 'customer', required: true },
      { key: 'event_id', label: 'Event UUID (optional)' },
      { key: 'description', label: 'Item / service description', type: 'textarea', required: true },
      { key: 'amount', label: 'Amount (paise)', type: 'number', required: true },
    ],
    adjust: [
      { key: 'description', label: 'Reason for adjustment', required: true },
      {
        key: 'amount',
        label: 'Adjustment in paise (+ charge / - discount)',
        type: 'number',
        required: true,
      },
    ],
    expense: [
      { key: 'name', label: 'Expense', required: true },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: ['Fresh flowers', 'Labour', 'Transportation', 'Equipment', 'Other'],
        required: true,
      },
      { key: 'amount', label: 'Amount (paise)', type: 'number', required: true },
    ],
    credit: [
      { key: 'amount', label: 'Credit (paise)', type: 'number', required: true },
      { key: 'reason', label: 'Credit reason', type: 'textarea', required: true },
    ],
    invite: [
      { key: 'name', label: 'Staff display name', required: true },
      { key: 'email', label: 'Email (invitation will be sent)', type: 'email', required: true },
      {
        key: 'role',
        label: 'Role',
        type: 'select',
        options: ['admin', 'manager', 'accountant', 'editor'],
        required: true,
      },
    ],
    task: [
      { key: 'name', label: 'Task', required: true },
      { key: 'date', label: 'Due date', type: 'date', required: true },
    ],
    address: [
      { key: 'label', label: 'Address label', required: true },
      { key: 'address', label: 'Address', type: 'textarea', required: true },
    ],
    followup: [
      { key: 'name', label: 'Follow-up note', required: true },
      { key: 'date', label: 'Follow-up date', type: 'date', required: true },
    ],
    subscription_item: [
      { key: 'name', label: 'Flower item', required: true },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true },
      { key: 'amount', label: 'Unit price (paise)', type: 'number', required: true },
    ],
    price: [
      { key: 'date', label: 'Effective date', type: 'date', required: true },
      { key: 'amount', label: 'Daily price (paise)', type: 'number', required: true },
      { key: 'reason', label: 'Reason', required: true },
    ],
    consent: [
      { key: 'source', label: 'Consent evidence/source (or opt-out request)', required: true },
      { key: 'consent', label: 'Customer opted in', type: 'checkbox' },
    ],
    booking: [
      { key: 'date', label: 'Event date', type: 'date', required: true },
      { key: 'venue', label: 'Venue', required: true },
    ],
    finalize: [],
  };
  if (action === 'attachment')
    return <UploadDialog eventId={row?.id} onClose={onClose} onSubmit={onSubmit} />;
  if (action === 'upload') return <UploadDialog onClose={onClose} onSubmit={onSubmit} />;
  return (
    <FormDialog
      title={
        action === 'finalize'
          ? `Finalize UF-${row?.number} · ${inr(row?.total ?? 0)}?`
          : human(action)
      }
      fields={definitions[action] ?? []}
      initial={{ date: today, month: today, reference: '', notes: '' }}
      customers={customers}
      onClose={onClose}
      onSave={(v) =>
        onSubmit({
          ...v,
          key: key.current,
          ...(action === 'invoice' ? { event_id: v.event_id || '' } : {}),
        })
      }
    />
  );
}
function UploadDialog({
  onClose,
  onSubmit,
  eventId,
}: {
  onClose: () => void;
  onSubmit: (v: Row) => Promise<void>;
  eventId?: string;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Dialog
      title={eventId ? 'Upload a private event attachment' : 'Upload promotional photography'}
      onClose={onClose}
    >
      <p className="admin-info">
        {eventId
          ? 'Files stay private and require a short-lived authorized link. JPEG, PNG, WebP or PDF · maximum 10 MB.'
          : 'These images are public. Upload only approved marketing imagery. JPEG, PNG, WebP · maximum 10 MB.'}
      </p>
      <form
        className="admin-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const data = new FormData(e.currentTarget);
            if (eventId) data.set('event_id', eventId);
            const res = await fetch(eventId ? '/api/admin/attachments' : '/api/admin/media', {
              method: 'POST',
              body: data,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            await onSubmit(json);
          } catch (e) {
            setError(String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Image
          <input
            name="file"
            type="file"
            accept={
              eventId
                ? 'image/jpeg,image/png,image/webp,application/pdf'
                : 'image/jpeg,image/png,image/webp'
            }
            required
          />
        </label>
        {!eventId && (
          <label>
            Image description / alt text
            <input name="alt" required maxLength={500} />
          </label>
        )}
        <button className="admin-btn" disabled={busy}>
          {busy ? 'Uploading…' : 'Upload image'}
        </button>
        <p role="alert">{error}</p>
      </form>
    </Dialog>
  );
}

function QuotationDialog({
  row,
  customers,
  onClose,
  onSave,
}: {
  row: Row;
  customers: Row[];
  onClose: () => void;
  onSave: (data: Row) => Promise<void>;
}) {
  const [items, setItems] = useState<Row[]>(
      row.snapshot?.items ?? [{ description: '', quantity: 1, unit_price: 0 }],
    ),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Dialog title="Quotation line items" onClose={onClose}>
      <form
        className="admin-form quote-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSave({
              ...Object.fromEntries(new FormData(e.currentTarget)),
              id: row.id ?? '',
              items,
            });
          } catch (e) {
            setError(String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Title
          <input name="name" defaultValue={row.name ?? ''} required />
        </label>
        <label>
          Client
          <select name="customer_id" defaultValue={row.customer_id ?? ''} required>
            <option value="">Choose client</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Valid until
          <input name="valid_until" type="date" defaultValue={row.valid_until ?? ''} required />
        </label>
        <div className="quote-lines">
          {items.map((item, i) => (
            <div className="quote-line" key={i}>
              <label>
                Description
                <input
                  aria-label={'Line ' + (i + 1) + ' description'}
                  value={item.description}
                  required
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)),
                    )
                  }
                />
              </label>
              <label>
                Quantity
                <input
                  aria-label={'Line ' + (i + 1) + ' quantity'}
                  type="number"
                  min={1}
                  max={10000}
                  value={item.quantity}
                  required
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) =>
                        j === i ? { ...x, quantity: Number(e.target.value) } : x,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Unit price (paise)
                <input
                  aria-label={'Line ' + (i + 1) + ' unit price'}
                  type="number"
                  min={0}
                  step={1}
                  value={item.unit_price}
                  required
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) =>
                        j === i ? { ...x, unit_price: Number(e.target.value) } : x,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                onClick={() => setItems(items.filter((_, j) => j !== i))}
                aria-label={'Remove line ' + (i + 1)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin-btn secondary"
            onClick={() => setItems([...items, { description: '', quantity: 1, unit_price: 0 }])}
          >
            Add line item
          </button>
          <p>Total: {inr(items.reduce((n, x) => n + x.quantity * x.unit_price, 0))}</p>
        </div>
        {error && <p className="admin-alert">{error}</p>}
        <button className="admin-btn" disabled={busy || items.length === 0}>
          {busy ? 'Saving…' : 'Save quotation draft'}
        </button>
      </form>
    </Dialog>
  );
}

function EventCalendar({ onOpen }: { onOpen: (r: Row) => void }) {
  const [month, setMonth] = useState(
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()).slice(0, 7),
    ),
    [events, setEvents] = useState<Row[]>([]),
    [error, setError] = useState('');
  useEffect(() => {
    api('/api/admin/calendar?month=' + month)
      .then((r) => {
        setEvents(r.data ?? []);
        setError('');
      })
      .catch((e) => setError(String(e)));
  }, [month]);
  const start = new Date(month + '-01T00:00:00Z'),
    days = new Date(start.getUTCFullYear(), start.getUTCMonth() + 1, 0).getDate();
  return (
    <div className="panel event-calendar">
      <div className="panel-heading">
        <h2>Event calendar</h2>
        <label>
          Month{' '}
          <input
            aria-label="Calendar month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </div>
      {error && <p className="admin-alert">{error}</p>}
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <strong key={d}>{d}</strong>
        ))}
        {Array.from({ length: start.getUTCDay() }, (_, i) => (
          <div key={'blank' + i} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = month + '-' + String(i + 1).padStart(2, '0');
          return (
            <div key={date}>
              <span>{i + 1}</span>
              {events
                .filter((e) => e.event_date === date)
                .map((e) => (
                  <button key={e.id} onClick={() => onOpen(e)}>
                    {e.name}
                  </button>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfigurationStatus() {
  const [status, setStatus] = useState<Row>({}),
    [error, setError] = useState('');
  useEffect(() => {
    api('/api/admin/configuration')
      .then((r) => setStatus(r.data))
      .catch((e) => setError(String(e)));
  }, []);
  return (
    <div className="panel configuration-panel">
      <h2>Service configuration</h2>
      {error && <p className="admin-alert">{error}</p>}
      <div>
        {Object.entries(status).map(([name, enabled]) => (
          <span key={name} className={'badge ' + (enabled ? 'active' : 'draft')}>
            {human(name)}:{' '}
            {enabled ? 'credentials present · verification pending' : 'not configured'}
          </span>
        ))}
      </div>
      <p>
        Configuration status confirms credential presence only. Verify each service in staging
        before launch.
      </p>
    </div>
  );
}
