import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { AnalyticsResponse } from '@portfolio/shared';

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No pageviews in this range yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-24">
      {data.map((d) => (
        <div
          key={d.date}
          className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-t transition-colors min-w-[2px]"
          style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
          title={`${d.date}: ${d.count} pageview${d.count === 1 ? '' : 's'}`}
        />
      ))}
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">No data</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 truncate pr-2">{r.label}</span>
              <span className="text-gray-900 font-medium shrink-0">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AnalyticsSection() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get<AnalyticsResponse>(`/api/analytics?days=${days}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Traffic</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                days === r.days ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-600 py-8 text-center">{error}</p>
        ) : data ? (
          <div className="space-y-6">
            <div>
              <p className="text-3xl font-bold text-gray-900">{data.totalPageviews.toLocaleString()}</p>
              <p className="text-sm text-gray-500">pageviews in the last {days} days</p>
            </div>

            <MiniBarChart data={data.byDate} />

            <div className="grid sm:grid-cols-3 gap-6 pt-2 border-t border-gray-100">
              <TopList
                title="Top pages"
                rows={data.topPaths.map((p) => ({ label: p.path, count: p.count }))}
              />
              <TopList
                title="Top referrers"
                rows={data.topReferers.map((r) => ({ label: r.referer, count: r.count }))}
              />
              <TopList
                title="Top countries"
                rows={data.topCountries.map((c) => ({ label: c.country, count: c.count }))}
              />
            </div>

            <p className="text-xs text-gray-400 pt-1">
              Powered by Cloudflare Web Analytics — no cookies, no cross-site tracking.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
