# Home — Decorative Polish Plan

> **Scope:** atmosphere / micro-motion / frame decoration only.  
> **Out of scope (for this doc):** new content sections (Academy cards, projects list, events), data wiring, layout redesign.  
> **Status:** planning — implement gradually.  
> **Primary file:** `frontend/src/pages/Home.tsx`  
> **Related:** `frontend/src/components/GlitchText.tsx`, `frontend/src/components/layout/AppBackground.tsx`, `frontend/src/index.css`, `frontend/src/components/ui/Primitives.tsx` (`ActionButton`)

---

## 1. Goals & constraints

### Goals
- Make Home feel **alive** without looking cheap or noisy.
- Stay on-brand: soft-brutal, paper grid, mono labels, primary accent, terminal aesthetic.
- Prefer **CSS + existing `motion/react`** over new libraries.

### Constraints
- Decorative only — do not change information hierarchy or copy unless needed for labels like `HERO_01`.
- Respect `prefers-reduced-motion` / `useReducedMotion()`: no continuous motion when reduced; fade-only OK.
- Mobile: keep motion subtle; avoid heavy parallax, mouse-follow, or dual full-speed marquees.
- Dark mode: glow is OK; light mode: prefer borders/shadows over glow.
- Do not stack more glitch on the H1 (already uses `GlitchText`).

### Avoid
- Full-screen particles, confetti, dense matrix rain
- Autoplay video background
- Strong parallax on mobile
- Custom cursor site-wide (hero-only optional, easy to feel gimmicky)

---

## 2. Current Home snapshot (baseline)

As of this doc, Home roughly is:

1. **Hero** — badge “System Live”, glitch title, subtitle, CTAs, static terminal panel (`dsuc_core.rs`)
2. **MarqueeStrip** — infinite text ticker (disabled animation on mobile / reduced motion)
3. **Stats strip** — Members / Projects / Events / Academy Units

**Note:** `recentEvents`, `recentProjects`, `recentMembers`, `featuredUnits` and some UI imports exist but are unused. Content sections are **not** part of this decorative plan (track separately if desired).

---

## 3. Design language for decorations

| Element | Direction |
|--------|-----------|
| Type | Mono labels, uppercase, wide tracking |
| Motion | Slow (0.5–20s), linear or ease-in-out, low amplitude |
| Color | Primary + ink; gold caution stripes only as **micro dividers**, not full sections |
| Depth | Soft vignette, 1–2 orbs, grain ≤5% opacity |
| Frame | Crop marks, double offset border, section index chips |
| Terminal | Scanline, cursor blink, faint watermark — not a second glitch title |

---

## 4. Idea catalog

Each item has an **ID** for tracking. Priority = suggested order when implementing a “minimal” path.

| ID | Name | Priority | Effort | Where | Notes |
|----|------|----------|--------|-------|-------|
| D01 | Marquee edge fade mask | P0 | Low | `MarqueeStrip` | CSS `mask-image` left/right |
| D02 | Marquee pause on hover | P0 | Low | `MarqueeStrip` | `animation-play-state` or motion `speed` |
| D03 | Marquee keep slow on mobile | P1 | Low | `MarqueeStrip` | Today mobile freezes; prefer slow scroll |
| D04 | Dual-row marquee | P2 | Med | `MarqueeStrip` | Row 2 reverse, lower opacity |
| D05 | Hero vignette | P0 | Low | Hero section | Radial gradient overlay |
| D06 | Hero soft orbs | P0 | Med | Hero | 1–2 blurred blobs, slow drift |
| D07 | Noise grain overlay | P1 | Low | Home root or hero | Fixed, 3–5% opacity |
| D08 | Terminal scanline | P1 | Low | Terminal panel | Thin line scroll 8–12s |
| D09 | Terminal cursor blink | P1 | Low | Terminal code body | CSS blink after last line |
| D10 | Terminal idle shadow breathe | P2 | Low | Terminal card | Shadow 8px ↔ 10px slow |
| D11 | Live badge pulse ring | P0 | Low | “System Live” badge | Expanding ring on green dot |
| D12 | Floating mono tags | P1 | Med | Around terminal (desktop) | `Solana` `Rust` `Builder` float ±6px |
| D13 | Crop marks | P1 | Low | Hero / section corners | `┌┐└┘` or CSS corners, ~15% opacity |
| D14 | Section index chips | P1 | Low | Hero / stats | `HERO_01`, `STATS_02`, slight rotate |
| D15 | Caution micro-divider | P0 | Low | Between hero→marquee or marquee→stats | 2–3px gold diagonal stripe band |
| D16 | Stats label underline draw | P1 | Med | Stats cells | Primary line width 0→100% on view |
| D17 | CTA primary shimmer | P1 | Low | Primary `ActionButton` on Home | Slow horizontal sheen |
| D18 | Status strip under nav | P2 | Med | `Navbar` or Home top | Optional; may affect global chrome |
| D19 | Hash watermark on terminal | P2 | Low | Terminal | `0xDSUC` / `// labs` corner |
| D20 | Grid cell random pulse | P3 | Med | `AppBackground` or Home | Very sparse; easy to overdo |
| D21 | Mouse spotlight (desktop) | P3 | Med | Hero | Radial follow, ≤6% opacity |
| D22 | Filament lines between stats | P2 | Med | Stats strip (dark) | Dashed primary, dashoffset animate |
| D23 | Skewed band between sections | P2 | Low | Section gap | 3–4° strip primary/5 |
| D24 | Button arrow nudge | P1 | Low | CTA secondary/primary | `→` translate-x on hover |

---

## 5. Recommended implementation packs

Pick a pack per PR / session. Do not ship everything at once.

### Pack A — Minimal polish (first)
- D01 Marquee mask  
- D02 Marquee pause  
- D05 Hero vignette  
- D06 Soft orbs (one is enough)  
- D11 Live badge pulse ring  
- D15 Caution micro-divider  

**Done when:** Home feels less flat; marquee/stats edges cleaner; badge “alive”.

### Pack B — Tech showcase
- Pack A +  
- D03 Slow marquee on mobile  
- D08 Scanline  
- D09 Cursor blink  
- D12 Floating tags (lg+ only)  
- D17 CTA shimmer  
- D24 Arrow nudge  

**Done when:** Terminal and CTAs feel product-like without new sections.

### Pack C — Editorial frame
- D13 Crop marks  
- D14 Section chips  
- D16 Stats underline draw  
- D19 Terminal watermark  
- D07 Grain  

**Done when:** Layout reads like a designed print/tech poster.

### Pack D — Atmosphere max (optional later)
- D04 Dual marquee  
- D10 Shadow breathe  
- D21 Spotlight  
- D22 Filament stats  
- D20 Grid pulse (careful)  

**Done when:** Depth is rich but still passes “not cheap” review at 100% zoom for 10s.

---

## 6. Specs per item (implementation notes)

### D01 — Marquee edge fade
```css
/* conceptual */
.mask-x-fade {
  mask-image: linear-gradient(
    to right,
    transparent,
    black 8%,
    black 92%,
    transparent
  );
}
```
Apply on marquee outer overflow container.

### D02 — Pause on hover
- CSS animation: `group-hover:[animation-play-state:paused]`
- Or Framer/Motion: set `animate` speed to 0 while hovered
- Also pause when `prefers-reduced-motion` (already no anim)

### D03 — Mobile marquee
- Remove `isMobile → noAnimation` freeze
- Use longer `duration` on small screens (e.g. 40s vs 25s)
- Keep reduced-motion = off

### D04 — Dual-row
- Two rows, second `animate x: ["-50%", "0%"]` (opposite)
- Row 2: `opacity-40`, smaller text optional
- Ensure parent height doesn’t explode on mobile

### D05 — Vignette
- Absolute inset-0 pointer-events-none on hero
- `radial-gradient(ellipse at center, transparent 40%, var(--bg-main) 100%)` with low strength
- Don’t crush title contrast — tune opacity ~30–50% of gradient stop

### D06 — Orbs
- 1–2 `div`s: `blur-3xl`, `rounded-full`, size ~200–320px
- Colors: `bg-primary/10` (light), `bg-primary/15` (dark)
- Motion: `y: [0, 12, 0]`, `x: [0, -8, 0]`, duration 14–20s, infinite
- Position behind content (`-z` / absolute), `pointer-events-none`
- Hide or simplify on mobile if GPU jank

### D07 — Grain
- SVG noise filter or CSS noise image, `opacity: 0.03–0.05`
- `pointer-events-none`, fixed or absolute on Home root
- Prefer one global grain, not per-section stack

### D08 — Scanline
- Pseudo-element or child: 1–2px height, full width, `bg-white/5`
- Animate `top: 0% → 100%` over 8–12s linear infinite
- Clip to terminal content area (`overflow-hidden`)

### D09 — Cursor blink
- After last code line (or on a dedicated line): `▍` or `▋`
- CSS `@keyframes blink { 50% { opacity: 0 } }` ~1s step

### D10 — Shadow breathe
- Motion on terminal shell: alternate shadow offset/spread slightly
- Duration ≥6s; amplitude small so it doesn’t look like hover state

### D11 — Live badge pulse
- On green dot: `::after` ring `scale 1→1.8`, `opacity 0.6→0`
- Repeat every ~2s
- `motion-safe` only

### D12 — Floating tags
- Absolute around terminal (desktop `lg+` only)
- Chips: mono, border, small padding, `bg-surface/80`
- Labels e.g. `Solana`, `Rust`, `Builder`, `Web3`
- Independent float phases (delay 0 / 0.4 / 0.8s)
- `pointer-events-none` unless they link somewhere later

### D13 — Crop marks
- Four corners of hero container or page content max-width
- 12–16px L-shaped borders, `border-text-main/20`
- Pure CSS absolute corners; no JS

### D14 — Section chips
- Mono `text-[10px]` uppercase tracking
- Content: `01 · HERO`, `02 · SIGNAL`, `03 · STATS`
- Slight `-rotate-1` or `-rotate-2`
- Place top-left of section, doesn’t steal focus from H1

### D15 — Caution micro-divider
- Reuse progress-bar language: gold diagonal stripes on thin band (~4–6px height)
- Full-bleed between sections
- Optional very slow `background-position` march (or static for calm)
- Class naming: keep separate from `.academy-progress-caution` if needed (e.g. `.home-caution-divider`)

### D16 — Stats underline
- Under each stat label: 2px primary line
- `whileInView` → scaleX 0→1, origin left, once
- Stagger 0.08s per cell

### D17 — CTA shimmer
- Overflow-hidden on primary button
- Sliding gradient pseudo-element every 2.5–3.5s
- Only Home primary CTA first; promote to `ActionButton` if it looks good globally

### D18 — Status strip
- Optional thin bar under navbar
- Gradient `primary → transparent` or animated dash
- **Caution:** global layout change — coordinate with `Navbar` / `PageShell`

### D19 — Watermark
- Absolute bottom-right inside terminal
- `0xDSUC` or `// labs · dsuc`
- `opacity-10–20`, mono, select-none

### D20 — Grid pulse
- Rare random cell highlight on background grid
- If implemented, prefer CSS only on Home, not global `AppBackground` first
- Cap frequency hard

### D21 — Spotlight
- Desktop only; track pointer in hero
- Radial gradient follows mouse, opacity ≤0.06
- Throttle mousemove; disable on touch

### D22 — Filament lines
- SVG or CSS dashed borders between stat cells
- Dark mode primary/20; light mode optional ink/10
- Animate `stroke-dashoffset` slowly

### D23 — Skewed band
- Full-width div between sections, `skew-y-1` or `-2`, height 12–24px
- `bg-primary/5` only — no content inside

### D24 — Arrow nudge
- CTA text `→` or Lucide `ArrowRight`
- `group-hover:translate-x-1 transition`

---

## 7. Reduced motion checklist

For every continuous animation:

| Condition | Behavior |
|-----------|----------|
| `prefers-reduced-motion: reduce` | No marquee scroll, no orb drift, no scanline, no stripe march, no shimmer loop |
| Hover / view reveals | Opacity-only OK |
| Pulse rings | Disable or single static state |
| Typewriter (if added later) | Show full final state immediately |

Prefer `useReducedMotion()` from `motion/react` where JS-driven; CSS `@media (prefers-reduced-motion: reduce)` for pure CSS.

---

## 8. File / ownership map

| Area | Likely touchpoints |
|------|--------------------|
| Marquee D01–D04 | `Home.tsx` → `MarqueeStrip` |
| Hero atmosphere D05–D07, D13–D14 | `Home.tsx` hero `<section>` |
| Terminal D08–D10, D12, D19 | `Home.tsx` terminal panel block |
| Badge D11 | Hero badge block in `Home.tsx` |
| Divider D15, D23 | Between sections in `Home.tsx` |
| Stats D16, D22 | Stats strip in `Home.tsx` |
| CTA D17, D24 | Home CTAs; optionally `Primitives.tsx` |
| Global chrome D18 | `Navbar.tsx` / `PageShell.tsx` — separate PR |
| Background D20 | Prefer Home-local first; `AppBackground.tsx` only if reusable |

**CSS home for reusable keyframes:** `frontend/src/index.css` (same pattern as `.academy-progress-caution`).

Suggested class prefix: `home-*` (e.g. `home-caution-divider`, `home-scanline`, `home-grain`) to avoid clashing with Academy.

---

## 9. Implementation checklist (copy into PR / issues)

### Pack A
- [x] D01 Marquee edge fade mask  
- [x] D02 Marquee pause on hover  
- [x] D05 Hero vignette  
- [x] D06 Soft orbs (1–2)  
- [x] D11 Live badge pulse ring  
- [x] D15 Caution micro-divider  
- [x] Reduced-motion verified  
- [ ] Light + dark visual pass  

### Pack B
- [x] D03 Slow marquee on mobile  
- [x] D08 Terminal scanline  
- [x] D09 Terminal cursor blink  
- [x] D12 Floating tags (lg+)  
- [x] D17 CTA shimmer  
- [x] D24 Arrow nudge  
- [x] Reduced-motion verified  

### Pack C
- [ ] D13 Crop marks  
- [ ] D14 Section chips  
- [ ] D16 Stats underline draw  
- [ ] D19 Terminal watermark  
- [ ] D07 Noise grain  
- [ ] Reduced-motion verified  

### Pack D (optional)
- [ ] D04 Dual-row marquee  
- [ ] D10 Shadow breathe  
- [ ] D21 Mouse spotlight  
- [ ] D22 Stats filament lines  
- [ ] D20 Grid pulse (if still desired)  
- [ ] Performance check (mobile mid-tier)  

---

## 10. Acceptance criteria (overall)

- [ ] Home still feels soft-brutal / paper, not “SaaS gradient marketing”
- [ ] No decoration steals focus from H1 + primary CTA
- [ ] Continuous animations are slow and quiet; none feel like errors or ads
- [ ] Dark and light both intentional
- [ ] `prefers-reduced-motion` does not leave broken empty gaps
- [ ] No new layout shift from absolute decorations (reserve space or pure overlay)
- [ ] Lighthouse / quick mobile scroll: no obvious jank from orbs + marquee + scanline together

---

## 11. Explicit non-goals (track elsewhere)

These came up in discussion but are **not** decorative polish:

- Typewriter / compile-run easter egg on terminal (interaction + content)
- Count-up stats numbers
- Featured Academy / Projects / Members / Events sections
- Cleaning unused imports / dead `featuredUnits` data (small chore PR OK anytime)

If implementing content sections later, reuse motion patterns from Pack C (`whileInView` stagger) for consistency.

---

## 12. Suggested order of work

```text
Week-ish 1 (or one evening):  Pack A
Next session:                 Pack B
When page feels empty:        Pack C
Only if still flat:           Pack D (pick 1–2 items, not all)
```

**Rule of thumb:** after each pack, stop and live with it for a day. Decorative polish compounds quickly into noise.

---

## 13. Revision log

| Date | Note |
|------|------|
| 2026-07-27 | Initial plan from Home decorative discussion (marquee, atmosphere, micro-motion, frames). Implementation not started. |
| 2026-07-27 | **Pack A + Pack B implemented** in `Home.tsx` + `index.css` (`home-*` classes). Pack C/D still open. |
