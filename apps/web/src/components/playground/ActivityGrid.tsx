import { useEffect, useRef, useState } from 'react';

// GitHub contribution calendar + latest public commits. The data is fetched
// by the deploy workflow (scripts/activity.mjs) and served as /activity.json,
// refreshed daily, so visitors never hit GitHub's rate limits.

type Day = { date: string; count: number };
type Commit = { repo: string; message: string; sha: string; url: string; date: string };
type Activity = { generatedAt: string | null; total: number; weeks: Day[][]; recent: Commit[] };

const LEVELS = ['bg-bd-primary/50', 'bg-pink-500/30', 'bg-pink-500/55', 'bg-pink-500/80', 'bg-pink-500'];

// Shade by quartile among active days, the way GitHub's own grid does, so
// one very busy day doesn't wash out the rest
function thresholds(days: Day[]) {
  const active = days.map((d) => d.count).filter((n) => n > 0).sort((a, b) => a - b);
  if (!active.length) return [1, 1, 1];
  const q = (f: number) => active[Math.min(active.length - 1, Math.floor(f * active.length))];
  return [q(0.25), q(0.5), q(0.75)];
}

function level(count: number, [q1, q2, q3]: number[]) {
  if (count === 0) return 0;
  return count <= q1 ? 1 : count <= q2 ? 2 : count <= q3 ? 3 : 4;
}

const fmt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

export default function ActivityGrid() {
  const [data, setData] = useState<Activity | null>(null);
  const [missing, setMissing] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/activity.json')
      .then((r) => r.json() as Promise<Activity>)
      .then((d) => (d.weeks.length ? setData(d) : setMissing(true)))
      .catch(() => setMissing(true));
  }, []);

  // Start at the most recent weeks when the grid is wider than the screen
  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [data]);

  const cuts = thresholds(data?.weeks.flat() ?? []);

  return (
    <div className="glass rounded-2xl p-6 md:p-7 flex flex-col gap-5 min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-tx-primary">Shipping activity</h3>
          <p className="text-sm text-tx-secondary mt-1">
            {data && data.total ? <><span className="font-mono text-tx-primary">{data.total}</span> GitHub contributions in the last year</> : 'GitHub contributions in the last year'}
          </p>
        </div>
        <a className="text-xs text-tx-secondary underline decoration-dotted underline-offset-2 hover:text-tx-accent" href="https://github.com/fr0ggy-p3ngu1n" target="_blank" rel="noopener noreferrer">
          github.com/fr0ggy-p3ngu1n
        </a>
      </div>

      {missing ? (
        <p className="text-sm text-tx-secondary">The activity grid is refreshing. It's rebuilt from GitHub every day.</p>
      ) : (
      <>
      <div ref={scroller} className="overflow-x-auto pb-1 -mx-1 px-1" tabIndex={0} aria-label="Contribution calendar, scrollable">
        {!data ? (
          <div className="h-[100px] rounded-lg bg-bd-primary/40 motion-safe:animate-pulse" aria-label="Loading contributions" />
        ) : (
          <div className="grid grid-flow-col gap-[3px] min-w-[690px]" style={{ gridTemplateColumns: `repeat(${data.weeks.length}, minmax(10px, 1fr))` }} role="img" aria-label={`${data.total} contributions over the last ${data.weeks.length} weeks`}>
            {data.weeks.map((week, w) => (
              <div key={w} className="grid grid-rows-7 gap-[3px] content-start">
                {week.map((day) => (
                  <span
                    key={day.date}
                    title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${fmt(day.date)}`}
                    className={`block aspect-square w-full rounded-[3px] ${LEVELS[level(day.count, cuts)]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[11px] text-tx-muted" aria-hidden="true">
        Less {LEVELS.map((c) => <span key={c} className={`h-[10px] w-[10px] rounded-[3px] ${c}`} />)} More
      </div>
      </>
      )}

      {data && data.recent.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-tx-muted mb-2">Latest commits</p>
          <ul className="divide-y divide-bd-primary/60">
            {data.recent.map((c) => (
              <li key={c.repo + c.sha} className="py-2 flex items-baseline gap-3 min-w-0 text-sm">
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-tx-accent shrink-0 hover:underline">{c.sha}</a>
                <span className="text-tx-primary truncate min-w-0 flex-1">{c.message}</span>
                <span className="text-xs text-tx-muted shrink-0 hidden sm:inline">{c.repo.split('/')[1]}</span>
                <span className="text-xs text-tx-muted shrink-0">{ago(c.date)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
