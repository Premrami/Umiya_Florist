'use client';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
type DockItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  expanded?: boolean;
};
export function MobileDock({ label, items }: { label: string; items: DockItem[] }) {
  return (
    <nav className="mobile-dock" aria-label={label}>
      {items.map(({ id, label, icon: Icon, href, onClick, active, expanded }) => {
        const content = (
          <>
            <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
            <span>{label}</span>
          </>
        );
        const className = `dock-item${active ? ' is-active' : ''}`;
        if (href?.startsWith('#'))
          return (
            <a
              key={id}
              href={href}
              className={className}
              aria-current={active ? 'location' : undefined}
              onClick={onClick}
            >
              {content}
            </a>
          );
        if (href)
          return (
            <Link
              key={id}
              href={href}
              className={className}
              aria-current={active ? 'page' : undefined}
              onClick={onClick}
            >
              {content}
            </Link>
          );
        return (
          <button
            key={id}
            type="button"
            className={className}
            onClick={onClick}
            aria-expanded={expanded}
            aria-haspopup="dialog"
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
