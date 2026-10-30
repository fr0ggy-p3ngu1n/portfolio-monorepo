// Dynamic Open Graph image generation.
//
// GET /api/og → returns a 1200×630 PNG suitable for og:image / twitter:image.
//
// Technique:
//   1. satori/standalone  — converts a JSX-like element tree into an SVG string.
//                           The /standalone entry requires manual layout WASM
//                           init (the default entry loads it at runtime, which
//                           CF Workers disallows).
//   2. @cf-wasm/resvg     — Cloudflare-Workers-compatible resvg; /workerd entry
//                           bundles its WASM at build time via Wrangler.
//
// Both WASM modules (satori's layout engine + resvg) are bundled at build time by Wrangler's
// [[rules]] CompiledWasm entry in wrangler.toml and imported as
// WebAssembly.Module instances. Cloudflare Workers allows
// WebAssembly.instantiate(module, imports) for pre-compiled modules but
// blocks runtime compilation from raw bytes.
//
// Inter font files are fetched from jsDelivr on the first request and cached
// at module scope so subsequent requests within the same Worker instance are
// served from memory (typically <10 ms after cold-start).
//
// On any error the route falls back to the static /og-image.png already hosted
// on Cloudflare Pages, so social cards never break.

import { Hono } from 'hono';
// satori/standalone requires manual yoga init — does not auto-load WASM
import satori, { init as initLayout } from 'satori/standalone';
// @cf-wasm/resvg/workerd bundles resvg WASM at module load time automatically
import { Resvg, initResvg } from '@cf-wasm/resvg/workerd';
// yoga.wasm is the WASM binary extracted from yoga-layout (same package that
// satori depends on internally). Bundled by Wrangler as a CompiledWasm module.
// Stay on satori 0.19: from 0.33.5 it loads a harfbuzz text shaper at runtime
// in a way Workers can't run. Its SVG-escaping advisory (GHSA-wx4j-mvgx-mqwp)
// doesn't reach us: the SVG only ever goes to resvg, visitors get the PNG, and
// text is drawn as glyph paths (checked with injection payloads, 2026-10-30).
// @ts-expect-error — .wasm imports resolved by Wrangler's CompiledWasm rule
import yogaWasm from '../yoga.wasm';
import type { Bindings } from '../index';

const app = new Hono<{ Bindings: Bindings }>();

// ── Module-level init cache ────────────────────────────────────────────────────
// Everything is initialized exactly once per Worker instance.
let ready        = false;
let fontBold:    ArrayBuffer;
let fontRegular: ArrayBuffer;

async function ensureInit() {
  if (ready) return;

  // 1. Initialize the layout engine (satori/standalone requires this)
  //    yogaWasm is a pre-compiled WebAssembly.Module from Wrangler — CF Workers
  //    allows WebAssembly.instantiate(module, imports) for pre-compiled modules.
  await initLayout(yogaWasm);

  // 2. Fetch Inter font files and wait for resvg WASM to be ready in parallel.
  //    jsDelivr CDN caches aggressively so font fetches are fast after cold-start.
  const [[bold, regular]] = await Promise.all([
    Promise.all([
      fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-700-normal.woff').then(r => r.arrayBuffer()),
      fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-400-normal.woff').then(r => r.arrayBuffer()),
    ]),
    initResvg.ensure(),
  ]);

  fontBold    = bold;
  fontRegular = regular;
  ready       = true;
}

// ── Element builder helpers ────────────────────────────────────────────────────
// satori accepts a React-element-shaped plain object. These tiny helpers keep
// the layout definition below readable without needing JSX or React at runtime.

type Style    = Record<string, string | number>;
type AnyChild = object | string | null;

function div(style: Style, ...children: AnyChild[]): object {
  return {
    type: 'div',
    key: null,
    props: {
      style: { display: 'flex', ...style },
      children: children.length === 1 ? children[0] : children,
    },
  };
}

function span(style: Style, text: string): object {
  return { type: 'span', key: null, props: { style: { display: 'flex', ...style }, children: text } };
}

function img(src: string, style: Style): object {
  return { type: 'img', key: null, props: { src, style } };
}

// ── OG Image layout ────────────────────────────────────────────────────────────
function buildOG(): object {
  const PINK   = '#ec4899';
  const MIST   = '#f7f5fb';
  const LILAC  = '#c9c2da';
  const BG     = '#0e0b18';
  const TAGS   = ['React', '.NET', 'Azure', 'iOS'];

  return div(
    // Root — full canvas, ink background with the same pink dot-grid used in the hero
    {
      width: '1200px', height: '630px',
      backgroundColor: BG,
      backgroundImage: 'radial-gradient(circle, rgba(236,72,153,0.18) 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px',
      fontFamily: 'Inter',
      position: 'relative',
    },

    // Gradient overlay — darkens corners so text reads cleanly over the dot grid
    div({
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(135deg, rgba(14,11,24,0.88) 0%, rgba(14,11,24,0.25) 55%, rgba(14,11,24,0.88) 100%)',
    }),

    // Content row — left copy block + right avatar
    div(
      {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: '72px 80px',
        gap: '60px',
      },

      // ── Left: name, role, company, tech tags ────────────────────────────────
      div(
        { flexDirection: 'column', flex: 1 },

        // Pink→violet accent bar (mirrors the section dividers used throughout the site)
        div({ width: '48px', height: '4px', backgroundImage: 'linear-gradient(90deg, #ec4899, #a78bfa)', borderRadius: '2px', marginBottom: '28px' }),

        // Name
        span({ fontSize: '64px', fontWeight: 700, color: MIST, lineHeight: 1.05, letterSpacing: '-1px', marginBottom: '16px' }, 'Matthew Sullivan'),

        span({ fontSize: '28px', fontWeight: 400, color: PINK, marginBottom: '10px' }, 'Full-Stack Developer'),
        span({ fontSize: '20px', fontWeight: 400, color: LILAC, marginBottom: '40px' }, 'Currently building at EHMA.ai'),

        // Tech stack pill tags
        div(
          { flexDirection: 'row', gap: '10px' },
          ...TAGS.map(tag =>
            div(
              {
                padding: '8px 18px',
                border: '1px solid rgba(236,72,153,0.38)',
                borderRadius: '999px',
                backgroundColor: 'rgba(236,72,153,0.07)',
              },
              span({ fontSize: '18px', fontWeight: 400, color: PINK }, tag),
            ),
          ),
        ),
      ),

      // ── Right: circular avatar with pink ring ──────────────────────────────
      div(
        { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
        div(
          { width: '210px', height: '210px', borderRadius: '50%', border: `4px solid ${PINK}`, overflow: 'hidden' },
          img('https://matthewsullivan.dev/avatar.jpg', { width: '210px', height: '210px', objectFit: 'cover', objectPosition: 'top' }),
        ),
      ),
    ),

    // URL — bottom-right watermark
    div(
      { position: 'absolute', bottom: '40px', right: '80px' },
      span({ fontSize: '20px', fontWeight: 400, color: '#a78bfa', letterSpacing: '0.5px' }, 'matthewsullivan.dev'),
    ),
  );
}

// ── Playground card (/api/og/card) ──────────────────────────────────────────────
// The homepage playground's live card maker: a visitor's own title/subtitle,
// rendered the same way as the site's link-preview image. Labelled as a
// playground card so it can't pass for an official one.

const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g;
const clean = (v: string | undefined, max: number) =>
  (v ?? '').replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

function buildCard(title: string, subtitle: string, light: boolean): object {
  const BG = light ? '#f7f5fb' : '#0e0b18';
  const TEXT = light ? '#0e0b18' : '#f7f5fb';
  const SUB = light ? '#5b5470' : '#c9c2da';
  const ACCENT = light ? '#be185d' : '#ec4899';
  const size = title.length <= 24 ? 76 : title.length <= 44 ? 62 : 50;

  return div(
    {
      width: '1200px', height: '630px', position: 'relative', fontFamily: 'Inter',
      backgroundColor: BG,
      backgroundImage: `radial-gradient(circle, ${light ? 'rgba(124,58,237,0.16)' : 'rgba(236,72,153,0.18)'} 1.5px, transparent 1.5px)`,
      backgroundSize: '28px 28px',
    },
    div(
      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'column', justifyContent: 'center', padding: '80px 90px' },
      div(
        { alignSelf: 'flex-start', padding: '8px 18px', borderRadius: '999px', border: `1px solid ${ACCENT}55`, backgroundColor: `${ACCENT}12`, marginBottom: '34px' },
        span({ fontSize: '20px', color: ACCENT }, 'Made live in the playground'),
      ),
      span({ fontSize: `${size}px`, fontWeight: 700, color: TEXT, lineHeight: 1.08, letterSpacing: '-1px', marginBottom: subtitle ? '22px' : '0' }, title),
      subtitle ? span({ fontSize: '30px', color: SUB, lineHeight: 1.35 }, subtitle) : null,
    ),
    div({ position: 'absolute', left: '90px', bottom: '56px', width: '56px', height: '5px', borderRadius: '3px', backgroundImage: 'linear-gradient(90deg, #ec4899, #a78bfa)' }),
    div(
      { position: 'absolute', bottom: '44px', right: '90px' },
      span({ fontSize: '22px', color: light ? '#7c3aed' : '#a78bfa', letterSpacing: '0.5px' }, 'matthewsullivan.dev'),
    ),
  );
}

app.get('/card', async (c) => {
  const title = clean(c.req.query('title'), 70) || 'Hello from the edge';
  const subtitle = clean(c.req.query('subtitle'), 100);
  const light = c.req.query('theme') === 'light';

  // Same inputs → same URL → served from the edge cache, no render and no
  // rate-limit hit
  const url = new URL(c.req.url);
  url.search = new URLSearchParams({ title, subtitle, theme: light ? 'light' : 'dark' }).toString();
  const key = new Request(url.toString());
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) {
    const res = new Response(hit.body, hit);
    res.headers.set('X-Cache', 'HIT');
    return res;
  }

  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const { success } = await c.env.OG_LIMIT.limit({ key: ip });
  if (!success) return c.json({ error: 'Too many new cards. Try again in a minute.' }, 429);

  try {
    await ensureInit();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svg = await satori(buildCard(title, subtitle, light) as any, {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
        { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
      ],
    });
    const png = (await Resvg.async(svg, { fitTo: { mode: 'width', value: 1200 } })).render().asPng();
    const res = new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
        // Visitor-written text: keep these out of search results
        'X-Robots-Tag': 'noindex',
        'X-Cache': 'MISS',
      },
    });
    c.executionCtx.waitUntil(cache.put(key, res.clone()));
    return res;
  } catch (err) {
    console.error('[og/card] generation failed:', err);
    return c.json({ error: 'Could not render that card' }, 500);
  }
});

// ── Route ──────────────────────────────────────────────────────────────────────
app.get('/', async (c) => {
  // The image never changes between deploys, so render it once per data
  // centre and serve it from the edge cache after that. Query strings are
  // ignored so they can't force fresh renders.
  const key = new Request(new URL('/api/og', c.req.url).toString());
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return new Response(hit.body, hit);

  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const { success } = await c.env.OG_LIMIT.limit({ key: ip });
  if (!success) return c.redirect('https://matthewsullivan.dev/og-image.png', 302);

  try {
    await ensureInit();

    // satori renders the element tree to an SVG string.
    // Text is outlined to paths using the Inter font data provided here, so the
    // resvg renderer does not need separate font configuration.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svg = await satori(buildOG() as any, {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: fontBold,    weight: 700, style: 'normal' },
        { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
      ],
    });

    // Resvg.async() awaits resvg initialization internally, then renders SVG → PNG
    const resvg = await Resvg.async(svg, { fitTo: { mode: 'width', value: 1200 } });
    const png   = resvg.render().asPng();

    const res = new Response(png, {
      status: 200,
      headers: {
        'Content-Type':  'image/png',
        // Cache for 24 h at CDN edges; serve stale for up to 1 h while revalidating
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    });
    c.executionCtx.waitUntil(cache.put(key, res.clone()));
    return res;
  } catch (err) {
    // On any failure, redirect to the static fallback so social cards still work
    console.error('[og] generation failed:', err);
    return c.redirect('https://matthewsullivan.dev/og-image.png', 302);
  }
});

export default app;
