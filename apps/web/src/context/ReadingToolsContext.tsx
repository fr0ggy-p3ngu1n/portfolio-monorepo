import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Reading tools borrowed from ClearPath (clearpathext.com): a reading ruler,
// a dyslexia-friendly font, and read-aloud with word highlighting. Settings
// persist in localStorage; the panel itself lives in components/ReadingTools.

type Settings = { ruler: boolean; dyslexic: boolean };

type ReadingTools = Settings & {
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  toggleRuler: () => void;
  toggleDyslexic: () => void;
  reading: boolean;
  setReading: (reading: boolean) => void;
};

const KEY = 'reading-tools';
const noop = () => {};

// Safe defaults so components still render without the provider (the
// build-time prerender doesn't mount it)
const Ctx = createContext<ReadingTools>({
  ruler: false, dyslexic: false, panelOpen: false, reading: false,
  setPanelOpen: noop, toggleRuler: noop, toggleDyslexic: noop, setReading: noop,
});

function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Settings> | null;
    return { ruler: !!saved?.ruler, dyslexic: !!saved?.dyslexic };
  } catch {
    return { ruler: false, dyslexic: false };
  }
}

export function ReadingToolsProvider({ children }: { children: React.ReactNode }) {
  // Read straight from storage: the settings only touch a class on <html> and
  // the ruler (which mounts after load), so the prerendered markup still matches
  const [settings, setSettings] = useState<Settings>(() =>
    typeof window === 'undefined' ? { ruler: false, dyslexic: false } : loadSettings(),
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('font-dyslexic', settings.dyslexic);
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* private mode */ }
  }, [settings]);

  const toggleRuler = useCallback(() => setSettings((s) => ({ ...s, ruler: !s.ruler })), []);
  const toggleDyslexic = useCallback(() => setSettings((s) => ({ ...s, dyslexic: !s.dyslexic })), []);

  return (
    <Ctx.Provider value={{ ...settings, panelOpen, setPanelOpen, toggleRuler, toggleDyslexic, reading, setReading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useReadingTools = () => useContext(Ctx);
