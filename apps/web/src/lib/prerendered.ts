import type { Project } from '@portfolio/shared';

// Projects baked into the page at build time (see scripts/prerender.ts), so the
// cards render immediately instead of waiting on the API. The server render
// seeds them directly; in the browser they're read from the JSON script tag.
let seed: Project[] | null = null;

export function seedProjects(projects: Project[]) {
  seed = projects;
}

export function prerenderedProjects(): Project[] | null {
  if (seed) return seed;
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('prerendered-projects');
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as Project[];
  } catch {
    return null;
  }
}
