import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isTouchDevice, startGyroListener } from '../hooks/useTilt';

const STORAGE_KEY = 'gyro-permission';

// iOS 13+ requires explicit user permission for DeviceOrientationEvent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const needsPermission = isTouchDevice && typeof (DeviceOrientationEvent as any).requestPermission === 'function';

export default function GyroPermission() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isTouchDevice) return;

    if (!needsPermission) {
      // Android and other non-iOS touch devices: start directly, no prompt
      startGyroListener();
      return;
    }

    // iOS: check stored preference from a previous visit
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'granted') { startGyroListener(); return; }
    if (stored === 'denied') return;

    // Show the prompt after a short delay so it doesn't appear instantly
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const handleEnable = async () => {
    setVisible(false);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: string = await (DeviceOrientationEvent as any).requestPermission();
      localStorage.setItem(STORAGE_KEY, result);
      if (result === 'granted') startGyroListener();
    } catch {
      localStorage.setItem(STORAGE_KEY, 'denied');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'denied');
    setVisible(false);
  };

  // Only render on iOS where explicit permission is required
  if (!needsPermission) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed left-1/2 -translate-x-1/2 z-[9998] glass rounded-2xl px-5 py-4 flex items-center gap-4"
          style={{
            bottom: 'calc(6rem + env(safe-area-inset-bottom))',
            border: '1px solid rgba(245,158,11,0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(217,119,6,0.18)',
            whiteSpace: 'nowrap',
          }}
        >
          <span className="text-2xl shrink-0">📱</span>
          <div className="text-sm">
            <p className="text-tx-primary font-semibold">Enable card tilt?</p>
            <p className="text-tx-muted text-xs mt-0.5">Cards tilt as you move your phone</p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0 ml-2">
            <button
              onClick={handleEnable}
              className="glass-amber rounded-lg px-3 py-1 text-amber-300 text-xs font-semibold cursor-pointer"
            >
              Enable
            </button>
            <button
              onClick={handleDismiss}
              className="text-tx-muted text-xs cursor-pointer hover:text-tx-secondary transition-colors text-center"
            >
              No thanks
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
