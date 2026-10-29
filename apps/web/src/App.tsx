import { RouterProvider } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ReadingToolsProvider } from './context/ReadingToolsContext';
import ReadingTools from './components/ReadingTools';
import EasterEggs from './components/EasterEggs';
import ScrollProgress from './components/ScrollProgress';
import BackToTop from './components/BackToTop';
import CommandPalette from './components/CommandPalette';
import GyroPermission from './components/GyroPermission';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <ThemeProvider>
      <ReadingToolsProvider>
      <AuthProvider>
        <ScrollProgress />
        <CommandPalette />
        <BackToTop />
        <GyroPermission />
        <EasterEggs />
        <ReadingTools />
        <RouterProvider router={router} />
      </AuthProvider>
      </ReadingToolsProvider>
    </ThemeProvider>
    </MotionConfig>
  );
}
