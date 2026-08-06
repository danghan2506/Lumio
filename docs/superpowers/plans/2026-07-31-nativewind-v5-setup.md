# NativeWind v5 Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure NativeWind v5 in the existing Expo SDK 54 app using the NativeWind v5 Expo installation steps provided by the user.

**Architecture:** This setup adds NativeWind as styling infrastructure at the project root. Metro is wrapped with `withNativewind`, Tailwind v5 CSS imports live in `global.css`, and Expo Router's root layout imports that CSS from the top-most app component.

**Tech Stack:** Expo SDK 54, Expo Router, React Native 0.81, NativeWind v5, Tailwind CSS v5-compatible package, PostCSS via `@tailwindcss/postcss`, npm.

## Global Constraints

- Follow the provided NativeWind v5 Expo docs exactly; do not use outdated NativeWind v4, Tailwind v3, or Babel setup steps.
- Use `npm` because the project has `package-lock.json`.
- Keep `main: "expo-router/entry"` unchanged in `package.json`.
- Import `global.css` from `app/_layout.tsx`, the top-most app component for this Expo Router app.
- Pin `lightningcss` to `1.30.1` via npm `overrides`.
- No Supabase schema, RLS, authentication, or data-layer changes are required.
- Do not commit changes unless the user explicitly requests a commit.

---

## File Structure

- Create: `postcss.config.mjs` - enables Tailwind's PostCSS plugin using `@tailwindcss/postcss`.
- Create: `global.css` - contains Tailwind v5-compatible CSS imports plus NativeWind theme import.
- Create: `metro.config.js` - wraps Expo's default Metro config with NativeWind's `withNativewind` helper.
- Modify: `package.json` - adds NativeWind/Tailwind dependencies and the `lightningcss` override through npm install/package update.
- Modify: `package-lock.json` - npm lockfile refresh from installing dependencies and applying override.
- Modify: `app/_layout.tsx` - imports `../global.css` before rendering the root stack.

---

### Task 1: Configure NativeWind v5

**Files:**
- Create: `postcss.config.mjs`
- Create: `global.css`
- Create: `metro.config.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: Expo Router root layout from `app/_layout.tsx`; Expo Metro config from `expo/metro-config`; NativeWind Metro helper from `nativewind/metro`.
- Produces: Project-wide NativeWind className support and Tailwind CSS utility processing for Expo native/web bundles.

- [ ] **Step 1: Install NativeWind v5 dependencies with npm**

Run:

```bash
npm install nativewind tailwindcss @tailwindcss/postcss
```

Expected:

```text
added ... packages, and audited ... packages
```

The exact package count can vary. `package.json` should include `nativewind`, `tailwindcss`, and `@tailwindcss/postcss`, and `package-lock.json` should be updated.

- [ ] **Step 2: Add the lightningcss npm override**

Edit `package.json` so the root object includes this exact override near the existing top-level metadata:

```json
{
  "overrides": {
    "lightningcss": "1.30.1"
  }
}
```

Keep all existing scripts, dependencies, devDependencies, and `private: true` intact.

- [ ] **Step 3: Refresh the lockfile after adding the override**

Run:

```bash
npm install
```

Expected:

```text
up to date, audited ... packages
```

Then run:

```bash
npm ls lightningcss
```

Expected output includes:

```text
lightningcss@1.30.1 overridden
```

- [ ] **Step 4: Create PostCSS config**

Create `postcss.config.mjs` with exactly:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 5: Create global CSS file**

Create `global.css` with exactly:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@import "nativewind/theme";
```

- [ ] **Step 6: Create Metro config**

Create `metro.config.js` with exactly:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
```

- [ ] **Step 7: Import CSS from the root layout**

Modify `app/_layout.tsx` to import the CSS before the component definition:

```tsx
import { Stack } from "expo-router";

import "../global.css";

export default function RootLayout() {
  return <Stack />;
}
```

- [ ] **Step 8: Run lint verification**

Run:

```bash
npm run lint
```

Expected:

```text
> learning-language@1.0.0 lint
> expo lint
```

The command should exit with code `0` and no lint errors.

- [ ] **Step 9: Run TypeScript verification**

Run:

```bash
npx tsc --noEmit
```

Expected: command exits with code `0` and no TypeScript errors.

- [ ] **Step 10: Confirm Expo can resolve the bundle**

Run:

```bash
npm run start -- --clear
```

Expected: Expo starts without Metro config errors. Stop the server after the startup check.

---

## Self-Review

- Spec coverage: all approved setup steps are represented in Task 1, including npm install, PostCSS config, `global.css`, Metro config, root CSS import, and `lightningcss` pinning.
- Placeholder scan: no TBD/TODO/ambiguous implementation instructions remain.
- Type consistency: no new TypeScript APIs are introduced; only `app/_layout.tsx` receives a side-effect CSS import.
