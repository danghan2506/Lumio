# Design System: Lumio — AI Language Learning

> **Positioning:** AI language learning that feels like turning on a light.
> **Tagline:** *Light up a new language.*
> **Core Metaphor:** **Light + Conversation.** Understanding ignites speech. Every word learned is a small spark that connects you with another person and culture.

---

## 1. Visual Theme & Atmosphere

- **Atmosphere:** Warm, curious, encouraging, and intelligent. A deep-canvas mobile-first UI where understanding feels like an ignition of light.
- **Density:** *Daily App Balanced (5/10)* — Spacious mobile containers, generous tap targets, calm white-space breathing room.
- **Variance:** *Offset Asymmetric (6/10)* — Dynamic split hero states, staggered lesson card cascades, off-center spark accents.
- **Motion:** *Fluid & Choreographed (7/10)* — Soft 200–300ms spring physics, ember ignition blooms for rewards, subtle pulsing spark indicators for AI interactions.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Usage Ratio | Constraint |
|---|---|---|---|---|
| **Deep Indigo** | `#241B4A` | Primary Canvas & Dark Surfaces | 40% | Base canvas for headers, dark surfaces, and text on light mode |
| **Lumio Coral** | `#FF6B57` | Primary Brand Accent | 20% | CTAs, active states, flame spark, primary brand moments |
| **Daylight Amber** | `#FFB74D` | Reward & Celebration | 15% | XP badges, streak counters, progress bar fills, celebration fills |
| **Mint** | `#35D0A0` | Success & Validation | 10% | Correct answer flashes, completed lesson indicators, checkmarks |
| **Lavender Mist** | `#EAE6FF` | Soft Light Surface | 8% | Card backgrounds on dark mode, soft tinted surface overlays |
| **Cream** | `#FFFBF4` | Light Canvas & Contrast Text | 5% | Light mode canvas, text color on Deep Indigo surfaces |
| **Slate** | `#5E5A80` | Muted Secondary & Borders | 2% | Secondary text, captions, subtext, subtle 1px dividers |

### Palette Constraints
- **Primary CTA Accent:** Lumio Coral (`#FF6B57`) is the singular primary CTA color. Saturation strictly kept under 80%; no purple/neon outer glows.
- **Strict Color Ownership:** Daylight Amber (`#FFB74D`) is strictly reserved for rewards (XP/Streaks). Mint (`#35D0A0`) is strictly reserved for correctness/completion.
- **Gradient Rules:** Base surface gradient `#241B4A → #4B3FA8`. Ember gradient `#FFB74D → #FF6B57` is strictly reserved for the spark icon, app badge, and major milestone celebrations.
- **No Pure Black:** `#000000` is strictly forbidden. Use Deep Indigo (`#241B4A`) for deep dark canvas or Slate (`#5E5A80`) for dark text.

---

## 3. Typography Rules

### Font Architecture
- **Display / Headlines:** `Fredoka` (or `Baloo 2`) — Rounded, friendly, warm display voice. Used for major screen titles, reward numbers, lesson titles, mascot speech, and wordmark. Weights: 500–700. Track-tight (+2% letter-spacing).
- **UI / Body:** `Plus Jakarta Sans` (or `Outfit`) — Clean, humanist, high-legibility sans-serif for lessons, options, and descriptions. Weights: 400–700.
- **Tabular Numerals / Mono:** `JetBrains Mono` or `Plus Jakarta Sans` with `tnum` feature — Used for XP counts, streak timers, and score counters to eliminate digit jumping during animations.

### Type Scale (Mobile First)
- **Display Large:** `32px` / Bold (700), Line Height `38px`
- **Title:** `24px` / Bold (700), Line Height `30px`
- **Body Large:** `18px` / Medium (500), Line Height `26px`
- **Body Regular:** `16px` / Regular (400), Line Height `24px`
- **Caption:** `13px` / Medium (500), Line Height `18px`
- **Micro Label:** `11px` / SemiBold (600), UPPERCASE, +4% Letter Spacing

### Typography Constraints
- `Inter` is BANNED to enforce brand distinctiveness.
- Generic serif fonts (`Times New Roman`, `Georgia`, `Garamond`) are BANNED.
- Headline hierarchy is established through font weight and warm color contrast, never by oversized screaming font sizes.

---

## 4. Component Stylings

### Buttons
- **Shape:** Fully rounded pill (`rounded-full`).
- **Primary Button:** Lumio Coral (`#FF6B57`) fill with Cream (`#FFFBF4`) text.
- **Secondary / Ghost Button:** Transparent background on Deep Indigo (`#241B4A`) with 1.5px Slate border or soft Lavender Mist overlay.
- **Interaction:** Tactile `-1px` vertical translation on active pressed state (`active:translate-y-0.5`). No outer neon glow effects.

### Cards & Containers
- **Shape:** Rounded squircle cards (`24px` / `rounded-3xl` for main cards, `12px` / `rounded-xl` for small chips and tags).
- **Background:** Lavender Mist (`#EAE6FF`) on light contexts, Deep Indigo (`#241B4A`) with subtle 1px Slate border on dark contexts.
- **Shadows:** Whispered background-tinted soft ambient shadow (`shadow-sm`, opacity 0.08). Never harsh black drop-shadows.

### Inputs & Lesson Options
- **Structure:** Label positioned above the input field in Slate (`#5E5A80`), error text directly below in Lumio Coral (`#FF6B57`).
- **Focus Ring:** 2px soft ring in Lumio Coral (`#FF6B57`).
- **Choice Cards:** Selectable lesson options expand by 1px with a soft Mint (`#35D0A0`) or Coral border on selection.

### Loaders & Micro-Indicators
- **Loaders:** Skeletal shimmer loaders matching exact card dimensions with a soft Daylight Amber pulse. No generic circular spinners.
- **AI Tutor Speech:** Speech bubbles on Deep Indigo featuring a soft pulsing ember spark icon (`#FF6B57`) indicating active processing.

### Empty & Celebration States
- **Empty States:** Composed warm spark illustrations with encouraging copy ("Light up a new language").
- **Lesson Completion:** Soft spark ignition animation with an ember gradient bloom.

---

## 5. Layout Principles

- **Mobile First Structure:** Standard container padding `24px` horizontal, `16px` vertical section spacing.
- **Spatial Separation:** No overlapping elements or absolute-positioned stacking. Every element occupies its own explicit zone.
- **Touch Target Floor:** All interactive elements must maintain a minimum tap target of `48px`.
- **Asymmetric Flow:** Centered layouts avoided for feature feeds; split left-aligned hero heads and asymmetric progression paths enforced.
- **Grid Strategy:** Single-column layout on mobile screens (`< 768px`); multi-column zig-zag layout on tablet/desktop viewports.

---

## 6. Motion & Interaction Philosophy

- **Spring Engine Physics:** Default spring transition `stiffness: 120, damping: 18` for snappy, responsive mobile touch.
- **Ember Ignition:** Lesson completion triggers a 200–300ms spark bloom (`#FFB74D → #FF6B57`).
- **Perpetual Micro-Loops:** Idle pulse state on the active AI tutor spark indicator and subtle progress bar shimmer.
- **Hardware Acceleration:** Animations restricted exclusively to `transform` and `opacity`.

---

## 7. Anti-Patterns (Banned AI Tells)

- **NO** Green owl, bird mascots, or guilt-inducing streak threat copy.
- **NO** Generic blue/purple AI robot clichés or glowing floating brains.
- **NO** `Inter` font or generic serif fonts.
- **NO** Pure black (`#000000`).
- **NO** Neon glows, outer purple button halos, or oversaturated accents (> 80% saturation).
- **NO** Emojis in main UI headings or labels.
- **NO** 3D bevels, sharp 0px card corners, or heavy black drop shadows.
- **NO** Centered hero layouts when variance > 4.
- **NO** AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen").
- **NO** Filler UI copy ("Scroll to explore", "Swipe down", bouncing arrows).
