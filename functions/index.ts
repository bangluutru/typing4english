/**
 * Cloudflare Pages Function for "/" only: send typing4english.pages.dev to the
 * real domain, typing4english.chottoday.com.
 *
 * Only "/" because the app is one page with hash routing (#/typing/1-1): once
 * the HTML redirects, the browser never asks pages.dev for the assets, and the
 * browser keeps the #fragment across a redirect, so deep links still land on
 * the same screen. A function on "/" alone also keeps every other request a
 * plain static hit (no function invocation to count against the free tier).
 *
 * Preview deploys (<hash>.typing4english.pages.dev, <branch>.typing4english.pages.dev)
 * are left alone so a PR can still be checked before it reaches main.
 *
 * Progress lives in localStorage per origin and does not follow the redirect.
 * Accepted on purpose: the t4e:* keys only exist since the 2026-09-25 rebuild.
 */
const OLD_HOST = 'typing4english.pages.dev';
const CANONICAL_HOST = 'typing4english.chottoday.com';

export const onRequest = ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  const url = new URL(request.url);
  if (url.hostname !== OLD_HOST) return next();
  url.hostname = CANONICAL_HOST;
  return Response.redirect(url.toString(), 301);
};
