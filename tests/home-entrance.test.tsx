// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const animation = vi.hoisted(() => ({ context: vi.fn(), revert: vi.fn() }));
vi.mock('gsap', () => ({
  default: {
    context: animation.context,
    set: vi.fn(),
    timeline: () => {
      const timeline = { set: () => timeline, to: () => timeline, fromTo: () => timeline };
      return timeline;
    },
  },
}));
vi.mock('next/image', () => ({
  default: (props: any) => {
    const clean = { ...props };
    delete clean.preload;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...clean} alt={clean.alt ?? ''} />;
  },
}));
import { HomeEntrance } from '../src/components/home-entrance';
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  history.replaceState({}, '', '/');
  document.body.style.overflow = 'auto';
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  Object.defineProperty(SVGElement.prototype, 'getTotalLength', {
    value: () => 200,
    configurable: true,
  });
  animation.context.mockImplementation((callback: () => void) => {
    callback();
    return { revert: animation.revert };
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const enter = () =>
  render(
    <HomeEntrance>
      <main>Website content</main>
    </HomeEntrance>,
  );
describe('homepage entrance accessibility and recovery', () => {
  it('allows skipping and restores access to the website and page scrolling', () => {
    const { container } = enter();
    expect(container.querySelector('.home-entrance-content')?.hasAttribute('inert')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getByRole('button', { name: /Skip intro/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container.querySelector('.home-entrance-content')?.hasAttribute('inert')).toBe(false);
    expect(document.body.style.overflow).toBe('auto');
    expect(sessionStorage.getItem('umiya-seed-intro-v2')).toBe('seen');
  });
  it('supports Escape dismissal and cleans up animation work', () => {
    enter();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(animation.revert).toHaveBeenCalled();
  });
  it('replays the landing intro when returning to the homepage', () => {
    sessionStorage.setItem('umiya-seed-intro-v2', 'seen');
    enter();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(animation.context).toHaveBeenCalled();
  });
  it('keeps direct section links accessible without an intro', () => {
    history.replaceState({}, '', '/#about');
    enter();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('supports explicitly skipping the intro', () => {
    history.replaceState({}, '', '/?intro=0');
    enter();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('bypasses the animation for reduced-motion visitors', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    enter();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(animation.context).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe('auto');
  });
  it('fails open if animation setup throws', () => {
    animation.context.mockImplementation(() => {
      throw new Error('Animation unavailable');
    });
    enter();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('auto');
  });
  it('opens the website even if the animation completion callback never runs', () => {
    vi.useFakeTimers();
    enter();
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('auto');
  });
});
