import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { playJump, playDeath, playMilestone, playNazgul } from '../lib/gameAudio';

// ─── Canvas / physics constants ───────────────────────────────────────────────
const W       = 700;
const H       = 260;
const GROUND  = 192;   // y of the ground surface
const PLYR_X  = 100;   // player horizontal position (fixed)
const P_SIZE  = 40;    // player emoji size
const GRAVITY = 0.62;
const JUMP_V  = -14.5;
const PAD     = 8;     // collision-box forgiveness padding

const MILESTONES = [100, 500, 1000];

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
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const gsRef       = useRef<GS>(fresh());
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // ── jump / restart ────────────────────────────────────────────────────────
  const jump = useCallback(() => {
    const g = gsRef.current;
    if (g.phase === 'idle') {
      g.phase = 'running';
      return;
    }
    if (g.phase === 'dead') {
      const hi = g.hiScore;
      Object.assign(gsRef.current, fresh(hi));
      gsRef.current.phase = 'running';
      return;
    }
    if (g.onGround) {
      g.vy = JUMP_V;
      g.onGround = false;
      playJump();
    }
  }, []);

  // ── render ────────────────────────────────────────────────────────────────
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
    ctx.moveTo(520, H);
    ctx.lineTo(598, 78);
    ctx.lineTo(676, H);
    ctx.fill();

    // Lava glow
    const glow = ctx.createRadialGradient(598, 76, 0, 598, 76, 50);
    glow.addColorStop(0, 'rgba(255,90,0,0.55)');
    glow.addColorStop(1, 'rgba(255,90,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(598, 76, 50, 0, Math.PI * 2);
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

    // ── Overlay (idle / dead) ──────────────────────────────────────────────
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

  // ── Game loop ─────────────────────────────────────────────────────────────
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
        g.speed = Math.min(5.5 + g.score * 0.004, 14);
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
          const minGap = Math.max(52, 90 - g.score * 0.025);
          g.nextIn = minGap + Math.floor(Math.random() * minGap * 0.9);
        }

        // Move + cull off-screen obstacles
        for (const obs of g.obstacles) obs.x -= g.speed;
        g.obstacles = g.obstacles.filter(o => o.x > -80);

        // AABB collision (with forgiveness padding)
        for (const obs of g.obstacles) {
          const pL = PLYR_X - P_SIZE * 0.26 + PAD;
          const pR = PLYR_X + P_SIZE * 0.26 - PAD;
          const pT = g.playerBottom - P_SIZE * 0.86 + PAD;
          const pB = g.playerBottom - PAD;

          const oL = obs.x - obs.size * 0.26 + PAD;
          const oR = obs.x + obs.size * 0.26 - PAD;
          const oT = obs.y - obs.size * 0.86 + PAD;
          const oB = obs.y - PAD;

          if (pL < oR && pR > oL && pT < oB && pB > oT) {
            g.phase = 'dead';
            if (g.score > g.hiScore) g.hiScore = g.score;
            playDeath();
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
        e.preventDefault();
        jump();
      }
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    // Mobile: tap anywhere to jump (but not the close button)
    const onDocTouch = (e: TouchEvent) => {
      const target = e.target as Node;
      if (closeBtnRef.current?.contains(target)) return;
      jump();
    };
    document.addEventListener('touchstart', onDocTouch, { passive: true });

    return () => {
      cancelAnimationFrame(g.animId);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('touchstart', onDocTouch);
    };
  }, [draw, jump, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[9995]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Mobile backdrop — matches the game's own sky so the canvas blends in seamlessly */}
      <div
        className="sm:hidden absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, #1a0505 0%, #3d1010 100%)' }}
      />
      {/* Desktop backdrop — standard dark scrim */}
      <div className="hidden sm:block absolute inset-0 bg-black/80" />

      {/* Centered layout — canvas keeps its natural aspect ratio on mobile */}
      <div className="relative z-10 flex items-center justify-center w-full h-full sm:p-4">
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1 }}
          exit={{    scale: 0.88, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="ring-runner-card w-full sm:max-w-2xl p-4 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3 px-1 shrink-0">
            <p className="text-amber-400 font-bold text-sm font-serif tracking-wide">
              ⚔️ The Road to Mordor
            </p>
            <button
              ref={closeBtnRef}
              onClick={onClose}
              className="text-tx-muted hover:text-tx-primary text-lg leading-none cursor-pointer transition-colors p-2 -mr-2"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Wrapper clips canvas to rounded corners — border-radius on <canvas> alone has no effect */}
          <div className="rounded-xl overflow-hidden">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              onClick={jump}
              className="w-full block"
              style={{ touchAction: 'none' }}
            />
          </div>

          <p className="hidden sm:block text-tx-muted text-xs text-center mt-2.5 shrink-0">
            🧙 dodge&nbsp;🗡️&nbsp;swords &nbsp;·&nbsp; 🦅&nbsp;fell&nbsp;beasts appear after score&nbsp;100 &nbsp;·&nbsp; ESC to close
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
