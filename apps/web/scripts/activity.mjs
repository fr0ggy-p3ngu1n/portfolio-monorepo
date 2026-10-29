// Builds public/activity.json for the homepage playground's GitHub activity
// grid: the contribution calendar (same data as the green grid on the GitHub
// profile) plus the latest commits across the public repos.
//
// Runs in the deploy workflow (daily on a schedule too) with the workflow's
// own GITHUB_TOKEN. Locally: GITHUB_TOKEN=$(gh auth token) node scripts/activity.mjs
// If GitHub can't be reached, the existing file is kept so the build never fails.

import { readFileSync, writeFileSync } from 'node:fs';

const OUT = new URL('../public/activity.json', import.meta.url);
const LOGIN = 'fr0ggy-p3ngu1n';
const REPOS = [
  'fr0ggy-p3ngu1n/portfolio-monorepo',
  'sproutaac/app',
  'sproutaac/website',
  'clearpath-ext/clearpath-extension',
  'clearpath-ext/clearpath-web',
];
const token = process.env.GITHUB_TOKEN;

async function gh(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'matthewsullivan.dev', Accept: 'application/vnd.github+json', ...init.headers },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  if (!token) throw new Error('GITHUB_TOKEN is not set');

  const { data, errors } = await gh('/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
        totalContributions weeks { contributionDays { date contributionCount } } } } } }`,
      variables: { login: LOGIN },
    }),
  });
  if (errors) throw new Error(JSON.stringify(errors));
  const calendar = data.user.contributionsCollection.contributionCalendar;

  const perRepo = await Promise.all(
    REPOS.map((repo) =>
      gh(`/repos/${repo}/commits?author=${LOGIN}&per_page=6`)
        .then((commits) => commits.map((c) => ({
          repo,
          message: c.commit.message.split('\n')[0].slice(0, 120),
          sha: c.sha.slice(0, 7),
          url: c.html_url,
          date: c.commit.author.date,
        })))
        .catch(() => []),
    ),
  );
  const recent = perRepo.flat().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  const out = {
    generatedAt: new Date().toISOString(),
    total: calendar.totalContributions,
    // weeks[w][d] = { date, count }, Sunday first, oldest week first
    weeks: calendar.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))),
    recent,
  };
  writeFileSync(OUT, JSON.stringify(out));
  console.log(`activity.json: ${out.total} contributions, ${out.weeks.length} weeks, ${recent.length} recent commits`);
}

main().catch((err) => {
  let existing = false;
  try { readFileSync(OUT); existing = true; } catch {}
  console.warn(`activity.json not refreshed (${err.message})${existing ? '; keeping the previous file' : ''}`);
  if (!existing) writeFileSync(OUT, JSON.stringify({ generatedAt: null, total: 0, weeks: [], recent: [] }));
});
