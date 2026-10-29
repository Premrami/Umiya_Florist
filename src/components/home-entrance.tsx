'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import approvedLogoShapes from '@/lib/intro-logo-shapes.json';
import { EntranceReadyContext } from './entrance-context';

const INTRO_SEEN = 'umiya-seed-intro-v2';

// Keep the y's main strokes in the petal morph; grow its trailing stem and bud last.
function clipYBody(points: number[][]) {
  let result = points;
  for (const [axis, limit] of [
    [0, -75],
    [1, -43],
  ]) {
    const clipped: number[][] = [];
    result.forEach((point, index) => {
      const prior = result[(index + result.length - 1) % result.length];
      const inside = point[axis] <= limit;
      if (inside !== prior[axis] <= limit) {
        const t = (limit - prior[axis]) / (point[axis] - prior[axis]);
        clipped.push([prior[0] + t * (point[0] - prior[0]), prior[1] + t * (point[1] - prior[1])]);
      }
      if (inside) clipped.push(point);
    });
    result = clipped;
  }
  return result;
}
const logoShapes = approvedLogoShapes.map((shape, index) =>
  index === 1
    ? {
        ...shape,
        loops: shape.loops.map(clipYBody).filter((loop) => loop.length >= 3),
      }
    : shape,
);

// Matching point counts keep every petal as the same SVG path through the transformation.
function logoPath(loops: number[][][]) {
  return loops
    .map((points) => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join('') + 'Z')
    .join('');
}
function petalPath(loops: number[][][], layer: number) {
  return loops
    .map(
      (points, loop) =>
        points
          .map((_, index) => {
            const angle = (index / points.length) * Math.PI * 2;
            // Broad, gently notched ivory petals surround the anemone’s burgundy center.
            const width = [32, 27, 4][layer];
            const length = [67, 56, 21][layer];
            const cup = 0.45 + 0.55 * Math.sin(angle / 2);
            const x = loop ? 0 : Math.sin(angle) * width * cup;
            const notch = layer < 2 ? 4 * Math.exp(-Math.pow((angle - Math.PI) / 0.32, 2)) : 0;
            const y = loop ? 0 : -Math.pow(Math.sin(angle / 2), 1.2) * length + notch;
            return `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join('') + 'Z',
    )
    .join('');
}

function SeedArtwork({ prefix = 'entrance' }: { prefix?: string }) {
  return (
    <svg className="intro-plant" viewBox="0 0 640 560" aria-hidden="true" focusable="false">
      <defs>
        {logoShapes.map((_, index) => (
          <linearGradient key={index} id={`${prefix}-morph-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop className="intro-morph-stop" stopColor={index < 24 ? '#fff7e9' : '#a9667a'} />
            <stop
              className="intro-morph-stop"
              offset=".48"
              stopColor={index < 24 ? '#efdfd6' : '#723348'}
            />
            <stop
              className="intro-morph-stop"
              offset="1"
              stopColor={index < 24 ? '#cba5ab' : '#391525'}
            />
          </linearGradient>
        ))}
        <linearGradient id={`${prefix}-rose-outer`} x1=".1" y1="0" x2=".85" y2="1">
          <stop stopColor="#f1ccbb" />
          <stop offset=".35" stopColor="#daa18f" />
          <stop offset=".75" stopColor="#ad6571" />
          <stop offset="1" stopColor="#6d3549" />
        </linearGradient>
        <linearGradient id={`${prefix}-rose-inner`} x1=".25" y1="0" x2=".7" y2="1">
          <stop stopColor="#fff2da" />
          <stop offset=".3" stopColor="#f4d0b8" />
          <stop offset=".7" stopColor="#dcaa9c" />
          <stop offset="1" stopColor="#9a5267" />
        </linearGradient>
        <linearGradient id={`${prefix}-rose-fold`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#efd0b7" />
          <stop offset=".45" stopColor="#d59c8b" />
          <stop offset=".72" stopColor="#a55b66" />
          <stop offset="1" stopColor="#70344c" />
        </linearGradient>
        <linearGradient id={`${prefix}-rose-front`} x1=".4" y1="0" x2=".55" y2="1">
          <stop stopColor="#ffe6cf" />
          <stop offset=".2" stopColor="#e8bca7" />
          <stop offset=".6" stopColor="#c58a87" />
          <stop offset="1" stopColor="#8b4d63" />
        </linearGradient>

        <linearGradient id={`${prefix}-seed`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e2bc83" />
          <stop offset=".3" stopColor="#b77c46" />
          <stop offset=".65" stopColor="#754327" />
          <stop offset="1" stopColor="#342016" />
        </linearGradient>
        <linearGradient id={`${prefix}-stem`} x1="0" y1="1" x2="1" y2="0">
          <stop stopColor="#607653" />
          <stop offset=".5" stopColor="#a5ae78" />
          <stop offset="1" stopColor="#c5b485" />
        </linearGradient>
        <linearGradient id={`${prefix}-leaf`} x1="0" y1="1" x2="1" y2="0">
          <stop stopColor="#344b39" />
          <stop offset=".5" stopColor="#7c9163" />
          <stop offset="1" stopColor="#b5bc87" />
        </linearGradient>
        <radialGradient id={`${prefix}-petal`} cx=".36" cy=".2" r=".85">
          <stop stopColor="#fff8e9" />
          <stop offset=".42" stopColor="#edc7bb" />
          <stop offset=".8" stopColor="#c68e87" />
          <stop offset="1" stopColor="#87545c" />
        </radialGradient>
        <radialGradient id={`${prefix}-heart`}>
          <stop stopColor="#f9e8b0" />
          <stop offset=".55" stopColor="#d3ad62" />
          <stop offset="1" stopColor="#9d6d3f" />
        </radialGradient>
        <filter id={`${prefix}-shadow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <ellipse
        className="intro-ground-shadow"
        cx="320"
        cy="390"
        rx="25"
        ry="4"
        fill="#080304"
        filter={`url(#${prefix}-shadow)`}
      />
      <g className="intro-soil" fill="none" stroke="#b99765" strokeWidth=".6">
        <ellipse cx="320" cy="390" rx="81" ry="5" opacity=".3" />
        <path d="M202 390H270 M370 390H438" opacity=".22" />
      </g>
      <g
        className="intro-roots"
        fill="none"
        stroke="#b09c73"
        strokeWidth="1.1"
        strokeLinecap="round"
      >
        <path d="M320 387C320 405 307 411 312 434S300 462 304 478" />
        <path d="M318 403C303 412 288 408 277 428L265 442" />
        <path d="M314 423C329 433 336 430 346 449L358 461" />
        <path d="M310 447C296 447 288 460 285 471" />
        <path d="M300 414L291 431M337 436L338 455M310 464L322 480" strokeWidth=".6" />
      </g>
      <g transform="translate(320 385)">
        <g className="intro-seed">
          <ellipse
            className="intro-seed-body"
            cx="0"
            cy="0"
            rx="7"
            ry="11"
            transform="rotate(26)"
            fill={`url(#${prefix}-seed)`}
          />
          <path
            d="M-2 -8C-5 -2 -3 6 1 9"
            fill="none"
            stroke="#e4ba7b"
            strokeWidth=".7"
            opacity=".65"
          />
          <path d="M2 -6C0 -2 1 4 3 6" fill="none" stroke="#44291c" strokeWidth=".7" opacity=".7" />
          <ellipse
            cx="-3"
            cy="-5"
            rx="1"
            ry="2.5"
            fill="#ffe0a0"
            opacity=".35"
            transform="rotate(25)"
          />
        </g>
      </g>
      <g className="intro-growth">
        <path
          className="intro-stem"
          d="M320 389C311 366 327 338 318 311C308 283 326 263 322 236C319 217 316 206 320 190"
          fill="none"
          stroke={`url(#${prefix}-stem)`}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <g transform="translate(319 323) rotate(-12)">
          <g className="intro-leaf intro-leaf-left" transform="scale(0) rotate(22)">
            <path
              d="M0 0C-35 -1 -64 -28 -60 -53C-31 -57 -3 -34 0 0Z"
              fill={`url(#${prefix}-leaf)`}
            />
            <path
              d="M0 0L-51 -45M-26 -23L-42 -24M-36 -32L-38 -44"
              fill="none"
              stroke="#bec38b"
              strokeWidth=".7"
              opacity=".5"
            />
          </g>
        </g>
        <g transform="translate(319 277) rotate(6)">
          <g className="intro-leaf intro-leaf-right" transform="scale(0) rotate(-22)">
            <path d="M0 0C32 2 62 -18 64 -44C36 -53 8 -29 0 0Z" fill={`url(#${prefix}-leaf)`} />
            <path
              d="M0 0L54 -37M27 -18L43 -17M39 -26L43 -37"
              fill="none"
              stroke="#cbd095"
              strokeWidth=".7"
              opacity=".5"
            />
          </g>
        </g>
        <g transform="translate(320 192)">
          <path
            className="intro-orbit-path"
            fill="none"
            stroke="#d4b584"
            strokeWidth=".7"
            strokeLinecap="round"
            opacity="0"
          />
          <g className="intro-flower" transform="translate(0 0) scale(1)">
            <path
              className="intro-calyx"
              d="M-2 9C-15 1 -23 -12 -22 -24L-5 -12L1 -31L7 -10L23 -24C21 -8 12 4 2 10Z"
              fill={`url(#${prefix}-leaf)`}
            />
            <g className="intro-bloom" transform="rotate(0)">
              {logoShapes.map((shape, index) => {
                const layer = index < 12 ? 0 : index < 24 ? 1 : 2;
                const ringStart = [0, 12, 24][layer];
                const ringCount = [12, 12, logoShapes.length - 24][layer];
                const angle = (index - ringStart) * (360 / ringCount) + [0, 15, 8][layer];
                return (
                  <g key={index} className="intro-petal-angle" transform={`rotate(${angle})`}>
                    <g className="intro-petal" transform="scale(0.04 0.12)">
                      <path
                        className="intro-flower-surface"
                        d={petalPath(shape.loops, layer)}
                        fillRule="evenodd"
                        fill={`url(#${prefix}-morph-${index})`}
                        stroke="#dfc6bd"
                        strokeWidth=".35"
                      />
                    </g>
                  </g>
                );
              })}
              <g className="intro-flower-heart" opacity="0">
                <circle r="12" fill="#482032" />
                {[...Array(25)].map((_, index) => {
                  const angle = index * 2.4;
                  const radius = 1.2 + Math.sqrt(index) * 2;
                  return (
                    <circle
                      key={index}
                      cx={Number((Math.cos(angle) * radius).toFixed(4))}
                      cy={Number((Math.sin(angle) * radius).toFixed(4))}
                      r="1.4"
                      fill={index % 3 ? '#a66b7e' : '#e6c0bd'}
                    />
                  );
                })}
              </g>
            </g>
            <g transform="translate(-955 -482)">
              <path
                className="intro-y-stem"
                d={FLOURISH}
                fill="none"
                stroke="#c2a06d"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <g transform="translate(955 482)">
                <path
                  className="intro-y-bud"
                  transform="scale(0)"
                  d="M0 0C9 -21 12 -57 28 -72C43 -88 63 -87 80 -76C62 -72 77 -56 69 -40C59 -22 27 -5 0 0Z"
                  fill={`url(#${prefix}-rose-inner)`}
                />
              </g>
            </g>
          </g>
        </g>
      </g>
      <g className="intro-dust" fill="#dec28d">
        {[
          [294, 377],
          [340, 384],
          [308, 365],
          [352, 362],
          [275, 386],
          [328, 350],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 1 : 1.5} />
        ))}
      </g>
    </svg>
  );
}

// Coordinates follow the approved artwork's original 1983 × 793 canvas.
const FLOURISH =
  'M797 437C787 469 754 511 715 504C686 498 684 472 704 457C726 439 782 464 840 486C894 507 940 498 958 478';
const LOGO_BUD =
  'M955 482C964 461 967 425 983 410C998 394 1018 395 1035 406C1017 410 1032 426 1024 442C1014 460 982 477 955 482Z';

function AnimatedLogo() {
  const image = (
    <image
      href="/images/umiya-florist-logo.webp"
      x="280"
      y="215"
      width="1430"
      height="370"
    />
  );
  return (
    <svg
      className="intro-lockup"
      viewBox="280 215 1430 370"
      role="img"
      aria-label="Umiya Florist — Flowers for every occasion"
    >
      <defs>
        <mask
          id="intro-word-mask"
          maskUnits="userSpaceOnUse"
          x="280"
          y="215"
          width="1430"
          height="370"
        >
          <rect x="280" y="215" width="1430" height="320" fill="white" />
          <path d={FLOURISH} fill="none" stroke="black" strokeWidth="26" strokeLinecap="round" />
          <path d={LOGO_BUD} fill="black" />
        </mask>
        <mask
          id="intro-flourish-mask"
          maskUnits="userSpaceOnUse"
          x="280"
          y="215"
          width="1430"
          height="370"
        >
          <path
            className="intro-flourish-reveal"
            d={FLOURISH}
            fill="none"
            stroke="white"
            strokeWidth="26"
            strokeLinecap="round"
          />
        </mask>
        <clipPath id="intro-name-left">
          <rect x="280" y="215" width="755" height="320" />
        </clipPath>
        <clipPath id="intro-name-right">
          <rect x="1035" y="215" width="675" height="320" />
        </clipPath>
        <clipPath id="intro-bud-clip">
          <path d={LOGO_BUD} />
        </clipPath>
        <clipPath id="intro-tagline-clip">
          <rect x="280" y="535" width="1430" height="50" />
        </clipPath>
      </defs>
      <g className="intro-logo-name intro-logo-name-left" transform="translate(0 18)">
        <g mask="url(#intro-word-mask)" clipPath="url(#intro-name-left)">
          {image}
        </g>
      </g>
      <g className="intro-logo-name intro-logo-name-right" transform="translate(0 18)">
        <g mask="url(#intro-word-mask)" clipPath="url(#intro-name-right)">
          {image}
        </g>
      </g>
      <g mask="url(#intro-flourish-mask)">{image}</g>
      <g className="intro-logo-bud" clipPath="url(#intro-bud-clip)">
        {image}
      </g>
      <g className="intro-logo-tagline" clipPath="url(#intro-tagline-clip)">
        {image}
      </g>
      <g className="intro-logo-complete">{image}</g>
    </svg>
  );
}

function BrandIntro({ onStart, onComplete }: { onStart: () => void; onComplete: () => void }) {
  const root = useRef<HTMLElement>(null);
  const complete = useRef<() => void>(() => {});
  useEffect(() => {
    const intro = new URLSearchParams(window.location.search).get('intro');
    const forced = intro === '1';
    if (
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      intro === '0' ||
      (!forced && location.hash && location.hash !== '#home')
    ) {
      onComplete();
      return;
    }
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        sessionStorage.setItem(INTRO_SEEN, 'seen');
      } catch {
        /* The website still opens without storage. */
      }
      onComplete();
    };
    complete.current = finish;
    onStart();
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root.current?.focus({ preventScroll: true });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
      if (event.key === 'Tab') {
        event.preventDefault();
        root.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    const fallback = window.setTimeout(finish, 10000);
    let context: gsap.Context | undefined;
    try {
      context = gsap.context(() => {
        const paths = root.current!.querySelectorAll<SVGPathElement>(
          '.intro-roots path,.intro-stem,.intro-flourish-reveal,.intro-y-stem',
        );
        paths.forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        });
        const art = root.current!.querySelector('.intro-plant')!.getBoundingClientRect();
        const scale = art.width / 640 || 1;
        const seedStart = -(art.top + 385 * scale + 20) / scale;
        const mark = root.current!.querySelector('.intro-logo')!.getBoundingClientRect();
        const logoScale = mark.width / 1430;
        const targetX = mark.left + (955 - 280) * logoScale;
        const targetY = mark.top + (482 - 215) * logoScale;
        const flightX = (targetX - (art.left + 320 * scale)) / scale;
        const flightY = (targetY - (art.top + 192 * scale)) / scale;
        const budScale = logoScale / scale;
        const orbit = root.current!.querySelector<SVGPathElement>('.intro-orbit-path')!;
        orbit.setAttribute(
          'd',
          `M0 0C0 -80 140 -80 140 0C140 80 0 80 0 0C0 -35 ${flightX + 65} ${flightY - 45} ${flightX} ${flightY}`,
        );
        const orbitLength = orbit.getTotalLength();
        gsap.set(orbit, { strokeDasharray: orbitLength, strokeDashoffset: orbitLength });
        const flight = { progress: 0 };
        const flower = root.current!.querySelector<SVGGElement>('.intro-flower')!;
        const timeline = gsap.timeline({ onComplete: finish });
        timeline
          .set('.intro-scene', { xPercent: -50, yPercent: -50, x: 0, y: 0 })
          .set('.intro-logo', { xPercent: -50, yPercent: -50, x: 0, y: 0 })
          .set('.intro-caption', { xPercent: -50, x: 0, y: 8 })
          .set('.intro-seed', { y: seedStart, x: -18, rotation: -35, transformOrigin: 'center' })
          .to('.intro-kicker', { opacity: 0.7, duration: 0.7 }, 0)
          .to('.intro-seed', { y: 0, x: 0, rotation: 12, duration: 1.15, ease: 'power2.in' }, 0.15)
          .to('.intro-seed', { y: -4, rotation: -3, duration: 0.17, ease: 'power2.out' }, 1.3)
          .to('.intro-seed', { y: 0, rotation: 0, duration: 0.24, ease: 'power2.inOut' }, 1.47)
          .to('.intro-soil,.intro-ground-shadow', { opacity: 1, duration: 0.5 }, 0.85)
          .fromTo(
            '.intro-dust circle',
            { opacity: 0, y: 0 },
            { opacity: 0.25, y: -12, stagger: 0.035, duration: 0.25 },
            1.3,
          )
          .to('.intro-dust circle', { opacity: 0, y: -23, duration: 0.7 }, 1.7)
          .to(
            '.intro-roots path',
            { strokeDashoffset: 0, duration: 1.2, stagger: 0.07, ease: 'power2.out' },
            1.65,
          )
          .to(
            '.intro-seed',
            { scaleX: 0.65, scaleY: 0.3, y: 5, opacity: 0, duration: 0.18, ease: 'power2.in' },
            1.72,
          )
          .to('.intro-stem', { strokeDashoffset: 0, duration: 1.85, ease: 'sine.inOut' }, 1.9)
          .to(
            '.intro-leaf-left',
            { attr: { transform: 'scale(1) rotate(0)' }, duration: 1.35, ease: 'sine.out' },
            2.55,
          )
          .to(
            '.intro-leaf-right',
            { attr: { transform: 'scale(1) rotate(0)' }, duration: 1.3, ease: 'sine.out' },
            2.95,
          )
          .to(
            '.intro-petal',
            {
              attr: { transform: 'scale(1 1)' },
              opacity: 1,
              stagger: 0.018,
              duration: 1.05,
              ease: 'sine.inOut',
            },
            3.05,
          )
          .to('.intro-flower-heart', { opacity: 1, duration: 0.65 }, 3.65)
          .to('.intro-kicker', { opacity: 0, duration: 0.45 }, 4.3)
          .to(
            '.intro-leaf,.intro-roots,.intro-stem,.intro-seed,.intro-soil,.intro-ground-shadow,.intro-calyx',
            { opacity: 0, duration: 0.85, stagger: 0.025 },
            4.45,
          )
          .to(orbit, { opacity: 0.4, duration: 0.3 }, 4.45)
          .to(orbit, { strokeDashoffset: 0, duration: 2.15, ease: 'sine.inOut' }, 4.45)
          .to(
            flight,
            {
              progress: 1,
              duration: 2.15,
              ease: 'sine.inOut',
              onUpdate: () => {
                const point = orbit.getPointAtLength(orbitLength * flight.progress);
                const fold = Math.max(0, (flight.progress - 0.68) / 0.32);
                const size = 1 + (budScale - 1) * fold;
                flower.setAttribute('transform', `translate(${point.x} ${point.y}) scale(${size})`);
              },
            },
            4.45,
          )
          .to(
            '.intro-bloom',
            { attr: { transform: 'rotate(360)' }, duration: 1.25, ease: 'sine.inOut' },
            4.45,
          )
          .to(
            '.intro-petal-angle',
            { attr: { transform: 'rotate(0)' }, duration: 1.85, ease: 'sine.inOut' },
            5.65,
          )
          .to(
            '.intro-flower-surface',
            {
              attr: {
                d: (index: number) => logoPath(logoShapes[index].loops),
                'stroke-width': 0,
              },
              duration: 1.85,
              stagger: 0.006,
              ease: 'sine.inOut',
            },
            5.65,
          )
          .to(
            '.intro-morph-stop',
            {
              attr: { 'stop-color': (index: number) => logoShapes[Math.floor(index / 3)].fill },
              duration: 1.85,
              ease: 'sine.inOut',
            },
            5.65,
          )
          .to(
            '.intro-flower-heart',
            { attr: { transform: 'scale(0)' }, duration: 0.65, ease: 'sine.inOut' },
            5.65,
          )
          .to(orbit, { opacity: 0, duration: 0.85 }, 6.3)
          .to('.intro-y-stem', { strokeDashoffset: 0, duration: 0.95, ease: 'sine.inOut' }, 7.45)
          .to(
            '.intro-y-bud',
            { attr: { transform: 'scale(1)' }, duration: 0.55, ease: 'sine.out' },
            8.2,
          )
          .to('.intro-caption', { opacity: 0.7, y: 0, duration: 0.55 }, 8.35)
          .to('.intro-progress-fill', { scaleX: 1, duration: 9.05, ease: 'none' }, 0)
          .to(root.current, { opacity: 0, duration: 0.75, ease: 'sine.inOut' }, 9.05);
      }, root);
    } catch {
      finish();
    }
    return () => {
      complete.current = () => {};
      context?.revert();
      clearTimeout(fallback);
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = priorOverflow;
    };
  }, [onComplete, onStart]);
  return (
    <section
      ref={root}
      className="brand-intro"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Umiya Florist"
      tabIndex={-1}
    >
      <div className="intro-ambient" />
      <div className="intro-grain" />
      <span className="intro-edition">UMIYA FLORIST · AHMEDABAD</span>
      <div className="intro-scene">
        <SeedArtwork />
      </div>
      <div className="intro-logo" style={{ visibility: 'hidden' }} aria-hidden="true">
        <AnimatedLogo />
      </div>
      <span className="intro-kicker">EVERY BEAUTIFUL THING BEGINS SMALL</span>
      <p className="intro-caption">Rooted in care. Made for your moments.</p>
      <div className="intro-bottom">
        <span>A LITTLE BEAUTY IS TAKING ROOT</span>
        <button type="button" onClick={() => complete.current()}>
          Skip intro <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div className="intro-progress" aria-hidden="true">
        <span className="intro-progress-fill" />
      </div>
      <noscript>
        <style>{'.brand-intro { display: none !important; }'}</style>
      </noscript>
    </section>
  );
}

export function HomeEntrance({ children }: { children: React.ReactNode }) {
  const [complete, setComplete] = useState(false);
  const [playing, setPlaying] = useState(false);
  const start = useCallback(() => setPlaying(true), []);
  const finish = useCallback(() => {
    setPlaying(false);
    setComplete(true);
  }, []);
  return (
    <EntranceReadyContext.Provider value={complete}>
      {!complete && <BrandIntro onStart={start} onComplete={finish} />}
      <div className="home-entrance-content" inert={playing} aria-hidden={playing || undefined}>
        {children}
      </div>
    </EntranceReadyContext.Provider>
  );
}
