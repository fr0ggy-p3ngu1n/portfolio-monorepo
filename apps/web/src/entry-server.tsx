import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import type { Project } from '@portfolio/shared';
import { ThemeProvider } from './context/ThemeContext';
import { seedProjects } from './lib/prerendered';
import Home from './pages/Home';

// Build-time render of the homepage, so crawlers and link previews get real
// content instead of an empty <div id="root">.
export function render(projects: Project[]) {
  seedProjects(projects);
  return renderToString(
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </ThemeProvider>
    </MotionConfig>,
  );
}
