// Dynamic Open Graph image generation.
//
// GET /api/og → returns a 1200×630 PNG suitable for og:image / twitter:image.
//
// Technique:
//   1. satori/standalone  — converts a JSX-like element tree into an SVG string.
//                           The /standalone entry requires manual yoga WASM init
//                           (the default satori entry loads yoga via Emscripten
//                           at runtime, which CF Workers disallows).
//   2. @cf-wasm/resvg     — Cloudflare-Workers-compatible resvg; /workerd entry
//                           bundles its WASM at build time via Wrangler.
//
// Both WASM modules (yoga + resvg) are bundled at build time by Wrangler's
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
import satori, { init as initYoga } from 'satori/standalone';
// @cf-wasm/resvg/workerd bundles resvg WASM at module load time automatically
import { Resvg, initResvg } from '@cf-wasm/resvg/workerd';
// yoga.wasm is the WASM binary extracted from yoga-layout (same package that
// satori depends on internally). Bundled by Wrangler as a CompiledWasm module.
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

  // 1. Initialize yoga layout engine (satori/standalone requires this)
  //    yogaWasm is a pre-compiled WebAssembly.Module from Wrangler — CF Workers
  //    allows WebAssembly.instantiate(module, imports) for pre-compiled modules.
  await initYoga(yogaWasm);

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
type AnyChild = ReturnType<typeof div> | ReturnType<typeof span> | ReturnType<typeof img> | string | null;

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
  const AMBER  = '#f59e0b';
  const SLATE  = '#94a3b8';
  const MUTED  = '#64748b';
  const BG     = '#0f1117';
  const TAGS   = ['React', 'TypeScript', 'Cloudflare', 'Hono'];

  return div(
    // Root — full canvas, dark background with the same amber dot-grid used in the hero
    {
      width: '1200px', height: '630px',
      backgroundColor: BG,
      backgroundImage: 'radial-gradient(circle, rgba(217,119,6,0.18) 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px',
      fontFamily: 'Inter',
      position: 'relative',
    },

    // Gradient overlay — darkens corners so text reads cleanly over the dot grid
    div({
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(135deg, rgba(15,17,23,0.88) 0%, rgba(15,17,23,0.25) 55%, rgba(15,17,23,0.88) 100%)',
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

        // Amber accent bar (mirrors the section dividers used throughout the site)
        div({ width: '48px', height: '4px', backgroundColor: AMBER, borderRadius: '2px', marginBottom: '28px' }),

        // Name — styled to match the header `<Matthew Sullivan />` branding
        div(
          { flexDirection: 'row', alignItems: 'baseline', marginBottom: '16px', gap: '0px', flexWrap: 'nowrap' },
          span({ fontSize: '62px', fontWeight: 700, color: AMBER, lineHeight: 1.05, letterSpacing: '-1px' }, '<'),
          span({ fontSize: '62px', fontWeight: 700, color: AMBER, lineHeight: 1.05, letterSpacing: '-1px' }, 'Matthew Sullivan'),
          span({ fontSize: '62px', fontWeight: 700, color: AMBER, lineHeight: 1.05, letterSpacing: '-1px' }, ' />'),
        ),

        span({ fontSize: '28px', fontWeight: 400, color: SLATE, marginBottom: '10px' }, 'Full-Stack Software Engineer'),
        span({ fontSize: '20px', fontWeight: 400, color: MUTED, marginBottom: '40px' }, 'Currently building at EHMA.ai'),

        // Tech stack pill tags
        div(
          { flexDirection: 'row', gap: '10px' },
          ...TAGS.map(tag =>
            div(
              {
                padding: '8px 18px',
                border: '1px solid rgba(245,158,11,0.38)',
                borderRadius: '999px',
                backgroundColor: 'rgba(245,158,11,0.07)',
              },
              span({ fontSize: '18px', fontWeight: 400, color: AMBER }, tag),
            ),
          ),
        ),
      ),

      // ── Right: circular avatar with amber ring ──────────────────────────────
      div(
        { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
        div(
          { width: '210px', height: '210px', borderRadius: '50%', border: `4px solid ${AMBER}`, overflow: 'hidden' },
          img('https://matthewsullivan.dev/avatar.jpg', { width: '210px', height: '210px', objectFit: 'cover', objectPosition: 'top' }),
        ),
      ),
    ),

    // URL — bottom-right watermark
    div(
      { position: 'absolute', bottom: '40px', right: '80px' },
      span({ fontSize: '20px', fontWeight: 400, color: 'rgba(245,158,11,0.6)', letterSpacing: '0.5px' }, 'matthewsullivan.dev'),
    ),
  );
}

// ── Route ──────────────────────────────────────────────────────────────────────
app.get('/', async (c) => {
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

    return new Response(png, {
      status: 200,
      headers: {
        'Content-Type':  'image/png',
        // Cache for 24 h at CDN edges; serve stale for up to 1 h while revalidating
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    // On any failure, redirect to the static fallback so social cards still work
    console.error('[og] generation failed:', err);
    return c.redirect('https://matthewsullivan.dev/og-image.png', 302);
  }
});

export default app;
