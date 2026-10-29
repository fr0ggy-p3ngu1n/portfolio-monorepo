import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

// A 32x8 LED matrix driven by firmware-style C (wasm/leds.c) compiled to a
// ~2.7 KB WebAssembly module. Each frame the page calls tick(ms) and paints
// the framebuffer the C code wrote into WebAssembly memory.

type Leds = {
  memory: WebAssembly.Memory;
  framebuffer(): number;
  width(): number;
  height(): number;
  get_mode(): number;
  set_mode(m: number): void;
  poke(x: number, y: number): void;
  seed(s: number): void;
  tick(ms: number): number;
};

const MODES = ['Scanner', 'Life', 'Text', 'Bars'];
const SOURCE_URL = 'https://github.com/fr0ggy-p3ngu1n/portfolio-monorepo/blob/main/apps/web/wasm/leds.c';

async function load(): Promise<{ leds: Leds; bytes: number }> {
  const res = await fetch('/leds.wasm');
  const buf = await res.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(buf);
  return { leds: instance.exports as unknown as Leds, bytes: buf.byteLength };
}

export default function LedPanel() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ledsRef = useRef<Leds | null>(null);
  const reduce = useReducedMotion();
  const [bytes, setBytes] = useState<number | null>(null);
  const [mode, setMode] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [rate, setRate] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const onScreen = useRef(false);

  // Reduced motion: start paused (Play still works)
  useEffect(() => { if (reduce) setPlaying(false); }, [reduce]);

  useEffect(() => {
    let cancelled = false;
    load()
      .then(({ leds, bytes }) => {
        if (cancelled) return;
        leds.seed((Math.random() * 0xffffffff) >>> 0);
        leds.set_mode(0);
        leds.tick(400);                       // show something even when paused
        ledsRef.current = leds;
        setBytes(bytes);
      })
      .catch(() => setFailed(true));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !bytes) return;
    const leds = ledsRef.current!;
    const W = leds.width(), H = leds.height();
    const ctx = c.getContext('2d')!;
    let raf = 0, last = performance.now(), steps = 0, stepsAt = last, prevFrame = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const cw = c.clientWidth, ch = c.clientHeight;
      if (c.width !== Math.round(cw * dpr)) { c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      const fb = new Uint8Array(leds.memory.buffer, leds.framebuffer(), W * H);
      const pitch = cw / W, r = pitch * 0.36;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const v = fb[y * W + x] / 255;
          const cx = pitch * (x + 0.5), cy = pitch * (y + 0.5);
          if (v > 0.05) {
            ctx.fillStyle = `rgba(236,72,153,${0.18 * v})`;
            ctx.beginPath(); ctx.arc(cx, cy, r * 1.9, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = v > 0.05 ? `rgba(${236 + 19 * v},${72 + 120 * v * v},${153 + 60 * v * v},${0.35 + 0.65 * v})` : 'rgba(167,139,250,0.10)';
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        }
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = now - last; last = now;
      if (!playing || !onScreen.current) return;
      const frame = leds.tick(Math.round(dt));
      steps += frame >= prevFrame ? frame - prevFrame : frame;
      prevFrame = frame;
      if (now - stepsAt > 1000) { setRate(Math.round((steps * 1000) / (now - stepsAt))); steps = 0; stepsAt = now; }
      draw();
    };

    const io = new IntersectionObserver(([e]) => { onScreen.current = e.isIntersecting; }, { threshold: 0.1 });
    io.observe(c);
    draw();
    raf = requestAnimationFrame(loop);
    const redraw = () => draw();
    window.addEventListener('resize', redraw);
    (c as HTMLCanvasElement & { redraw?: () => void }).redraw = draw;
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('resize', redraw); };
  }, [bytes, playing]);

  const pick = (m: number) => {
    ledsRef.current?.set_mode(m);
    ledsRef.current?.tick(200);
    setMode(m);
    (canvas.current as (HTMLCanvasElement & { redraw?: () => void }) | null)?.redraw?.();
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const leds = ledsRef.current, c = canvas.current;
    if (!leds || !c) return;
    const box = c.getBoundingClientRect();
    leds.poke(Math.floor(((e.clientX - box.left) / box.width) * leds.width()), Math.floor(((e.clientY - box.top) / box.height) * leds.height()));
    setMode(leds.get_mode());
    (c as HTMLCanvasElement & { redraw?: () => void }).redraw?.();
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-7 flex flex-col gap-5 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <h3 className="text-lg font-semibold text-tx-primary">Firmware in your browser</h3>
          <p className="text-sm text-tx-secondary mt-1 leading-relaxed">
            A 32×8 LED matrix run by C written the way I'd write it for a microcontroller (no libc,
            no malloc, a fixed-timestep tick), compiled to WebAssembly with clang. Click the LEDs to
            draw Game of Life cells.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="glass px-4 py-2 rounded-xl text-sm font-medium text-tx-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>

      <div className="rounded-xl bg-[#07050d] border border-bd-primary p-3">
        {failed ? (
          <p className="text-sm text-tx-secondary p-4">This browser couldn't load the WebAssembly module.</p>
        ) : (
          <canvas
            ref={canvas}
            onClick={onClick}
            className="block w-full aspect-[4/1] cursor-crosshair"
            role="img"
            aria-label={`LED matrix showing the ${MODES[mode]} pattern`}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap p-1 rounded-xl border border-bd-primary bg-bg-base/60" role="group" aria-label="LED pattern">
          {MODES.map((m, i) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === i}
              onClick={() => pick(i)}
              className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-pink-400 ${mode === i ? 'bg-pink-500 text-white font-semibold' : 'text-tx-secondary hover:text-tx-primary'}`}
            >
              {m}
            </button>
          ))}
        </div>
        <p className="text-xs text-tx-muted font-mono">
          {bytes ? `${bytes.toLocaleString()}-byte .wasm` : '…'}
          {rate !== null && playing ? ` · ${rate} steps/s` : ''}
          {' · '}
          <a className="underline decoration-dotted underline-offset-2 hover:text-tx-accent" href={SOURCE_URL} target="_blank" rel="noopener noreferrer">view the C</a>
        </p>
      </div>
    </div>
  );
}
