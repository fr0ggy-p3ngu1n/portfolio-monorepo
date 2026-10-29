/*
 * leds.c: a tiny "firmware" for a 32x8 LED matrix, compiled to WebAssembly.
 *
 * Written the way I'd write it for a microcontroller: no libc, no malloc,
 * fixed-size buffers, a fixed-timestep tick, and integer math only. The page
 * calls tick() every animation frame and draws the framebuffer this code
 * writes (one brightness byte per LED) straight out of WebAssembly memory.
 *
 * Build: see build.sh (clang --target=wasm32 -nostdlib, linked with wasm-ld).
 */

#define W 32
#define H 8
#define N (W * H)
#define STEP_MS 16                 /* fixed timestep, about 60 Hz */
#define EXPORT(name) __attribute__((export_name(#name)))

enum { MODE_SCANNER, MODE_LIFE, MODE_TEXT, MODE_BARS, MODE_COUNT };

static unsigned char fb[N];        /* brightness 0..255, row-major */
static unsigned char cells[N];     /* Game of Life state */
static unsigned char next[N];
static unsigned char bars[W];

static int mode = MODE_SCANNER;
static unsigned int acc;           /* ms not yet consumed by the timestep */
static unsigned int frame;         /* fixed steps since the last mode change */
static unsigned int rng = 0x2545F491u;

/* xorshift32: small, fast, good enough for blinkenlights */
static unsigned int rand32(void) {
  rng ^= rng << 13;
  rng ^= rng >> 17;
  rng ^= rng << 5;
  return rng;
}

static void clear(void) {
  for (int i = 0; i < N; i++) fb[i] = 0;
}

static void fade(unsigned int keep /* out of 256 */) {
  for (int i = 0; i < N; i++) fb[i] = (unsigned char)((fb[i] * keep) >> 8);
}

/* ── Scanner: a dot sweeps back and forth leaving a fading trail ── */
static void scanner(void) {
  fade(205);
  unsigned int pos = (frame / 2) % (2 * (W - 1));
  int x = pos < W ? (int)pos : (int)(2 * (W - 1) - pos);
  for (int y = 2; y < 6; y++) fb[y * W + x] = 255;
}

/* ── Game of Life on a wrapping 32x8 board ── */
static void life_seed(void) {
  for (int i = 0; i < N; i++) cells[i] = (rand32() & 3) == 0;
}

static void life_step(void) {
  for (int y = 0; y < H; y++) {
    for (int x = 0; x < W; x++) {
      int alive = 0;
      for (int dy = -1; dy <= 1; dy++)
        for (int dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          alive += cells[((y + dy + H) % H) * W + (x + dx + W) % W];
        }
      int i = y * W + x;
      next[i] = alive == 3 || (cells[i] && alive == 2);
    }
  }
  int population = 0;
  for (int i = 0; i < N; i++) population += (cells[i] = next[i]);
  if (population < 6) life_seed();          /* reseed when it dies out */
}

static void life(void) {
  if (frame % 9 == 0) life_step();
  for (int i = 0; i < N; i++) fb[i] = cells[i] ? 255 : (unsigned char)((fb[i] * 150) >> 8);
}

/* ── Scrolling text from a 5x7 font (only the glyphs the message needs) ── */
static const char MESSAGE[] = "HELLO FROM C   ";
static const unsigned char FONT[][5] = {   /* columns, bit 0 = top row */
  /* ' ' */ {0x00, 0x00, 0x00, 0x00, 0x00},
  /* 'C' */ {0x3E, 0x41, 0x41, 0x41, 0x22},
  /* 'E' */ {0x7F, 0x49, 0x49, 0x49, 0x41},
  /* 'F' */ {0x7F, 0x09, 0x09, 0x09, 0x01},
  /* 'H' */ {0x7F, 0x08, 0x08, 0x08, 0x7F},
  /* 'L' */ {0x7F, 0x40, 0x40, 0x40, 0x40},
  /* 'M' */ {0x7F, 0x02, 0x0C, 0x02, 0x7F},
  /* 'O' */ {0x3E, 0x41, 0x41, 0x41, 0x3E},
  /* 'R' */ {0x7F, 0x09, 0x19, 0x29, 0x46},
};
static const char GLYPHS[] = " CEFHLMOR";

static const unsigned char *glyph(char c) {
  for (int i = 0; GLYPHS[i]; i++)
    if (GLYPHS[i] == c) return FONT[i];
  return FONT[0];
}

static void text(void) {
  clear();
  int len = (int)sizeof(MESSAGE) - 1;
  int total = len * 6;                       /* 5 columns + 1 space per char */
  int offset = (int)(frame / 4) % total;
  for (int x = 0; x < W; x++) {
    int col = (offset + x) % total;
    int ch = col / 6, cx = col % 6;
    if (cx == 5) continue;
    unsigned char bits = glyph(MESSAGE[ch])[cx];
    for (int y = 0; y < 7; y++)
      if (bits & (1 << y)) fb[(y + 1) * W + x] = 255;
  }
}

/* ── Equaliser bars that jump and fall back ── */
static void eq(void) {
  if (frame % 6 == 0)
    for (int x = 0; x < W; x++) {
      unsigned char target = (unsigned char)(rand32() % (H + 1));
      if (target > bars[x]) bars[x] = target;
    }
  if (frame % 3 == 0)
    for (int x = 0; x < W; x++) if (bars[x]) bars[x]--;
  for (int x = 0; x < W; x++)
    for (int y = 0; y < H; y++)
      fb[y * W + x] = (H - y) <= bars[x] ? (unsigned char)(140 + (H - y) * 14) : 0;
}

/* ── Exports the page calls ── */
EXPORT(framebuffer) unsigned char *framebuffer(void) { return fb; }
EXPORT(width) int width(void) { return W; }
EXPORT(height) int height(void) { return H; }
EXPORT(get_mode) int get_mode(void) { return mode; }

EXPORT(set_mode) void set_mode(int m) {
  mode = ((m % MODE_COUNT) + MODE_COUNT) % MODE_COUNT;
  frame = 0;
  clear();
  if (mode == MODE_LIFE) life_seed();
}

/* Click an LED: in Life mode flip that cell, otherwise jump to Life */
EXPORT(poke) void poke(int x, int y) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  if (mode != MODE_LIFE) set_mode(MODE_LIFE);
  cells[y * W + x] ^= 1;
  fb[y * W + x] = cells[y * W + x] ? 255 : 0;
}

EXPORT(seed) void seed(unsigned int s) { rng = s ? s : 1; }

/* Advance by the real elapsed time, in fixed steps, then hand back the frame
   count so the page can show the step rate */
EXPORT(tick) unsigned int tick(unsigned int elapsed_ms) {
  if (elapsed_ms > 250) elapsed_ms = 250;   /* tab was asleep: don't fast-forward */
  acc += elapsed_ms;
  while (acc >= STEP_MS) {
    acc -= STEP_MS;
    frame++;
    switch (mode) {
      case MODE_SCANNER: scanner(); break;
      case MODE_LIFE: life(); break;
      case MODE_TEXT: text(); break;
      default: eq(); break;
    }
  }
  return frame;
}
