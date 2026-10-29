import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import type { RefObject } from 'react';
export function startWebsiteMotion(root: RefObject<HTMLDivElement | null>) {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const ctx = gsap.context(() => {
      // Measure all reveal groups before GSAP writes any transforms/styles.
      const initialBelowFold = new WeakMap<HTMLElement, boolean>();
      root.current
        ?.querySelectorAll<HTMLElement>(
          '.section-top,.about-copy,.pooja-copy,.contact > div,.event-feature-copy,.testimonials,.social,.why,.faq-section,.flower-grid,.portfolio-grid,.why > div:last-child,.filter-row,.event-tabs,.work-note,.inquiry-form,.faq-section details,.contact-details,.section-image-viewport',
        )
        .forEach((element) =>
          initialBelowFold.set(
            element,
            element.getBoundingClientRect().top >= window.innerHeight * 0.9,
          ),
        );
      gsap.from('.hero .reveal', {
        y: 22,
        opacity: 0,
        duration: 1.15,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });
      gsap.from('.hero-image', {
        scale: 1.035,
        duration: 1.8,
        ease: 'sine.out',
        clearProps: 'transform',
      });
      const belowFold = (element: HTMLElement) => initialBelowFold.get(element) ?? false;
      // Reveal related copy together so headings, descriptions, and actions read as one sequence.
      gsap.utils
        .toArray<HTMLElement>(
          '.section-top,.about-copy,.pooja-copy,.contact > div,.event-feature-copy,.testimonials,.social,.why,.faq-section',
        )
        .forEach((group) => {
          if (!belowFold(group)) return;
          const copy = group.querySelectorAll<HTMLElement>(
            ':scope > .eyebrow,:scope > h2,:scope > h3,:scope > p,:scope > blockquote,:scope > .text-link,:scope > .signature,:scope > .button,:scope > .quiet,:scope > div > .eyebrow,:scope > div > h2',
          );
          if (!copy.length) return;
          gsap.from(copy, {
            y: 24,
            opacity: 0,
            duration: 1,
            stagger: 0.09,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: group, start: 'top 90%', once: true },
          });
        });
      gsap.utils
        .toArray<HTMLElement>('.flower-grid,.portfolio-grid,.why > div:last-child')
        .forEach((grid) => {
          if (!belowFold(grid) || !grid.children.length) return;
          gsap.from(Array.from(grid.children), {
            y: 32,
            opacity: 0,
            duration: 1.05,
            stagger: Math.min(0.11, 0.44 / grid.children.length),
            ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: grid, start: 'top 93%', once: true },
          });
        });
      gsap.utils
        .toArray<HTMLElement>(
          '.filter-row,.event-tabs,.work-note,.inquiry-form,.faq-section details,.contact-details',
        )
        .forEach((element) => {
          if (!belowFold(element)) return;
          gsap.from(element, {
            y: 18,
            opacity: 0,
            duration: 0.9,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: element, start: 'top 95%', once: true },
          });
        });
      gsap.utils.toArray<HTMLElement>('.section-image-viewport').forEach((frame) => {
        if (!belowFold(frame)) return;
        gsap.fromTo(
          frame,
          { clipPath: 'inset(12% 0% 12% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.4,
            ease: 'power2.inOut',
            clearProps: 'clipPath',
            scrollTrigger: { trigger: frame, start: 'top 93%', once: true },
          },
        );
      });
      gsap.to('.reading-progress span', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
        },
      });
    }, root);
    let scroll: gsap.core.Tween | undefined;
    const priorScrollBehavior = document.documentElement.style.scrollBehavior;
    const restoreScrollBehavior = () => {
      document.documentElement.style.scrollBehavior = priorScrollBehavior;
    };
    const interrupt = () => {
      scroll?.kill();
      restoreScrollBehavior();
    };
    const keyInterrupt = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key))
        interrupt();
    };
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const hash = link.getAttribute('href')!;
      const target = document.getElementById(hash.slice(1));
      if (!target || hash === '#main') return;
      event.preventDefault();
      interrupt();
      const header = root.current?.querySelector('.site-header');
      const offset = (header?.getBoundingClientRect().height ?? 80) + 12;
      const distance = Math.abs(target.getBoundingClientRect().top - offset);
      // Native CSS smooth scrolling must yield to the animation's frame updates.
      document.documentElement.style.scrollBehavior = 'auto';
      scroll = gsap.to(window, {
        scrollTo: { y: target, offsetY: offset, autoKill: true },
        duration: Math.min(1.65, Math.max(0.65, distance / 2400)),
        ease: 'power2.inOut',
        onInterrupt: restoreScrollBehavior,
        onComplete: () => {
          restoreScrollBehavior();
          if (window.location.hash !== hash) history.pushState(null, '', hash);
          const hadTabIndex = target.hasAttribute('tabindex');
          if (!hadTabIndex) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          if (!hadTabIndex) {
            target.addEventListener('blur', () => target.removeAttribute('tabindex'), {
              once: true,
            });
          }
        },
      });
    };
    const site = root.current;
    site?.addEventListener('click', navigate);
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('keydown', keyInterrupt);
    return () => {
      interrupt();
      site?.removeEventListener('click', navigate);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('keydown', keyInterrupt);
      ctx.revert();
    };
  });
  // Keep scroll-linked photography movement to pointer-driven desktop layouts.
  media.add(
    '(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    () => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.section-image-viewport').forEach((frame) => {
          const image = frame.querySelector('img');
          if (!image) return;
          gsap.fromTo(
            image,
            { scale: 1.09, yPercent: -3 },
            {
              scale: 1.09,
              yPercent: 3,
              ease: 'none',
              scrollTrigger: {
                trigger: frame,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.8,
                invalidateOnRefresh: true,
              },
            },
          );
        });
        gsap.fromTo(
          '.image-stamp',
          { rotation: -12 },
          {
            rotation: -4,
            ease: 'none',
            scrollTrigger: {
              trigger: '.about-image',
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          },
        );
      }, root);
      return () => ctx.revert();
    },
  );
  return () => media.revert();
}
