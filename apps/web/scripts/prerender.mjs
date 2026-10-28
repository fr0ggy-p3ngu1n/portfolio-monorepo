// Runs after `vite build`. Renders the homepage to static HTML and writes the
// three HTML entry points Cloudflare Pages serves:
//   dist/index.html        — "/" with the homepage pre-rendered and projects inlined
//   dist/admin/index.html  — empty app shell for /admin/* (see public/_redirects)
//   dist/404.html          — empty app shell; Pages serves it with a 404 status
import { build, loadEnv } from 'vite';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const serverOut = path.join(root, 'dist-server');

const env = loadEnv('production', root, 'VITE_');
const apiUrl = process.env.VITE_API_URL ?? env.VITE_API_URL;

await build({
  root,
  logLevel: 'warn',
  build: {
    ssr: 'src/entry-server.tsx',
    outDir: serverOut,
    emptyOutDir: true,
  },
});
const { render } = await import(pathToFileURL(path.join(serverOut, 'entry-server.js')).href);

let projects = [];
try {
  const res = await fetch(`${apiUrl}/api/projects`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  projects = await res.json();
} catch (err) {
  // Don't fail the deploy over this: the page still fetches projects at runtime.
  console.warn(`prerender: couldn't load projects from ${apiUrl} (${err.message}); rendering without them`);
}

const shell = await readFile(path.join(dist, 'index.html'), 'utf8');
if (!shell.includes('<div id="root"></div>')) throw new Error('prerender: root div not found in dist/index.html');

const appHtml = render(projects);
// Escape "<" so project text can't close the script tag early.
const data = JSON.stringify(projects).replace(/</g, '\\u003c');
const page = shell.replace(
  '<div id="root"></div>',
  `<div id="root">${appHtml}</div>\n    <script type="application/json" id="prerendered-projects">${data}</script>`,
);

await writeFile(path.join(dist, 'index.html'), page);
await mkdir(path.join(dist, 'admin'), { recursive: true });
await writeFile(path.join(dist, 'admin', 'index.html'), shell);
await writeFile(path.join(dist, '404.html'), shell);
await rm(serverOut, { recursive: true, force: true });

console.log(`prerender: homepage rendered (${(appHtml.length / 1024).toFixed(0)} KB, ${projects.length} projects)`);
