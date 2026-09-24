# Design System: Lumio — AI Language Learning

> **Positioning:** AI language learning that feels like turning on a light.  
> **Tagline:** *Light up a new language.*  
> **Core Metaphor:** **Light + Conversation.** Understanding ignites speech. Every word learned is a small spark that connects you with another person and culture on a warm, inviting canvas.

---

## 1. Visual Theme & Atmosphere

- **Atmosphere:** Warm, curious, encouraging, and intelligent. A warm-light canvas mobile-first UI where understanding feels like an ignition of light on organic, textured paper.
- **Density:** *Daily App Balanced (5/10)* — Spacious mobile containers, generous tap targets, calm white-space breathing room.
- **Variance:** *Offset Asymmetric (6/10)* — Dynamic split hero states, staggered lesson card cascades, off-center spark accents.
- **Motion:** *Fluid & Choreographed (7/10)* — Soft 200–300ms spring physics, ember ignition blooms for rewards, subtle pulsing spark indicators for AI interactions.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Usage Ratio | Constraint |
|---|---|---|---|---|
| **Cream** | `#FFFBF4` | Primary Canvas & Light Base | 45% | Unified base canvas for all app screens; warm book-paper feel, zero glare |
| **Deep Indigo** | `#241B4A` | Primary Typography, Headings & Anchors | 25% | High-contrast text (>12:1 WCAG AAA), brand headers, dark accent elements |
| **Lumio Coral** | `#FF6B57` | Primary Brand Accent & CTA | 12% | CTAs, active states, flame spark, primary brand moments |
| **Daylight Amber** | `#FFB74D` | Reward & Celebration | 10% | XP badges, streak counters, progress bar fills, celebration fills |
| **Mint** | `#35D0A0` | Success & Validation | 5% | Correct answer flashes, completed lesson indicators, checkmarks |
| **Lavender Mist** | `#EAE6FF` | Tinted Surface & Pill Chips | 2% | Accent card backgrounds, elevated interactive tags, soft pill overlays |
| **Slate** | `#5E5A80` | Muted Secondary & Subtext | 1% | Secondary text, captions, micro borders, inactive tab icons |

### Palette Constraints
- **Primary CTA Accent:** Lumio Coral (`#FF6B57`) is the singular primary CTA color. Saturation strictly kept under 80%; no purple/neon outer glows.
- **Strict Color Ownership:** Daylight Amber (`#FFB74D`) is strictly reserved for rewards (XP/Streaks). Mint (`#35D0A0`) is strictly reserved for correctness/completion.
- **Surface Elevation Hierarchy:** Cream (`#FFFBF4`) canvas → Warm Ivory (`#FAF7F0`) or Translucent Wash (`rgba(255, 255, 255, 0.75)`) cards → Lavender Mist (`#EAE6FF`) chips/accents.
- **No Pure Black & No Clinical Pure White:** 
  - Pure black (`#000000`) is strictly forbidden. Use Deep Indigo (`#241B4A`) for text and anchors.
  - Large flat clinical pure white (`#FFFFFF`) surfaces are strictly forbidden. Avoid blinding clinical white; use warm ivory (`#FAF7F0`), translucent white washes (`bg-white/75`), or Lavender Mist (`#EAE6FF`) to preserve organic warmth.
- **Gradient Rules:** Ember gradient `#FFB74D → #FF6B57` is strictly reserved for the spark icon, app badge, and major milestone celebrations.

---

## 3. Typography Rules

### Font Architecture
- **Display / Headlines:** `Fredoka` (or `Baloo 2`) — Rounded, friendly, warm display voice. Used for major screen titles, reward numbers, lesson titles, mascot speech, and wordmark. Weights: 500–700. Track-tight (+2% letter-spacing). Color: `colors.deepIndigo` (`#241B4A`).
- **UI / Body:** `Plus Jakarta Sans` (or `Outfit`) — Clean, humanist, high-legibility sans-serif for lessons, options, and descriptions. Weights: 400–700. Color: `colors.deepIndigo` (`#241B4A`) for body, `colors.slate` (`#5E5A80`) for captions.
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
- **Secondary / Ghost Button:** Soft Lavender Mist (`#EAE6FF`) or warm ivory tint with Deep Indigo (`#241B4A`) text and 1px subtle Slate border; or transparent ghost button with Slate/Deep Indigo text.
- **Interaction:** Tactile `-1px` vertical translation on active pressed state (`active:translate-y-0.5`). No outer neon glow effects.

### Cards & Containers
- **Shape:** Rounded squircle cards (`24px` / `rounded-3xl` for main cards, `12px` / `rounded-xl` for small chips and tags).
- **Surface & Background (Non-Clinical Depth):** 
  - Never use raw, flat `#FFFFFF` on large cards.
  - **Standard Card Surface:** Warm Layered Ivory (`#FAF7F0`) or Translucent Frosted Wash (`rgba(255, 255, 255, 0.75)` / `bg-white/75 backdrop-blur-sm`).
  - **Accent & Highlight Cards:** Lavender Mist (`#EAE6FF`) or Daylight Amber tint (`rgba(255, 183, 77, 0.12)`).
- **Borders & Dividers:** Whispered borders using Deep Indigo or Slate at low opacity (`rgba(36, 27, 74, 0.06)` or `rgba(94, 90, 128, 0.12)`).
- **Shadows:** Whispered background-tinted soft ambient shadow (`shadow-sm`, opacity 0.04–0.06). Never harsh black drop-shadows.

### Inputs & Lesson Options
- **Structure:** Label positioned above the input field in Slate (`#5E5A80`), error text directly below in Lumio Coral (`#FF6B57`).
- **Surface:** Soft warm ivory (`#FAF7F0`) or translucent wash with subtle 1px border.
- **Focus Ring:** 2px soft ring in Lumio Coral (`#FF6B57`).
- **Choice Cards (Exercise / Quiz):** Rounded squircle cards with warm ivory background. Selection expands with a soft Mint (`#35D0A0`) or Coral (`#FF6B57`) border and subtle tinted fill (`rgba(53, 208, 160, 0.08)`).

### Navigation & TabBar
- **Bottom Navigation (`TabBar`):** Translucent Cream / Frosted Warm White (`rgba(255, 251, 244, 0.95)` with `backdrop-blur`) with a delicate top hairline border (`rgba(36, 27, 74, 0.06)`). Active tab highlighted in Lumio Coral (`#FF6B57`), inactive in Slate (`#5E5A80`).

### Loaders & Micro-Indicators
- **Loaders:** Skeletal shimmer loaders matching exact card dimensions with a soft Daylight Amber pulse. No generic circular spinners.
- **AI Tutor Speech:** Speech bubbles in warm ivory or Lavender Mist featuring a soft pulsing ember spark icon (`#FF6B57`) indicating active processing.

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
- **NO** Harsh clinical pure white (`#FFFFFF`) for large card surfaces that creates sterile, eye-straining contrast against the warm cream canvas.
- **NO** Neon glows, outer purple button halos, or oversaturated accents (> 80% saturation).
- **NO** Emojis in main UI headings or labels.
- **NO** 3D bevels, sharp 0px card corners, or heavy black drop shadows.
- **NO** Centered hero layouts when variance > 4.
- **NO** AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen").
- **NO** Filler UI copy ("Scroll to explore", "Swipe down", bouncing arrows).
