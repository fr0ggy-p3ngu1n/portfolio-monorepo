import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// "This site, right now": numbers measured as the page loads, from the API
// Worker (/api/status) and this browser. Nothing here is hard-coded.

const API_URL = import.meta.env.VITE_API_URL ?? '';
const SITE_SHA = (import.meta.env.VITE_BUILD_SHA as string | undefined)?.slice(0, 7) ?? null;
const REPO_URL = 'https://github.com/fr0ggy-p3ngu1n/portfolio-monorepo';
// Asked from the browser: GitHub allows 60 unauthenticated calls an hour per
// visitor, whereas Cloudflare's shared egress IPs are always over the limit
const RUNS_URL = 'https://api.github.com/repos/fr0ggy-p3ngu1n/portfolio-monorepo/actions/runs?branch=main&per_page=20';

// Cloudflare data centres are named by airport code
const COLOS: Record<string, string> = {
  PHX: 'Phoenix', LAX: 'Los Angeles', SJC: 'San Jose', SFO: 'San Francisco', SEA: 'Seattle', PDX: 'Portland',
  LAS: 'Las Vegas', SLC: 'Salt Lake City', DEN: 'Denver', DFW: 'Dallas', IAH: 'Houston', ORD: 'Chicago',
  MSP: 'Minneapolis', ATL: 'Atlanta', MIA: 'Miami', IAD: 'Ashburn', EWR: 'Newark', BOS: 'Boston',
  YYZ: 'Toronto', YVR: 'Vancouver', MEX: 'Mexico City', LHR: 'London', AMS: 'Amsterdam', FRA: 'Frankfurt',
  CDG: 'Paris', MAD: 'Madrid', DUB: 'Dublin', ARN: 'Stockholm', NRT: 'Tokyo', SIN: 'Singapore',
  HKG: 'Hong Kong', SYD: 'Sydney', BOM: 'Mumbai', GRU: 'São Paulo',
};

type Status = {
  colo: string | null;
  d1Ms: number;
  workerMs: number;
  projects: number | null;
  api: { sha: string | null; deployedAt: string | null };
};

type Run = { name: string; status: string; conclusion: string | null; updated_at: string; html_url: string };

async function latestRuns(): Promise<Run[]> {
  const res = await fetch(RUNS_URL, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(String(res.status));
  const { workflow_runs = [] } = (await res.json()) as { workflow_runs?: Run[] };
  const seen = new Set<string>();
  return workflow_runs.filter((r) => !seen.has(r.name) && seen.add(r.name));
}

function ago(iso: string | null) {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return 'just now';
  if (s < 5400) return `${Math.round(s / 60)} min ago`;
  if (s < 129600) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} days ago`;
}

function Tile({ label, value, detail, children, className = '' }: { label: string; value: React.ReactNode; detail?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-xl p-4 flex flex-col gap-1 min-w-0 ${className}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-tx-muted">{label}</p>
      <p className="text-2xl font-mono font-semibold text-tx-primary tabular-nums truncate">{value}</p>
      {detail && <p className="text-xs text-tx-secondary">{detail}</p>}
      {children}
    </div>
  );
}

const Skeleton = () => <span className="inline-block h-7 w-20 rounded bg-bd-primary/60 motion-safe:animate-pulse align-middle" />;

export default function LiveStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [failed, setFailed] = useState(false);
  const [pings, setPings] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [runsFailed, setRunsFailed] = useState(false);

  useEffect(() => {
    latestRuns().then(setRuns).catch(() => setRunsFailed(true));
  }, []);

  const measure = useCallback(async () => {
    setBusy(true);
    try {
      const t0 = performance.now();
      const res = await fetch(`${API_URL}/api/status`, { cache: 'no-store' });
      const rtt = Math.round(performance.now() - t0);
      if (!res.ok) throw new Error(String(res.status));
      setStatus((await res.json()) as Status);
      setPings((p) => [...p, rtt].slice(-8));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void measure(); }, [measure]);

  const latest = pings.length ? pings[pings.length - 1] : undefined;
  const maxPing = Math.max(...pings, 1);
  const colo = status?.colo;

  return (
    <section id="live" aria-labelledby="live-heading" className="bg-bg-base pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="glass rounded-2xl p-6 md:p-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 id="live-heading" className="flex items-center gap-2 text-xl font-bold text-tx-primary">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-pink-500 opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pink-500" />
                </span>
                This site, right now
              </h2>
              <p className="text-sm text-tx-secondary mt-1">Every number here is measured as the page loads.</p>
            </div>
            <button
              type="button"
              onClick={() => void measure()}
              disabled={busy}
              className="glass px-4 py-2 rounded-xl text-sm font-medium text-tx-primary disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400"
            >
              {busy ? 'Measuring…' : 'Ping again'}
            </button>
          </div>

          {failed && !status ? (
            <p className="text-sm text-tx-secondary" role="status">Couldn't reach the API just now. Try “Ping again”.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3" aria-live="polite" aria-busy={busy}>
              <Tile
                label="Answered by"
                value={status ? (colo ?? '—') : <Skeleton />}
                detail={status ? (colo && COLOS[colo] ? `Cloudflare edge in ${COLOS[colo]}` : 'Cloudflare edge data centre') : ' '}
              />
              <Tile label="Round trip" value={latest !== undefined ? `${latest} ms` : <Skeleton />} detail="Your browser → API → back">
                {pings.length > 1 && (
                  <div className="flex items-end gap-1 h-6 mt-1" aria-hidden="true">
                    {pings.map((p, i) => (
                      <span key={i} className="w-2 rounded-sm bg-pink-500/70" style={{ height: `${Math.max(12, (p / maxPing) * 100)}%` }} />
                    ))}
                  </div>
                )}
              </Tile>
              <Tile label="Database query" value={status ? `${status.d1Ms} ms` : <Skeleton />} detail="Live SQL on Cloudflare D1" />
              <Tile label="API work" value={status ? `${status.workerMs} ms` : <Skeleton />} detail="Hono on a Cloudflare Worker" />
              <Tile
                label="Deployed"
                value={status ? (status.api.sha?.slice(0, 7) ?? '—') : <Skeleton />}
                detail={
                  <>
                    API {ago(status?.api.deployedAt ?? null)}
                    {SITE_SHA && (
                      <>
                        {' · site '}
                        <a className="underline decoration-dotted underline-offset-2 hover:text-tx-accent" href={`${REPO_URL}/commit/${import.meta.env.VITE_BUILD_SHA}`} target="_blank" rel="noopener noreferrer">{SITE_SHA}</a>
                        {' '}built {ago(__BUILD_TIME__)}
                      </>
                    )}
                  </>
                }
              />
              <Tile
                label="CI / CD"
                className="col-span-2 lg:col-span-1"
                value={runs ? (runs.length ? `${runs.filter((r) => r.conclusion === 'success').length}/${runs.length} green` : '—') : runsFailed ? '—' : <Skeleton />}
                detail={runsFailed ? "GitHub didn't answer just now" : undefined}
              >
                {runs && runs.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {runs.map((r) => (
                      <li key={r.name} className="text-xs text-tx-secondary flex items-center gap-1.5 min-w-0">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.status !== 'completed' ? 'bg-amber-400' : r.conclusion === 'success' ? 'bg-emerald-400' : 'bg-rose-500'}`} aria-hidden="true" />
                        <a className="truncate hover:text-tx-accent" href={r.html_url} target="_blank" rel="noopener noreferrer">
                          {r.name} · {r.status !== 'completed' ? 'running' : r.conclusion} · {ago(r.updated_at)}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Tile>
            </div>
          )}

          <p className="mt-5 text-xs text-tx-muted">
            React 19 + Vite, pre-rendered and served by Cloudflare Pages · API: Hono on Cloudflare Workers with D1 and R2 · deployed by GitHub Actions on every push.{' '}
            <a className="underline decoration-dotted underline-offset-2 hover:text-tx-accent" href={REPO_URL} target="_blank" rel="noopener noreferrer">Source on GitHub</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
