# Matthew Sullivan — Portfolio

Personal portfolio and live full-stack demo.
**[matthewsullivan.dev](https://matthewsullivan.dev)**

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, TypeScript 5 |
| Styling | Tailwind CSS v4, CSS custom properties |
| Animations | Framer Motion 12 |
| Backend | Hono 4 on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite edge DB) + Prisma |
| File Storage | Cloudflare R2 (resume PDF) |
| Email | Resend |
| Auth | Single-password bcrypt + 24h HS256 JWT |
| Monorepo | pnpm workspaces |
| Hosting | Cloudflare Pages (web) + Cloudflare Workers (API) |

---

## Repository Structure

```
portfolio/
├── apps/
│   ├── web/               # React SPA (Cloudflare Pages)
│   │   └── src/
│   │       ├── components/
│   │       │   ├── layout/        # Header, Footer
│   │       │   ├── sections/      # Hero, Skills, Experience, Projects, Education, AboutMe, Contact
│   │       │   ├── EasterEggs.tsx # All global easter egg listeners
│   │       │   ├── RingRunner.tsx # Hidden LOTR canvas game
│   │       │   ├── CommandPalette.tsx
│   │       │   ├── BackToTop.tsx
│   │       │   ├── GyroPermission.tsx
│   │       │   └── ScrollProgress.tsx
│   │       ├── context/           # ThemeContext, AuthContext
│   │       ├── hooks/             # useTilt (3-D card effect, gyroscope on mobile)
│   │       ├── lib/               # api.ts, smoothScroll.ts, gameAudio.ts, token.ts
│   │       ├── pages/             # Home, admin/Dashboard, admin/Login, admin/ProjectForm
│   │       └── router/
│   └── api/               # Hono REST API (Cloudflare Workers)
│       └── src/
│           ├── middleware/        # CORS, adminAuth (JWT guard)
│           └── routes/            # auth, projects, contact, resume
└── packages/
    └── shared/            # Zod schemas + TypeScript types (consumed by both apps)
```

---

## Features

### Frontend
- **Liquid glass UI** — all cards use layered `backdrop-filter` glass effects; amber accent throughout
- **Dark / light mode** — CSS custom-property token system; preference stored in `localStorage`
- **3-D tilt cards** — mouse-tracking perspective transform on desktop; gyroscope tilt on mobile (iOS permission flow included)
- **Smooth custom scroll** — eased `requestAnimationFrame` scroll for all nav links and the Back to Top button (easeInOutCubic, 500–900 ms adaptive duration)
- **Command palette** — ⌘K / Ctrl+K opens a full-screen searchable palette with nav links, resume download, and social links
- **Scroll progress bar** — amber indicator at the top of the viewport
- **Typewriter hero** — cycling role titles with typing / pausing / deleting state machine
- **Animated dot-grid background** — subtle drifting dot pattern in the hero
- **Parallax hero** — content translates upward on scroll using `useTransform`
- **Responsive hamburger menu** — animated with height + opacity transition; haptic feedback on supported devices
- **Back to Top button** — fades in after 600 px of scroll; haptic on tap
- **prefers-reduced-motion** — all CSS animations and Framer Motion respect the system preference
- **Safe area insets** — fixed elements use `env(safe-area-inset-bottom/top)` for notched phones
- **iOS input zoom fix** — inputs use `text-base md:text-sm` to prevent iOS auto-zoom

### Backend API
- JWT-protected admin CRUD for projects and contact submissions
- Contact form with Zod validation, Resend email delivery, and D1 persistence
- Resume served from Cloudflare R2; updatable via admin panel without redeployment
- Shared Zod schemas between frontend and API (`packages/shared`)

### Admin Panel (`/admin`)
- Single-password login → 24-hour JWT stored in `localStorage`
- Manage projects (create, edit, delete)
- View and mark contact submissions as read
- Upload a new resume PDF directly to R2

---

## Easter Eggs

There are **6 hidden easter eggs** — all LOTR themed. None are mentioned anywhere on the site.

### 🧙 A — The One Ring (Konami Code)
**Trigger:** Type the Konami Code on your keyboard: `↑ ↑ ↓ ↓ ← → ← → B A`
**Effect:** A full-screen overlay appears displaying the One Ring and the full Ring inscription in the Dark Speech of Mordor. Click anywhere to dismiss.

### 🧙 B — Gandalf Quote (type "shire")
**Trigger:** Type the word `shire` anywhere on the page (no input focused needed).
**Effect:** A toast notification pops up from the bottom-right corner with a randomly chosen Gandalf quote. Disappears after 5 seconds.

### 🐍 H — "My Precious" (Python tag)
**Trigger:** Click the `Python` skill tag in the Skills section.
**Effect:** A small tooltip appears above the tag showing the One Ring image and the text *"My Precious…"* in italic serif. Disappears after 3 seconds.

### 🕹️ G — The Road to Mordor (hidden mini-game)
**Trigger:** Go to the **About → Beyond the Code** section. Find the **Gamer** card with the 🕹️ icon. **Hold the card for 1.5 seconds.** An amber progress ring fills around the card while you hold; release early to cancel.
**Effect:** Opens a full Lord of the Rings–themed infinite runner:
- Play as 🧙 Gandalf dodging 🗡️ swords on the ground
- 🦅 Nazgûl fell beasts appear as aerial obstacles after score 100
- All sounds are synthesized with the Web Audio API (no audio files): jump blip, death sequence, milestone fanfare (C5→E5→G5→C6), Nazgûl shriek with LFO vibrato
- Score milestones at 100, 500, and 1000 play a fanfare
- High score persists for the session
- **Desktop:** Space / ↑ arrow to jump, ESC to close, click the canvas to jump
- **Mobile:** Tap anywhere on screen to jump; only the ✕ button closes the game
- **Idle prompt:** "Run, you fools!" / **Death screen:** "YOU SHALL NOT PASS! 🔥"

### 👁️ F — The Eye of Sauron (idle detection)
**Trigger:** Leave the page idle (no mouse movement, scrolling, clicks, or key presses) for **1 full minute**.
**Effect:** The Eye of Sauron appears as a glowing card in the bottom-left corner with the message *"I see you…"* pulsing in red. Click it to dismiss. Dismissing it plays a synthesized fire whoosh sound and restarts the idle timer.

### ⌘K — Command Palette (bonus power-user feature)
**Trigger:** Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux), or click the `⌘K` hint button in the desktop header.
**Effect:** Opens a searchable command palette with quick nav links, resume download, and social links. Not strictly a secret, but not labeled as a feature either.

---

## Local Development

**Prerequisites:** Node.js 20+, pnpm 9+, Cloudflare account.

```bash
# Install dependencies
pnpm install

# Copy and fill in local secrets
cp apps/api/.dev.vars.example apps/api/.dev.vars

# Start both apps in parallel
pnpm dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:8787`

---

## API Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | — | Uptime check |
| POST | `/api/auth/login` | — | Returns 24 h JWT |
| GET | `/api/projects` | — | Public project list |
| GET | `/api/projects/:id` | — | Single project |
| POST | `/api/projects` | JWT | Create project |
| PUT | `/api/projects/:id` | JWT | Update project |
| DELETE | `/api/projects/:id` | JWT | Delete project |
| POST | `/api/contact` | — | Submit contact form |
| GET | `/api/contact` | JWT | List submissions |
| PUT | `/api/contact/:id/read` | JWT | Mark as read |
| GET | `/api/resume` | — | Stream resume PDF from R2 |
| PUT | `/api/resume` | JWT | Replace resume PDF in R2 |
| GET | `/api/og` | — | Dynamic 1200×630 OG image (PNG) |

---

## Deployment

### API (Cloudflare Workers)

```bash
# First time — create D1 database and R2 bucket
wrangler d1 create portfolio-db
wrangler r2 bucket create portfolio-assets

# Apply DB migrations
wrangler d1 migrations apply portfolio-db --remote

# Set secrets
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PASSWORD_HASH   # bcrypt hash of your admin password
wrangler secret put RESEND_API_KEY
wrangler secret put CONTACT_EMAIL

# Deploy
pnpm deploy:api
```

To upload the initial resume:
```bash
wrangler r2 object put portfolio-assets/resume.pdf --file ./resume.pdf --remote
```

### Web (Cloudflare Pages)

```bash
pnpm build   # builds to apps/web/dist
npx wrangler pages deploy apps/web/dist --project-name portfolio-web
```

Set `VITE_API_URL=https://portfolio-api.<your-subdomain>.workers.dev` as a Pages environment variable in the Cloudflare dashboard for CI builds.

---

## Auth

No external auth provider. A single bcrypt-hashed password is stored as a Worker secret (`ADMIN_PASSWORD_HASH`). `POST /api/auth/login` verifies it and returns a 24-hour HS256 JWT. The admin panel stores the token in `localStorage` and validates expiry on every navigation.

Generate the initial hash:
```bash
node -e "const b = require('bcryptjs'); b.hash('your-password', 12).then(console.log)"
```

---

## Key Technical Notes

### CSS Token System (Dark / Light Mode)
All colors are CSS custom properties on `:root` (dark defaults), overridden on `html.light`. Mapped to Tailwind tokens via `@theme inline`. Toggled by `ThemeContext` which adds/removes the `.light` class on `<html>` and persists to `localStorage`.

### 3-D Tilt Effect (`src/hooks/useTilt.ts`)
- **Desktop:** `mousemove` computes cursor position relative to card center → `perspective(700px) rotateX rotateY`
- **Mobile:** A module-level singleton registers all tilt cards in a `Set<HTMLElement>`. One `deviceorientation` listener updates every registered element. iOS requires `DeviceOrientationEvent.requestPermission()` from a user gesture; `GyroPermission.tsx` handles the prompt.

### Smooth Scroll (`src/lib/smoothScroll.ts`)
Custom `requestAnimationFrame` loop with `easeInOutCubic`. Duration is adaptive: `clamp(distance × 0.6ms, 500ms, 900ms)`. Used by all nav links, the Back to Top button, and hero CTAs instead of native `scroll-behavior: smooth`.

### Game Audio (`src/lib/gameAudio.ts`)
All sounds are synthesized at runtime using the Web Audio API — no audio files. `AudioContext` is a lazy singleton (browsers require a user gesture before audio can start). See file comments for synthesis details on each sound.

### Dynamic OG Image (`apps/api/src/routes/og.ts`)
`GET /api/og` returns a 1200×630 PNG for use as `og:image` / `twitter:image`. The pipeline:
1. **satori** (`satori/standalone`) — converts a JSX-like element tree to an SVG string, converting text to paths using Inter font data fetched from jsDelivr at cold-start.
2. **resvg** (`@cf-wasm/resvg/workerd`) — renders the SVG to a PNG via a Rust-powered WebAssembly renderer.

Both WASM binaries (yoga layout engine + resvg) are bundled at build time by Wrangler's `[[rules]] type = "CompiledWasm"` entry. Cloudflare Workers blocks runtime WASM compilation from raw bytes (`WebAssembly.compile` / `WebAssembly.instantiate(bytes, …)`), but allows instantiation of pre-compiled `WebAssembly.Module` objects. The yoga WASM binary (`src/yoga.wasm`) is extracted from `yoga-layout`'s base64-embedded bundle so its Emscripten glue code matches exactly.

On any error the route issues a 302 to the static `/og-image.png` fallback on Cloudflare Pages, so social cards never break.

### Resume Storage
The resume PDF lives in a Cloudflare R2 bucket (`portfolio-assets`). `GET /api/resume` streams it publicly; `PUT /api/resume` is JWT-protected and accepts a multipart form upload. Updating the resume requires no redeployment.
