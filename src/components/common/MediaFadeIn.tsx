'use client';
import { useEffect } from 'react';

/**
 * Fades images in once they have loaded, app-wide, without touching call sites.
 * An <img> that is not yet complete when it appears gets data-cc-fade + data-cc-pending
 * (opacity 0); on load/error (or after FAILSAFE_MS) data-cc-pending is removed and CSS
 * transitions opacity to 1. Images already loaded/cached are never touched. The box keeps
 * its layout the whole time (opacity only), so there is no layout shift. Images inside
 * .boot-curtain or marked data-no-fade are skipped. Videos are never touched: posters are
 * <video poster> attributes and preload settings stay as authored.
 */
const FAILSAFE_MS = 6000;

function track(img: HTMLImageElement) {
  if (img.hasAttribute('data-cc-fade') || img.hasAttribute('data-no-fade')) return;
  if (img.closest('.boot-curtain')) return;
  if (img.complete || !img.getAttribute('src')) return;
  img.setAttribute('data-cc-fade', '');
  img.setAttribute('data-cc-pending', '');
  const done = () => img.removeAttribute('data-cc-pending');
  img.addEventListener('load', done, { once: true });
  img.addEventListener('error', done, { once: true });
  window.setTimeout(done, FAILSAFE_MS);
}

function scan(node: Node) {
  if (node.nodeType !== 1) return;
  const el = node as Element;
  if (el.tagName === 'IMG') track(el as HTMLImageElement);
  else el.querySelectorAll?.('img').forEach((i) => track(i));
}

export function MediaFadeIn() {
  useEffect(() => {
    document.querySelectorAll('img').forEach((i) => track(i));
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return null;
}
