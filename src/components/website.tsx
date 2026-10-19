'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDown,
  Menu,
  X,
  Flower2,
  MoveRight,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { photos, type PublicContent, type CatalogItem } from '@/lib/public-content';
import { inr } from '@/lib/business';
const nav = [
  ['Home', 'home'],
  ['About', 'about'],
  ['Flowers', 'flowers'],
  ['Pooja Flowers', 'pooja'],
  ['Decorations', 'decorations'],
  ['Our Work', 'work'],
  ['Testimonials', 'testimonials'],
  ['Contact', 'contact'],
];
function Botanical() {
  return (
    <svg className="botanical" viewBox="0 0 110 100" aria-hidden="true">
      <path className="stem" d="M15 98 Q53 77 60 28 M39 78 Q18 55 21 40 M51 58 Q83 60 91 40" />
      <ellipse className="leaf" cx="25" cy="48" rx="8" ry="17" transform="rotate(-35 25 48)" />
      <ellipse className="leaf" cx="81" cy="49" rx="8" ry="18" transform="rotate(48 81 49)" />
      {[0, 60, 120, 180, 240, 300].map((r) => (
        <ellipse
          className="petal"
          key={r}
          cx="60"
          cy="16"
          rx="7"
          ry="14"
          transform={`rotate(${r} 60 28)`}
        />
      ))}
      <circle cx="60" cy="28" r="5" />
    </svg>
  );
}
function Brand({ name, logo }: { name?: string; logo?: string }) {
  return (
    <a className="wordmark" href="#home">
      {logo ? (
        <Image src={logo} width={38} height={38} alt="Studio logo" />
      ) : (
        <Flower2 size={32} strokeWidth={1} />
      )}
      <span>
        {name && name !== 'Umiya Florist' ? name : 'UMIYA'}
        <small>F L O R I S T</small>
      </span>
    </a>
  );
}
function Modal({
  children,
  title,
  onClose,
  className = 'inquiry-dialog',
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className={className} aria-label={title} onClose={onClose}>
      <button
        className="dialog-close"
        aria-label="Close dialog"
        onClick={() => ref.current?.close()}
      >
        <X />
      </button>
      {children}
    </dialog>
  );
}
export function Website({ content: c }: { content: PublicContent }) {
  const root = useRef<HTMLDivElement>(null),
    [menu, setMenu] = useState(false),
    [filter, setFilter] = useState('All flowers'),
    [item, setItem] = useState<CatalogItem | null>(null),
    [inquiry, setInquiry] = useState(''),
    [service, setService] = useState('Weddings'),
    [gallery, setGallery] = useState<number | null>(null);
  const hero = c.sections.hero ?? {},
    about = c.sections.about ?? {},
    pooja = c.sections.pooja ?? {},
    contact = c.sections.contact ?? {};
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero .reveal', {
        y: 35,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
      });
      gsap.from('.hero-image', {
        scale: 1.025,
        y: 15,
        duration: 1.3,
        ease: 'power3.inOut',
      });
      gsap.registerPlugin(ScrollTrigger);
      gsap.utils.toArray<HTMLElement>('.section-top,.about-copy,.pooja-copy').forEach((el) =>
        gsap.from(el, {
          y: 24,
          opacity: 0,
          duration: 0.8,
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        }),
      );
    }, root);
    return () => ctx.revert();
  }, []);
  const open = (type: string) => {
    setItem(null);
    setInquiry(type);
  };
  const categories = ['All flowers', ...new Set(c.catalog.map((x) => x.category))];
  return (
    <div className="website" ref={root}>
      {c.preview && (
        <div className="preview-bar">
          DESIGN PREVIEW
          <span>
            {' '}
            · {c.previewLabel || 'Reference photography & collections · Backend setup pending'}
          </span>
          <Link href="/login">
            Owner access <ArrowUpRight size={12} />
          </Link>
        </div>
      )}
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <Brand name={c.settings.name} logo={c.settings.logo_url} />
        <nav aria-label="Main navigation">
          {nav.map(([n, id]) => (
            <a key={id} href={'#' + id}>
              {n}
            </a>
          ))}
        </nav>
        <a className="header-contact" href="#contact">
          Let’s talk flowers <ArrowUpRight size={17} />
        </a>
        <button
          className="mobile-menu"
          aria-label="Open menu"
          aria-expanded={menu}
          onClick={() => setMenu(true)}
        >
          <Menu />
        </button>
      </header>
      {menu && (
        <Modal title="Navigation" className="mobile-nav" onClose={() => setMenu(false)}>
          {nav.map(([n, id]) => (
            <a key={id} href={'#' + id} onClick={() => setMenu(false)}>
              {n}
            </a>
          ))}
        </Modal>
      )}
      <main id="main">
        <section id="home" className="hero">
          <div className="hero-copy">
            <div className="eyebrow reveal">
              <span /> UMIYA FLORIST · AHMEDABAD
            </div>
            <h1 className="reveal">
              {hero.headline || (
                <>
                  Where flowers
                  <br />
                  become <em>memories.</em>
                </>
              )}
            </h1>
            <p className="reveal">
              {hero.description ||
                'Thoughtfully gathered. Beautifully given. Flowers for everyday rituals and life’s extraordinary moments.'}
            </p>
            <div className="hero-actions reveal">
              <a className="button botanical-button" href="#flowers">
                Explore our flowers <ArrowUpRight size={18} />
                <Botanical />
              </a>
              <a className="text-link" href="#decorations">
                Plan your decoration <MoveRight size={18} />
              </a>
            </div>
            <div className="hero-caption reveal">
              <span className="tiny-star">✳</span>
              <span>
                FOR LOVE. FOR DEVOTION.
                <br />
                FOR EVERY BEAUTIFUL REASON.
              </span>
            </div>
          </div>
          <div className="hero-image">
            <Image
              src={hero.image_url || photos.hero}
              alt="An expressive bouquet of roses and seasonal flowers"
              fill
              priority
              sizes="(max-width:700px) 100vw, 60vw"
            />
            <div className="image-shade" />
            <span className="vertical-caption">THE ART OF GIVING, BEAUTIFULLY REIMAGINED</span>
            <div className="hero-image-label">
              <span>01 / THE FLORAL EDIT</span>
              <span>
                Made with feeling <i>✶</i>
              </span>
            </div>
          </div>
          <a className="scroll-note" href="#about">
            <ArrowDown size={15} /> A little beauty awaits below
          </a>
          <span className="hero-edition">FRESH FLOWERS. TIMELESS FEELINGS.</span>
        </section>
        <div className="ribbon">
          {[
            'BOUQUETS & BLOOMS',
            'WEDDINGS & CELEBRATIONS',
            'DAILY DEVOTION',
            'THOUGHTFULLY, ALWAYS',
          ].map((n) => (
            <span key={n}>
              {n} <i>✳</i>
            </span>
          ))}
        </div>
        <section id="about" className="about section-pad">
          <div className="about-image">
            <Image
              fill
              src={about.image_url || photos.bouquet}
              alt="Seasonal flowers arranged with care"
              sizes="(max-width:700px) 90vw, 40vw"
            />
            <div className="image-stamp">
              GATHERED<em>with love</em>
              <Flower2 size={24} />
            </div>
          </div>
          <div className="about-copy">
            <div className="eyebrow">01 — A NOTE FROM OUR STUDIO</div>
            <h2>
              {about.headline || (
                <>
                  Some things are
                  <br />
                  better said <em>in flowers.</em>
                </>
              )}
            </h2>
            <p>
              {about.description ||
                'Flowers are the language of love, devotion, celebration, and remembrance. At Umiya Florist, we bring that language to life — one thoughtful arrangement at a time.'}
            </p>
            <p>
              From the flowers that begin your morning rituals to the blooms that frame your biggest
              days, we make room for beauty in every moment.
            </p>
            <a href="#contact" className="text-link">
              Let’s create something meaningful <ArrowUpRight size={18} />
            </a>
            <div className="signature">With flowers, with feeling.</div>
          </div>
        </section>
        <section id="flowers" className="collections section-pad">
          <div className="section-top">
            <div>
              <div className="eyebrow">02 — THE FLOWER COLLECTION</div>
              <h2>
                {c.sections.collections?.headline || (
                  <>
                    A gesture. A feeling.
                    <br />
                    <em>A beautiful bunch.</em>
                  </>
                )}
              </h2>
            </div>
            <p>
              For the grand declarations.
              <br />
              And the just-because moments.
            </p>
          </div>
          <div className="filter-row" aria-label="Filter collections">
            {categories.map((n) => (
              <button
                key={n}
                className={filter === n ? 'active' : ''}
                aria-pressed={filter === n}
                onClick={() => setFilter(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flower-grid">
            {c.catalog
              .filter((x) => filter === 'All flowers' || x.category === filter)
              .map((x, i) => (
                <button className="flower-card" key={x.id} onClick={() => setItem(x)}>
                  <div className="flower-photo">
                    <Image
                      fill
                      src={x.image_url || photos.roses}
                      alt={x.name}
                      sizes="(max-width:700px) 90vw, 30vw"
                    />
                    <span className="collection-number">0{i + 1}</span>
                    <span className="circle-arrow">
                      <ArrowUpRight size={22} />
                    </span>
                  </div>
                  <div className="flower-card-bottom">
                    <div>
                      <small>{x.category}</small>
                      <h3>{x.name}</h3>
                    </div>
                    {x.price != null && <span>{inr(x.price)}</span>}
                  </div>
                </button>
              ))}
          </div>
          {!c.catalog.length && (
            <p>Our next collection is being gathered. Enquire for a custom arrangement.</p>
          )}
          <button className="text-link collection-custom" onClick={() => open('Custom Bouquet')}>
            Something uniquely yours? Build a bouquet inquiry <Plus size={18} />
          </button>
        </section>
        <section id="pooja" className="pooja">
          <div className="pooja-copy">
            <div className="eyebrow">03 — EVERYDAY, SACRED</div>
            <h2>
              {pooja.headline || (
                <>
                  A fresh beginning.
                  <br />
                  <em>Every morning.</em>
                </>
              )}
            </h2>
            <p>
              {pooja.description ||
                'Fresh jasmine, marigolds, rose petals and lovingly strung garlands. Flowers for your daily pooja, your home, and your moments of devotion.'}
            </p>
            <div className="pooja-tags">
              <span>Loose flowers</span>
              <span>Fresh garlands</span>
              <span>Recurring supply</span>
            </div>
            <button className="button" onClick={() => open('Pooja Flower Subscription')}>
              Enquire about daily flowers <ArrowUpRight size={18} />
            </button>
            <small>Tell us your requirements. We’ll help you plan your supply.</small>
          </div>
          <div className="pooja-image">
            <Image
              fill
              src={pooja.image_url || photos.petals}
              alt="Fresh flowers for everyday rituals"
              sizes="(max-width:700px) 100vw, 50vw"
            />
            <span>BEAUTY IN THE EVERYDAY</span>
          </div>
        </section>
        <section id="decorations" className="decorations section-pad">
          <div className="section-top">
            <div>
              <div className="eyebrow">04 — OCCASIONS, TRANSFORMED</div>
              <h2>
                {c.sections.decorations?.headline || (
                  <>
                    Your moments.
                    <br />
                    <em>Our floral imagination.</em>
                  </>
                )}
              </h2>
            </div>
            <button className="text-link" onClick={() => open('Event Decoration')}>
              Plan your event <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="event-tabs">
            {[
              'Weddings',
              'Engagements',
              'Birthdays',
              'Anniversaries',
              'Corporate Events',
              'Religious Ceremonies',
              'Home Decorations',
              'Artificial Flowers',
              'Balloon Decorations',
              'Custom Events',
            ].map((s) => (
              <button
                key={s}
                className={service === s ? 'active' : ''}
                aria-pressed={service === s}
                onClick={() => setService(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="event-feature">
            <Image
              fill
              src={c.services.find((x) => x.name === service)?.image_url || photos.wedding}
              alt="Editorial reference for floral event styling"
              sizes="100vw"
            />
            <div className="event-overlay" />
            <div className="event-feature-copy">
              <span className="eyebrow">CELEBRATE BEAUTIFULLY</span>
              <h3>
                {service},<br />
                <em>with a little wonder.</em>
              </h3>
              <p>
                {c.services.find((x) => x.name === service)?.description ||
                  'From the first idea to the final stem, let’s create a setting that feels entirely yours.'}
              </p>
              <button className="button light" onClick={() => open(service)}>
                Let’s dream together <ArrowUpRight size={18} />
              </button>
            </div>
          </div>
        </section>
        <section id="work" className="work section-pad">
          <div className="section-top">
            <div>
              <div className="eyebrow">05 — OUR WORK</div>
              <h2>
                {c.sections.work?.headline || (
                  <>
                    Beautiful moments,
                    <br />
                    <em>beautifully remembered.</em>
                  </>
                )}
              </h2>
            </div>
            <span className="quiet">
              {c.portfolio.length
                ? 'A selection from our studio.'
                : 'Our approved project gallery is coming soon.'}
            </span>
          </div>
          {c.portfolio.length ? (
            <div className="portfolio-grid">
              {c.portfolio.map((w, i) => (
                <button key={w.id} onClick={() => setGallery(i)}>
                  <Image width={900} height={700} src={w.image_url} alt={w.name} />
                  <h3>{w.name}</h3>
                </button>
              ))}
            </div>
          ) : (
            <div className="work-note">
              <Flower2 size={52} strokeWidth={1} />
              <p>
                Every celebration has its own story.
                <br />
                Tell us about the one you’re planning.
              </p>
              <button className="text-link" onClick={() => open('Event Decoration')}>
                Start a conversation <ArrowUpRight size={18} />
              </button>
            </div>
          )}
        </section>
        <section className="why section-pad">
          <div className="eyebrow">THE UMIYA TOUCH</div>
          <h2>
            {c.sections.why?.headline || (
              <>
                It’s all in <em>the details.</em>
              </>
            )}
          </h2>
          <div>
            {[
              ['01', 'Freshness, first', 'Beautiful stems, chosen with care.'],
              ['02', 'Made for you', 'Personal arrangements for your occasion.'],
              ['03', 'Everyday & extraordinary', 'From morning rituals to milestone celebrations.'],
              ['04', 'A personal touch', 'Thoughtful service, from idea to arrangement.'],
            ].map(([n, t, d]) => (
              <article key={n}>
                <small>{n}</small>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="testimonials" className="testimonials section-pad">
          <div className="eyebrow">WORDS WE TREASURE</div>
          {c.testimonials.length ? (
            c.testimonials.map((t) => (
              <blockquote key={t.id}>
                “{t.quote}”<cite>{t.display_name}</cite>
              </blockquote>
            ))
          ) : (
            <>
              <h2>
                {c.sections.testimonials?.headline || (
                  <>
                    The loveliest stories
                    <br />
                    are still <em>being gathered.</em>
                  </>
                )}
              </h2>
              <p>Customer reflections appear here after approval.</p>
            </>
          )}
        </section>
        {c.social.length > 0 && (
          <section className="social section-pad">
            <div className="eyebrow">A LITTLE MORE FROM OUR STUDIO</div>
            <h2>
              In good <em>company.</em>
            </h2>
            <div className="portfolio-grid">
              {c.social.map((s) => (
                <figure key={s.id}>
                  <Image src={s.image_url} width={800} height={800} alt={s.alt_text} />
                  <figcaption>{s.name}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
        {c.faqs.length > 0 && (
          <section className="section-pad faq-section">
            <h2>
              A few <em>thoughtful answers.</em>
            </h2>
            {c.faqs.map((f) => (
              <details key={f.id}>
                <summary>{f.name}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </section>
        )}
        <section id="contact" className="contact section-pad">
          <div>
            <div className="eyebrow">LET SOMETHING BEAUTIFUL BEGIN</div>
            <h2>
              {contact.headline || (
                <>
                  Tell us what
                  <br />
                  you’re <em>dreaming of.</em>
                </>
              )}
            </h2>
            <p>
              {contact.description ||
                'A bouquet, a daily ritual, a once-in-a-lifetime celebration. We’d love to be a part of it.'}
            </p>
            <div className="contact-details">
              <span>{c.settings.service_areas || 'AHMEDABAD, GUJARAT'}</span>
              {c.settings.address && <p>{c.settings.address}</p>}
              {c.settings.hours && <p>{c.settings.hours}</p>}
              {c.settings.phone && <a href={'tel:' + c.settings.phone}>{c.settings.phone}</a>}
              {c.settings.whatsapp && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={'https://wa.me/' + c.settings.whatsapp.replace(/\D/g, '')}
                >
                  Chat on WhatsApp ↗
                </a>
              )}
            </div>
          </div>
          <InquiryForm type="General" compact />
        </section>
      </main>
      <footer>
        <nav className="footer-nav" aria-label="Footer navigation">
          {nav.map(([name, id]) => (
            <a key={id} href={'#' + id}>
              {name}
            </a>
          ))}
        </nav>
        <div className="footer-top">
          <Brand name={c.settings.name} logo={c.settings.logo_url} />
          <p>{c.sections.footer?.description || 'Flowers for every beautiful reason.'}</p>
          <a href="#home">Back to top ↑</a>
        </div>
        <div className="footer-name">
          UMIYA FLORIST<span>✳</span>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Umiya Florist</span>
          <div>
            <a href="/privacy">Privacy</a>
            {c.settings.instagram && <a href={c.settings.instagram}>Instagram ↗</a>}
            <Link href="/login">Studio access ↗</Link>
          </div>
        </div>
      </footer>
      {item && (
        <Modal title={item.name} className="collection-dialog" onClose={() => setItem(null)}>
          <Image src={item.image_url || photos.roses} width={600} height={650} alt={item.name} />
          <div>
            <span className="eyebrow">{item.category}</span>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            {item.price != null && <p>From {inr(item.price)}</p>}
            <button className="button" onClick={() => open('Bouquet: ' + item.name)}>
              Enquire about this arrangement <ArrowUpRight size={18} />
            </button>
          </div>
        </Modal>
      )}
      {inquiry && (
        <Modal title="Flower inquiry" onClose={() => setInquiry('')}>
          <span className="eyebrow">LET’S MAKE IT MEANINGFUL</span>
          <h2>
            {inquiry === 'Custom Bouquet' ? 'Your bouquet, your way.' : 'A beautiful beginning.'}
          </h2>
          <InquiryForm type={inquiry} />
        </Modal>
      )}
      {gallery !== null && c.portfolio[gallery] && (
        <Modal
          className="gallery-dialog"
          title="Portfolio gallery"
          onClose={() => setGallery(null)}
        >
          <div
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') setGallery((gallery + 1) % c.portfolio.length);
              if (e.key === 'ArrowLeft')
                setGallery((gallery - 1 + c.portfolio.length) % c.portfolio.length);
            }}
          >
            <Image
              src={c.portfolio[gallery].image_url}
              width={1200}
              height={800}
              alt={c.portfolio[gallery].name}
            />
            <h3>{c.portfolio[gallery].name}</h3>
            <button
              aria-label="Previous photo"
              onClick={() => setGallery((gallery - 1 + c.portfolio.length) % c.portfolio.length)}
            >
              <ChevronLeft />
            </button>
            <button
              aria-label="Next photo"
              onClick={() => setGallery((gallery + 1) % c.portfolio.length)}
            >
              <ChevronRight />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function InquiryForm({ type, compact = false }: { type: string; compact?: boolean }) {
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState(''),
    [summary, setSummary] = useState<Record<string, string>>({}),
    key = useRef('');
  const custom = type === 'Custom Bouquet',
    pooja = type === 'Pooja Flower Subscription',
    event = !custom && !pooja && type !== 'General' && !type.startsWith('Bouquet:');
  const select = (name: string, label: string, options: string[]) => (
    <label key={name}>
      {label}
      <select
        aria-label={label}
        name={name}
        required
        onChange={(e) => setSummary({ ...summary, [label]: e.target.value })}
      >
        <option value="">Choose an option</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    const form = e.currentTarget,
      data = Object.fromEntries(new FormData(form));
    key.current ||= crypto.randomUUID();
    try {
      const r = await fetch('/api/public/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type,
          idempotency_key: key.current,
          marketing_consent: data.marketing_consent === 'on',
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error);
      setStatus('Thank you. Your inquiry has been received. We’ll be in touch.');
      form.reset();
      setSummary({});
      key.current = '';
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="inquiry-form" method="post" action="/api/public/inquiries" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Your name
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            placeholder="Full name"
          />
        </label>
        <label>
          Phone number
          <input
            name="phone"
            type="tel"
            required
            pattern={String.raw`\+?[0-9 \(\)\-]{10,20}`}
            autoComplete="tel"
            placeholder="+91"
          />
        </label>
        {!compact && (
          <label>
            Email (optional)
            <input name="email" type="email" autoComplete="email" />
          </label>
        )}
        {custom && (
          <>
            {select('occasion', 'Occasion', [
              'Birthday',
              'Anniversary',
              'Wedding',
              'Just because',
              'Other',
            ])}
            {select('flowers', 'Flowers', ['Roses', 'Lilies', 'Seasonal mix', 'Florist’s choice'])}
            {select('palette', 'Colour palette', [
              'Burgundy & blush',
              'Ivory & green',
              'Bright & joyful',
              'Soft pastels',
            ])}
            {select('size', 'Bouquet size', ['Petite', 'Classic', 'Grand'])}
            {select('wrapping', 'Wrapping', ['Natural paper', 'Ivory wrap', 'Luxury wrap'])}
            <label>
              Message for the recipient
              <input name="gift_message" maxLength={300} />
            </label>
          </>
        )}
        {pooja && (
          <>
            <label>
              Delivery address / area
              <input name="address" required maxLength={500} />
            </label>
            {select('frequency', 'Delivery frequency', ['Daily', 'Weekdays', 'Weekly', 'Custom'])}
            <label>
              Flower requirements
              <input name="flowers" required maxLength={500} />
            </label>
          </>
        )}
        {event && (
          <>
            <label>
              Event type
              <input
                name="event_type"
                required
                defaultValue={type === 'Event Decoration' ? '' : type}
                maxLength={100}
              />
            </label>
            <label>
              Venue / location
              <input name="venue" required maxLength={300} />
            </label>
            <label>
              Expected guests
              <input name="guests" type="number" min={1} max={100000} />
            </label>
            {select('preferred_contact', 'Preferred contact', ['Phone', 'WhatsApp', 'Email'])}
          </>
        )}
        {!compact && (
          <>
            <label>
              {event ? 'Event date' : 'Preferred date'}
              <input
                name="date"
                type="date"
                required={event}
                min={new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
                  new Date(),
                )}
              />
            </label>
            <label>
              Approximate budget (₹)
              <input name="budget" maxLength={100} />
            </label>
          </>
        )}
        <label className="full">
          {compact ? 'What can we create for you?' : 'Tell us a little more'}
          <textarea
            name="message"
            rows={3}
            required
            minLength={5}
            maxLength={3000}
            placeholder="Your occasion, your ideas, your favourite flowers…"
          />
        </label>
      </div>
      {custom && Object.keys(summary).length > 0 && (
        <div className="selection-summary">
          <span className="eyebrow">YOUR SELECTION</span>
          <p>
            {Object.entries(summary)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' · ')}
          </p>
          <small>A curated inquiry, to be confirmed by our florist.</small>
        </div>
      )}
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave blank
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="consent">
        <input type="checkbox" name="marketing_consent" /> Send me occasional floral updates and
        offers. Optional.
      </label>
      <p className="privacy-note">
        We use your details to respond to this inquiry. <a href="/privacy">Privacy notice</a>
      </p>
      <button className="button" disabled={busy}>
        {busy ? 'Sending…' : 'Send your inquiry'}
        <ArrowUpRight size={18} />
      </button>
      {status && (
        <p className="form-status" role="status">
          {status}
        </p>
      )}
    </form>
  );
}
