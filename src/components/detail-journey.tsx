'use client';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
export function DetailJourney({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{
    width: number;
    height: number;
    connections: string[];
  } | null>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      // Layout coordinates stay stable while the existing GSAP card reveals run.
      const cards = Array.from(element.querySelectorAll<HTMLElement>(':scope > article'));
      const connections: string[] = [];
      for (let i = 0; i < cards.length - 1; i++) {
        const a = cards[i],
          b = cards[i + 1];
        const sameRow = Math.abs(a.offsetTop - b.offsetTop) < 4;
        const start: [number, number] = sameRow
          ? [a.offsetLeft + a.offsetWidth, a.offsetTop + a.offsetHeight / 2]
          : [a.offsetLeft + a.offsetWidth / 2, a.offsetTop + a.offsetHeight];
        const end: [number, number] = sameRow
          ? [b.offsetLeft, b.offsetTop + b.offsetHeight / 2]
          : [b.offsetLeft + b.offsetWidth / 2, b.offsetTop];
        const number = (n: number) => Math.round(n * 10) / 10;
        const startPoint = start.map(number).join(' ');
        const endPoint = end.map(number).join(' ');
        const middleY = number((start[1] + end[1]) / 2);
        connections.push(
          sameRow || Math.abs(end[0] - start[0]) < 4
            ? `M ${startPoint} L ${endPoint}`
            : `M ${startPoint} V ${middleY} H ${number(end[0])} V ${number(end[1])}`,
        );
      }
      setLayout({ width: element.clientWidth, height: element.clientHeight, connections });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    element.querySelectorAll('article').forEach((card) => resize.observe(card));
    const visibility = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      threshold: 0.12,
    });
    visibility.observe(element);
    schedule();
    document.fonts?.ready.then(() => {
      if (!disposed) schedule();
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
    };
  }, []);
  return (
    <div className="detail-journey" ref={root} data-journey-active={active}>
      {children}
      {layout && layout.width > 0 && (
        <svg
          className="detail-thread"
          data-journey-decoration
          aria-hidden="true"
          focusable="false"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
          height={layout.height}
        >
          {layout.connections.map((connection, index) => (
            <g
              className="detail-connection"
              key={index}
              style={
                {
                  '--thread-delay': `${index * 1.45}s`,
                  '--draw-delay': `${0.35 + index * 0.35}s`,
                } as CSSProperties
              }
            >
              <path className="detail-thread-rail" d={connection} pathLength="1" />
              <path className="detail-thread-flow" d={connection} pathLength="1" />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
