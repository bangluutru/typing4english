import { useSyncExternalStore } from 'react';

/**
 * Minimal hash router: "#/words/5/family" → ['words', '5', 'family'].
 * Hash routing keeps the app a static bundle (Cloudflare Pages, no rewrites)
 * and lets a reload or the browser Back button return to the same screen.
 */
const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};
const getHash = () => window.location.hash;

export function useRoute(): string[] {
  const hash = useSyncExternalStore(subscribe, getHash);
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}

export function navigate(path: string) {
  const next = `#/${path.replace(/^\/+/, '')}`;
  if (window.location.hash !== next) window.location.hash = next;
  window.scrollTo({ top: 0 });
}

export const href = (path: string) => `#/${path.replace(/^\/+/, '')}`;
