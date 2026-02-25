import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playJump, playDeath, playMilestone, playNazgul } from '../lib/gameAudio';
import type { LeaderboardEntry } from '@portfolio/shared';

// ─── Canvas / physics constants ───────────────────────────────────────────────
const W       = 900;
const H       = 340;
const GROUND  = 252;   // y of the ground surface
const PLYR_X  = 120;   // player horizontal position (fixed)
const P_SIZE  = 40;    // player emoji size
const GRAVITY = 0.62;
const JUMP_V  = -14.5;

// Hitbox fractions — applied to sprite size, no extra padding
// Player is centered at PLYR_X horizontally, bottom at playerBottom
// Obstacle is centered at obs.x horizontally, bottom at obs.y
const P_HW = 0.28;   // half-width fraction
const P_HH = 0.82;   // height fraction (top = playerBottom - P_SIZE * P_HH)
const O_HW = 0.27;   // obstacle half-width fraction
const O_HH = 0.78;   // obstacle height fraction

const MILESTONES = [100, 500, 1000];

const API_URL = import.meta.env.VITE_API_URL as string;

type Phase = 'idle' | 'running' | 'dead';
type Kind  = 'sword' | 'nazgul';

interface Obstacle { x: number; y: number; size: number; kind: Kind; }

interface GS {
  phase: Phase;
  score: number; hiScore: number;
  speed: number; frame: number;
  playerBottom: number; vy: number; onGround: boolean;
  obstacles: Obstacle[];
  nextIn: number;
  groundOff: number;
  animId: number;
  lastMilestone: number;
}

// ─── Leaderboard UI state ─────────────────────────────────────────────────────
type DeadUI =
  | { phase: 'hidden' }
  | { phase: 'loading' }
  | { phase: 'hof';        entries: LeaderboardEntry[] }
  | { phase: 'name_input'; entries: LeaderboardEntry[]; score: number }
  | { phase: 'board';      entries: LeaderboardEntry[]; newId?: string; score: number };

function fresh(hiScore = 0): GS {
  return {
    phase: 'idle',
    score: 0, hiScore,
    speed: 5.5, frame: 0,
    playerBottom: GROUND, vy: 0, onGround: true,
    obstacles: [],
    nextIn: 90,
    groundOff: 0,
    animId: 0,
    lastMilestone: 0,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RingRunner({ onClose }: { onClose: () => void }) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const gsRef          = useRef<GS>(fresh());
  const closeBtnRef    = useRef<HTMLButtonElement>(null);
  const hofBtnRef      = useRef<HTMLButtonElement>(null);
  const onDeathRef     = useRef<((score: number) => void) | undefined>(undefined);
  const isNameInputRef = useRef(false);
  const isHofRef       = useRef(false);

  const [deadUI,     setDeadUI]     = useState<DeadUI>({ phase: 'hidden' });
  const [nameVal,    setNameVal]    = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Shared leaderboard fetch ─────────────────────────────────────────────────
  const fetchBoard = useCallback(async (): Promise<LeaderboardEntry[]> => {
    const res  = await fetch(`${API_URL}/api/leaderboard`);
    const data = (await res.json()) as { entries: LeaderboardEntry[] };
    return data.entries;
  }, []);

  // ── Hall of Fame (pre-game) ──────────────────────────────────────────────────
  const openHof = useCallback(async () => {
    if (gsRef.current.phase === 'running') return;
    isHofRef.current = true;
    setDeadUI({ phase: 'loading' });
    try {
      const entries = await fetchBoard();
      setDeadUI({ phase: 'hof', entries });
    } catch {
      setDeadUI({ phase: 'hof', entries: [] });
    }
  }, [fetchBoard]);

  const closeHof = useCallback(() => {
    isHofRef.current = false;
    setDeadUI({ phase: 'hidden' });
  }, []);

  // ── On-death handler ────────────────────────────────────────────────────────
  const handleDeath = useCallback(async (score: number) => {
    setDeadUI({ phase: 'loading' });
    try {
      const entries = await fetchBoard();
      const qualifies =
        entries.length < 10 || score > (entries[entries.length - 1]?.score ?? 0);

      if (qualifies) {
        isNameInputRef.current = true;
        setDeadUI({ phase: 'name_input', entries, score });
      } else {
        setDeadUI({ phase: 'board', entries, score });
      }
    } catch {
      setDeadUI({ phase: 'board', entries: [], score });
    }
  }, [fetchBoard]);

  // Keep ref pointing to latest handler (avoids stale closure in game loop)
  useEffect(() => {
    onDeathRef.current = handleDeath;
  }, [handleDeath]);

  // ── Name submit ─────────────────────────────────────────────────────────────
  const submitName = useCallback(async () => {
    if (deadUI.phase !== 'name_input') return;
    const name = nameVal.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
    if (name.length !== 3) return;

    setSubmitting(true);
    try {
      const res  = await fetch(`${API_URL}/api/leaderboard`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, score: deadUI.score }),
      });
      const data = (await res.json()) as {
        entry: LeaderboardEntry | null;
        entries: LeaderboardEntry[];
      };
      isNameInputRef.current = false;
      setDeadUI({
        phase:   'board',
        entries: data.entries,
        newId:   data.entry?.id,
        score:   deadUI.score,
      });
    } catch {
      isNameInputRef.current = false;
      setDeadUI({ phase: 'board', entries: deadUI.entries, score: deadUI.score });
    } finally {
      setSubmitting(false);
    }
  }, [deadUI, nameVal]);

  // ── jump / restart ─────────────────────────────────────────────────────────
  const jump = useCallback(() => {
    if (isNameInputRef.current || isHofRef.current) return;

    const g = gsRef.current;
    if (g.phase === 'idle') {
      g.phase = 'running';
      return;
    }
    if (g.phase === 'dead') {
      const hi = g.hiScore;
      Object.assign(gsRef.current, fresh(hi));
      gsRef.current.phase = 'running';
      setDeadUI({ phase: 'hidden' });
      setNameVal('');
      return;
    }
    if (g.onGround) {
      g.vy = JUMP_V;
      g.onGround = false;
      playJump();
    }
  }, []);

  // ── render ─────────────────────────────────────────────────────────────────
  const draw = useCallback((ctx: CanvasRenderingContext2D, g: GS) => {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1a0505');
    sky.addColorStop(1, '#3d1010');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Mount Doom silhouette
    ctx.fillStyle = '#2a0a0a';
    ctx.beginPath();
    ctx.moveTo(668, H);
    ctx.lineTo(769, 102);
    ctx.lineTo(870, H);
    ctx.fill();

    // Lava glow
    const glow = ctx.createRadialGradient(769, 99, 0, 769, 99, 65);
    glow.addColorStop(0, 'rgba(255,90,0,0.55)');
    glow.addColorStop(1, 'rgba(255,90,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(769, 99, 65, 0, Math.PI * 2);
    ctx.fill();

    // Ground fill + top edge
    ctx.fillStyle = '#3a1500';
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#5c2200';
    ctx.fillRect(0, GROUND, W, 3);

    // Scrolling ground dashes
    const dashSpacing = 46;
    const numDashes   = Math.ceil(W / dashSpacing) + 2;
    const dashOffset  = g.groundOff % dashSpacing;
    ctx.strokeStyle = '#4a1c00';
    ctx.lineWidth   = 2;
    for (let i = 0; i < numDashes; i++) {
      const x = i * dashSpacing - dashOffset;
      ctx.beginPath();
      ctx.moveTo(x, GROUND + 14);
      ctx.lineTo(x + 22, GROUND + 14);
      ctx.stroke();
    }

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';

    // Player — subtle bounce bob when running on ground
    const bob = (g.phase === 'running' && g.onGround)
      ? Math.sin(g.frame * 0.35) * 2
      : 0;
    ctx.font = `${P_SIZE}px serif`;
    ctx.fillText('🧙', PLYR_X, g.playerBottom + bob);

    // Obstacles
    for (const obs of g.obstacles) {
      ctx.font = `${obs.size}px serif`;
      ctx.fillText(obs.kind === 'sword' ? '🗡️' : '🦅', obs.x, obs.y);
    }

    // Score (top-right)
    ctx.font          = 'bold 14px monospace';
    ctx.fillStyle     = '#f59e0b';
    ctx.textAlign     = 'right';
    ctx.textBaseline  = 'top';
    ctx.fillText(`⚔️ ${String(g.score).padStart(5, '0')}`, W - 14, 12);
    if (g.hiScore > 0) {
      ctx.fillStyle = 'rgba(245,158,11,0.38)';
      ctx.fillText(`HI  ${String(g.hiScore).padStart(5, '0')}`, W - 14, 31);
    }

    // ── Canvas overlay (idle / dead) ─────────────────────────────────────────
    if (g.phase !== 'running') {
      ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      if (g.phase === 'idle') {
        ctx.font      = 'bold 24px serif';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('🧙  Run, you fools!  🧙', W / 2, H / 2 - 18);
        ctx.font      = '13px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Space · ↑ · tap  to begin', W / 2, H / 2 + 18);
      } else {
        ctx.font      = 'bold 22px serif';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('YOU SHALL NOT PASS!  🔥', W / 2, H / 2 - 28);
        ctx.font      = '14px monospace';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`Leagues reached: ${g.score}`, W / 2, H / 2 + 4);
        ctx.font      = '12px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Space · tap  to try again', W / 2, H / 2 + 28);
      }
    }
  }, []);

  // ── Game loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const g = gsRef.current;

    const tick = () => {
      if (g.phase === 'running') {
        g.frame++;
        g.score = Math.floor(g.frame / 6);

        // ── Gradual linear speed ramp (Google-dino style) ──────────────────
        // Coefficient 0.003 → reaches max (~13) around score 2500 (~4 min)
        g.speed = Math.min(5.5 + g.score * 0.003, 13);
        g.groundOff = (g.groundOff + g.speed) % (W + 50);

        // Milestone sounds
        for (const m of MILESTONES) {
          if (g.score >= m && g.lastMilestone < m) {
            g.lastMilestone = m;
            playMilestone();
          }
        }

        // Player physics
        g.vy += GRAVITY;
        g.playerBottom = Math.min(g.playerBottom + g.vy, GROUND);
        if (g.playerBottom >= GROUND) {
          g.playerBottom = GROUND;
          g.vy           = 0;
          g.onGround     = true;
        }

        // Spawn obstacles
        g.nextIn--;
        if (g.nextIn <= 0) {
          const isAir = g.score > 100 && Math.random() < 0.28;
          const size  = 30 + Math.floor(Math.random() * 14);
          g.obstacles.push({
            x:    W + size,
            y:    isAir ? GROUND - 54 : GROUND,
            kind: isAir ? 'nazgul' : 'sword',
            size,
          });
          if (isAir) playNazgul();
          const minGap = Math.max(55, 95 - g.score * 0.022);
          g.nextIn = minGap + Math.floor(Math.random() * minGap * 0.9);
        }

        // Move + cull off-screen obstacles
        for (const obs of g.obstacles) obs.x -= g.speed;
        g.obstacles = g.obstacles.filter(o => o.x > -80);

        // ── AABB collision ─────────────────────────────────────────────────
        // Hitboxes use plain size fractions — no extra pad that collapsed the box
        const pL = PLYR_X - P_SIZE * P_HW;
        const pR = PLYR_X + P_SIZE * P_HW;
        const pT = g.playerBottom - P_SIZE * P_HH;
        const pB = g.playerBottom - 2;

        for (const obs of g.obstacles) {
          const oL = obs.x - obs.size * O_HW;
          const oR = obs.x + obs.size * O_HW;
          const oT = obs.y - obs.size * O_HH;
          const oB = obs.y - 2;

          if (pL < oR && pR > oL && pT < oB && pB > oT) {
            g.phase = 'dead';
            if (g.score > g.hiScore) g.hiScore = g.score;
            playDeath();
            onDeathRef.current?.(g.score);
            break;
          }
        }
      }

      draw(ctx, g);
      g.animId = requestAnimationFrame(tick);
    };

    g.animId = requestAnimationFrame(tick);

    // Keyboard controls
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (isNameInputRef.current || isHofRef.current) return;
        e.preventDefault();
        jump();
      }
      if (e.code === 'Escape') {
        if (isHofRef.current) { closeHof(); return; }
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);

    // Mobile: tap anywhere to jump (but not the close / hof buttons)
    const onDocTouch = (e: TouchEvent) => {
      const target = e.target as Node;
      if (closeBtnRef.current?.contains(target)) return;
      if (hofBtnRef.current?.contains(target))   return;
      jump();
    };
    document.addEventListener('touchstart', onDocTouch, { passive: true });

    return () => {
      cancelAnimationFrame(g.animId);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('touchstart', onDocTouch);
    };
  }, [draw, jump, onClose, closeHof]);

  // ── Leaderboard entries list (shared rendering) ───────────────────────────
  const renderEntries = (entries: LeaderboardEntry[], newId?: string) => (
    <div className="w-full max-w-xs flex flex-col gap-1 flex-1 overflow-auto">
      {entries.length === 0 && (
        <p className="text-slate-500 font-mono text-xs text-center mt-4">No entries yet.</p>
      )}
      {entries.map((e, i) => (
        <div
          key={e.id}
          className={`flex items-center gap-2 font-mono text-sm px-2 py-0.5 rounded ${
            e.id === newId
              ? 'bg-amber-400/15 text-amber-400 font-bold'
              : 'text-slate-300'
          }`}
        >
          <span className="w-5 text-right text-slate-500">{i + 1}.</span>
          <span className="w-9 tracking-widest uppercase">{e.name}</span>
          <span className="ml-auto tabular-nums">{String(e.score).padStart(5, '0')}</span>
          {e.id === newId && <span className="text-amber-400 text-xs">◀ YOU</span>}
        </div>
      ))}
    </div>
  );

  // ── HTML overlay ─────────────────────────────────────────────────────────
  const renderOverlay = () => {
    if (deadUI.phase === 'hidden') return null;

    if (deadUI.phase === 'loading') {
      return (
        <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center bg-black/80">
          <div className="w-7 h-7 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-3" />
          <p className="text-amber-400/70 font-mono text-sm">Consulting the Palantír…</p>
        </div>
      );
    }

    if (deadUI.phase === 'hof') {
      return (
        <div className="absolute inset-0 rounded-xl flex flex-col items-center bg-black/90 px-4 py-4">
          <p className="text-amber-400 font-mono font-bold text-base tracking-widest mb-3">
            🏆 HALL OF FAME
          </p>
          {renderEntries(deadUI.entries)}
          <button
            onClick={closeHof}
            className="mt-4 px-6 py-1.5 border border-amber-400/40 text-amber-400/70 hover:text-amber-400 hover:border-amber-400 font-mono text-sm rounded transition-colors cursor-pointer"
          >
            Back
          </button>
        </div>
      );
    }

    if (deadUI.phase === 'name_input') {
      const canSubmit = nameVal.replace(/[^A-Za-z0-9]/g, '').length === 3 && !submitting;
      return (
        <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center bg-black/85 gap-4 px-4">
          <p className="text-red-400 font-mono font-bold text-lg tracking-widest">NEW RECORD!</p>
          <p className="text-amber-400 font-mono text-3xl font-bold tabular-nums">
            {String(deadUI.score).padStart(5, '0')}
          </p>
          <p className="text-slate-300 font-mono text-sm">Enter your name (3 characters)</p>
          <input
            autoFocus
            maxLength={3}
            value={nameVal}
            onChange={e => setNameVal(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            onKeyDown={e => { if (e.key === 'Enter' && canSubmit) submitName(); }}
            className="w-28 text-center text-amber-400 bg-transparent border-b-2 border-amber-400 font-mono text-3xl tracking-[0.5em] uppercase outline-none caret-amber-400"
            placeholder="   "
            spellCheck={false}
          />
          <button
            onClick={submitName}
            disabled={!canSubmit}
            className="mt-1 px-6 py-2 bg-amber-400 text-black font-mono font-bold text-sm rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-300 transition-colors cursor-pointer"
          >
            {submitting ? 'Inscribing…' : 'Inscribe'}
          </button>
        </div>
      );
    }

    // board (post-death)
    const { entries, newId, score } = deadUI;
    return (
      <div className="absolute inset-0 rounded-xl flex flex-col items-center bg-black/85 px-4 py-4 overflow-auto">
        <p className="text-amber-400 font-mono font-bold text-base tracking-widest mb-3">
          🏆 HALL OF FAME
        </p>
        {renderEntries(entries, newId)}
        <div className="mt-3 text-center">
          <p className="text-slate-400 font-mono text-sm tabular-nums">
            Your score: <span className="text-amber-400 font-bold">{String(score).padStart(5, '0')}</span>
          </p>
          <p className="text-slate-600 font-mono text-xs mt-1">SPACE · tap to play again</p>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9995]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Mobile backdrop */}
      <div
        className="sm:hidden absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, #1a0505 0%, #3d1010 100%)' }}
      />
      {/* Desktop backdrop */}
      <div className="hidden sm:block absolute inset-0 bg-black/80" />

      <div className="relative z-10 flex items-center justify-center w-full h-full sm:p-4">
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1 }}
          exit={{    scale: 0.88, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="ring-runner-card w-full sm:max-w-4xl p-4 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3 px-1 shrink-0">
            <p className="text-amber-400 font-bold text-sm font-serif tracking-wide">
              ⚔️ The Road to Mordor
            </p>
            <div className="flex items-center gap-1">
              <button
                ref={hofBtnRef}
                onClick={openHof}
                title="Hall of Fame"
                className="text-amber-400/50 hover:text-amber-400 text-base leading-none cursor-pointer transition-colors p-2"
                aria-label="Hall of Fame"
              >
                🏆
              </button>
              <button
                ref={closeBtnRef}
                onClick={onClose}
                className="text-tx-muted hover:text-tx-primary text-lg leading-none cursor-pointer transition-colors p-2 -mr-2"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Canvas + overlay wrapper
              Mobile: aspect-square so the game fills a tall square area.
              bg-[#1a0505] matches the canvas sky top — letterbox bars look seamless.
              flex items-center centers the wide canvas vertically in the square space. */}
          <div className="relative rounded-xl overflow-hidden bg-[#1a0505]
                          aspect-square sm:aspect-auto flex items-center sm:block">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              onClick={jump}
              className="w-full block shrink-0"
              style={{ touchAction: 'none' }}
            />
            <AnimatePresence>
              {deadUI.phase !== 'hidden' && (
                <motion.div
                  key={deadUI.phase}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0"
                >
                  {renderOverlay()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="hidden sm:block text-tx-muted text-xs text-center mt-2.5 shrink-0">
            🧙 dodge&nbsp;🗡️&nbsp;swords &nbsp;·&nbsp; 🦅&nbsp;fell&nbsp;beasts appear after score&nbsp;100 &nbsp;·&nbsp; ESC to close
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
