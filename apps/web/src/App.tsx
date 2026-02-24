import { RouterProvider } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import EasterEggs from './components/EasterEggs';
import ScrollToTop from './components/ScrollToTop';
import ScrollProgress from './components/ScrollProgress';
import BackToTop from './components/BackToTop';
import CommandPalette from './components/CommandPalette';
import GyroPermission from './components/GyroPermission';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <ThemeProvider>
      <AuthProvider>
        <ScrollProgress />
        <CommandPalette />
        <BackToTop />
        <GyroPermission />
        <EasterEggs />
        <ScrollToTop />
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
    </MotionConfig>
  );
}
