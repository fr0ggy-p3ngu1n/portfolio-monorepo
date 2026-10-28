# Matthew Sullivan brand

The **MS signal mark**: a waveform M that turns into a circuit-trace S, with a solder pad at each end, inside a pink-to-violet ring. The M is a signal (music, oscilloscopes), the S is a PCB trace (embedded roots), and the line runs start to finish like the path from hardware to full stack.

Use these files rather than redrawing the mark. Everything in `social/`, `banners/`, `profile-pictures/` and `extras/` is rendered from the HTML in `templates/`.

## Logo (`logo/`)

| File | Use |
| --- | --- |
| `ms-mark.svg` | **Master.** Full-colour mark, transparent background. Works on dark and on white. |
| `ms-mark-white.svg` | All white, for photos or the pink→violet gradient. |
| `ms-mark-ink.svg` | Single colour (ink), for print and the resume. |
| `ms-icon.svg` | The mark on the ink rounded tile (app-style icon). |
| `ms-icon-square.svg` | Same, full-bleed square, for places that apply their own rounding (iOS, Android). |
| `*-1024.png`, `ms-icon-512.png` | PNG renders of the above. |

The pads are hollow (no fill), so the mark sits on any background without a matching fill colour.

**Small sizes:** the mark holds up down to 16 px as an icon. Below about 24 px, use the tile (`ms-icon`) rather than the bare mark.

**Please don't:** recolour the gradient, rotate or stretch the mark, separate the letters from the ring, add outlines or bevels, or put the full-colour mark on a busy photo (use the white version there).

## Favicons (`favicons/`)

`favicon.svg`, `favicon.ico` (16/32/48), `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` and `site.webmanifest`. These drop straight into a site's root.

## Profile pictures (`profile-pictures/`)

1024×1024, full-bleed, sized so a circle crop never clips the ring: **dark** (default), **glow**, **gradient** (white mark on pink→violet), and **light**. Use the same one everywhere (GitHub, LinkedIn, Slack, Discord) so people recognise it.

## Banners (`banners/`)

| File | Size | Notes |
| --- | --- | --- |
| `linkedin-banner-1584x396.png` | 1584×396 (2× render) | Content sits right, because your profile photo covers the lower left. |
| `x-header-1500x500.png` | 1500×500 (2×) | X/Twitter header. Content right, clear of the avatar. |
| `github-readme-header-1280x320.png` | 1280×320 (2×) | Top of the GitHub profile README. |

## Link previews (`social/`)

`og-image-1200x630.png` is what matthewsullivan.dev serves (1200×630 and under 500 KB, per the link-preview rules). `og-image-2400x1260.png` is a 2× master. `og-image-photo-1200x630.png` is an alternative with your photo. When the served image changes, bump the `?v=` on its URL so LinkedIn refetches it.

## Extras (`extras/`)

- `wallpaper-mac-3456x2234.png`, `wallpaper-iphone-1290x2796.png`
- `resume-mark-ink.svg` / `resume-mark-ink-256.png`: single-colour mark for the resume header
- `gmail-signature.html`: open it, copy the boxed signature, paste into Gmail. Its logo (`ms-mark-email.png`) is hosted on matthewsullivan.dev.

## Colours

| Name | Hex | Use | Contrast |
| --- | --- | --- | --- |
| Ink | `#0E0B18` | Background, icon tile | — |
| Pink | `#EC4899` | Gradient start, accents | 5.5:1 on ink |
| Violet | `#A78BFA` | Gradient end, links on dark | 7.2:1 on ink |
| Mist | `#F7F5FB` | Text on dark, light background | 18:1 on ink |
| Lilac grey | `#C9C2DA` | Secondary text on dark | 11.3:1 on ink |
| Deep pink | `#BE185D` | Pink **text** on white (`#EC4899` is only 3.5:1 there) | 6.0:1 on white |
| Deep violet | `#7C3AED` | Violet **text/links** on white (`#A78BFA` is 2.7:1 there) | 5.7:1 on white |

Gradient: `linear-gradient(90deg, #EC4899, #A78BFA)` (diagonal, bottom-left to top-right, in the mark).

## Type

- **Inter** (700/800) for headings and the name, 400/500 for body text
- **JetBrains Mono** (500) for URLs, code and small labels

Both are free on Google Fonts; the templates load them from there.

## Re-rendering

Each template in `templates/` is a fixed-size HTML page. Open it in Chromium (Playwright) at the size in its filename's output, wait for fonts, and screenshot. Banners render at 2×, link previews at 1×.
