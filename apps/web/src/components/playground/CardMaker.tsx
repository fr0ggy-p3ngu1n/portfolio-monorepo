import { useEffect, useRef, useState } from 'react';

// Live link-preview card maker: the text goes to /api/og/card, where a
// Cloudflare Worker lays it out with satori and rasterises it with resvg
// (both WebAssembly). The image comes back as a data: URL (the CSP allows
// data: images, not blob:), so the timing and cache status can be shown.

const API_URL = import.meta.env.VITE_API_URL ?? '';

type Result = { src: string; ms: number; cache: string | null } | { error: string };

export default function CardMaker() {
  const [title, setTitle] = useState('Ship it on a Friday');
  const [subtitle, setSubtitle] = useState('Rendered on a Cloudflare Worker, just now');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const abort = useRef<AbortController | null>(null);

  const query = new URLSearchParams({ title: title.trim() || 'Hello from the edge', subtitle: subtitle.trim(), theme }).toString();
  const imageUrl = `${API_URL}/api/og/card?${query}`;

  useEffect(() => {
    const timer = setTimeout(async () => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      setLoading(true);
      try {
        const t0 = performance.now();
        const res = await fetch(imageUrl, { signal: ctrl.signal });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setResult({ error: body.error ?? 'Could not render that card.' });
          return;
        }
        const blob = await res.blob();
        const ms = Math.round(performance.now() - t0);
        const src = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(blob);
        });
        setResult({ src, ms, cache: res.headers.get('X-Cache') });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setResult({ error: "Couldn't reach the API just now." });
      } finally {
        if (abort.current === ctrl) setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [imageUrl]);

  const input = 'w-full rounded-xl bg-bg-base/60 border border-bd-primary px-3.5 py-2.5 text-sm text-tx-primary placeholder:text-tx-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-pink-400';

  return (
    <div className="glass rounded-2xl p-6 md:p-7 grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-tx-primary">Link-preview card maker</h3>
          <p className="text-sm text-tx-secondary mt-1 leading-relaxed">
            Type something. A Cloudflare Worker lays it out with satori and draws it with resvg,
            both running as WebAssembly, the same way this site's own preview image is made.
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wider text-tx-muted">
          Title
          <input className={input} value={title} maxLength={70} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wider text-tx-muted">
          Subtitle
          <input className={input} value={subtitle} maxLength={100} onChange={(e) => setSubtitle(e.target.value)} />
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-tx-muted">Theme</span>
          <div className="inline-flex p-1 rounded-xl border border-bd-primary bg-bg-base/60" role="group" aria-label="Card theme">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={theme === t}
                onClick={() => setTheme(t)}
                className={`px-3.5 py-1.5 rounded-lg text-sm capitalize transition-colors focus-visible:outline-2 focus-visible:outline-pink-400 ${theme === t ? 'bg-pink-500 text-white font-semibold' : 'text-tx-secondary hover:text-tx-primary'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-w-0">
        <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-xl border border-bd-primary bg-bg-base">
          {result && 'src' in result && (
            <img src={result.src} alt={`Generated preview card reading “${title.trim() || 'Hello from the edge'}”`} width={1200} height={630} className="absolute inset-0 h-full w-full object-cover" />
          )}
          {(loading || !result) && (
            <div className="absolute inset-0 bg-bg-base/40 motion-safe:animate-pulse" aria-hidden="true" />
          )}
        </div>
        <p className="text-xs text-tx-secondary min-h-[1.25rem]" aria-live="polite">
          {result && 'error' in result
            ? result.error
            : result
              ? <>{result.ms} ms round trip · {result.cache === 'HIT' ? 'served from the edge cache' : 'freshly rendered on the edge'} · <a className="underline decoration-dotted underline-offset-2 hover:text-tx-accent" href={imageUrl} target="_blank" rel="noopener noreferrer">open full size</a></>
              : 'Rendering…'}
        </p>
      </div>
    </div>
  );
}
