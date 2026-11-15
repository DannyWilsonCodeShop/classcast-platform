'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

/**
 * Boot curtain: full-screen logo + thin blue progress bar shown on every full document load.
 * It is part of the server-rendered HTML (visible is the initial state, so hydration matches)
 * and lifts once the above-the-fold images are loaded/decoded, or at BOOT_CURTAIN_MAX_WAIT_MS.
 * It never touches <video> elements; videos count only through their poster image.
 */

/** Hard upper bound before the curtain lifts, whatever the network is doing. */
export const BOOT_CURTAIN_MAX_WAIT_MS = 4000;
const TICK_MS = 100;
/** DOM must be unchanged this long (and no images pending) before lifting. */
const QUIET_NO_MEDIA_MS = 150;
const QUIET_WITH_MEDIA_MS = 350;
const FADE_MS = 400;

type Phase = 'visible' | 'fading' | 'gone';
type VTDocument = Document & { startViewTransition?: (cb: () => void) => unknown };

function inViewport(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return false;
  return r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
}

/** Resolves (never rejects) when the image is loaded and decoded, or has failed. */
function settleImage(img: HTMLImageElement): Promise<void> {
  return new Promise<void>((resolve) => {
    const decode = () => {
      if (typeof img.decode === 'function') img.decode().then(() => resolve(), () => resolve());
      else resolve();
    };
    if (img.complete) {
      if (img.naturalWidth > 0) decode();
      else resolve(); // broken or empty src: settled
      return;
    }
    img.addEventListener('load', decode, { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

function settlePoster(url: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

export function BootCurtain() {
  const [phase, setPhase] = useState<Phase>('visible');
  const [progress, setProgress] = useState(8);
  const curtainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const curtain = curtainRef.current;
    if (!curtain) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    const tracked = new Map<Element | string, boolean>(); // key -> settled
    let lastChange = start;
    let done = false;
    let timer = 0;

    // Make everything behind the curtain unreachable by keyboard / assistive tech.
    const inerted: Element[] = [];
    Array.from(document.body.children).forEach((el) => {
      if (el === curtain || el.tagName === 'SCRIPT' || el.hasAttribute('inert')) return;
      el.setAttribute('inert', '');
      inerted.push(el);
    });
    const release = () => inerted.forEach((el) => el.removeAttribute('inert'));

    const mo = new MutationObserver(() => {
      lastChange = performance.now();
    });
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset', 'poster'],
    });

    const track = (key: Element | string, p: Promise<void>) => {
      tracked.set(key, false);
      lastChange = performance.now();
      p.then(() => {
        tracked.set(key, true);
        lastChange = performance.now();
      });
    };

    const scan = () => {
      document.querySelectorAll('img').forEach((img) => {
        if (curtain.contains(img) || tracked.has(img)) return;
        if (!img.getAttribute('src') && !img.currentSrc) return;
        if (inViewport(img)) track(img, settleImage(img));
      });
      document.querySelectorAll('video[poster]').forEach((v) => {
        const poster = v.getAttribute('poster');
        if (poster && !tracked.has(poster) && inViewport(v)) track(poster, settlePoster(poster));
      });
    };

    const stop = () => {
      done = true;
      window.clearInterval(timer);
      mo.disconnect();
      release();
    };

    const lift = () => {
      if (done) return;
      stop();
      setProgress(100);
      const vt = document as VTDocument;
      if (reduced) {
        setPhase('gone');
      } else if (typeof vt.startViewTransition === 'function') {
        // Cross-fade curtain -> page with the View Transitions API.
        try {
          vt.startViewTransition(() => {
            flushSync(() => setPhase('gone'));
          });
        } catch {
          setPhase('gone');
        }
      } else {
        // Fallback: plain CSS opacity fade, then remove from the DOM.
        setPhase('fading');
        window.setTimeout(() => setPhase('gone'), FADE_MS + 50);
      }
    };

    const tick = () => {
      if (done) return;
      const now = performance.now();
      const elapsed = now - start;
      scan();
      const total = tracked.size;
      let settled = 0;
      tracked.forEach((s) => {
        if (s) settled += 1;
      });
      const creep = 90 * (1 - Math.exp(-elapsed / 1500));
      const real = total > 0 ? (settled / total) * 90 : 0;
      setProgress(Math.max(real, creep));
      const quiet = total === 0 ? QUIET_NO_MEDIA_MS : QUIET_WITH_MEDIA_MS;
      if (settled === total && now - lastChange >= quiet) lift();
      else if (elapsed >= BOOT_CURTAIN_MAX_WAIT_MS) lift();
    };

    timer = window.setInterval(tick, TICK_MS);
    tick();

    // bfcache restore: if the curtain is somehow still present, drop it at once.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted && !done) {
        stop();
        setPhase('gone');
      }
    };
    window.addEventListener('pageshow', onPageShow);

    return () => {
      stop();
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      ref={curtainRef}
      className={`boot-curtain${phase === 'fading' ? ' boot-curtain--fading' : ''}`}
      aria-hidden={phase === 'fading' ? true : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/MyClassCast36.png"
        alt=""
        width={72}
        height={72}
        className="boot-curtain__logo"
        fetchPriority="high"
      />
      <div className="boot-curtain__word">ClassCast</div>
      <div
        className="boot-curtain__track"
        role="progressbar"
        aria-label="Loading ClassCast"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div className="boot-curtain__bar" style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
    </div>
  );
}
