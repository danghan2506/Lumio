# NativeWind v5 Setup Design

## Goal

Set up NativeWind v5 in the existing Expo SDK 54 project using the NativeWind v5 Expo installation steps provided by the user. The setup must avoid outdated NativeWind v4, Tailwind v3, or Babel-based instructions.

## Context

- The project uses Expo SDK 54 with Expo Router via `main: "expo-router/entry"`.
- NativeWind and Tailwind packages are not currently installed.
- There is no existing `metro.config.js`, `postcss.config.mjs`, or `global.css`.
- `lightningcss` currently resolves transitively through Expo as `1.33.0`, so it must be pinned to `1.30.1` as required by the provided NativeWind v5 docs.
- The repo uses `npm` and has a `package-lock.json`, so installation should use `npm`.

## Approved Approach

Use the manual NativeWind v5 Expo setup for an existing project:

1. Install `nativewind`, `tailwindcss`, and `@tailwindcss/postcss` with `npm`.
2. Add `postcss.config.mjs` with the `@tailwindcss/postcss` plugin.
3. Add `global.css` using the v5-compatible imports:
   - `tailwindcss/theme.css` in the `theme` layer
   - `tailwindcss/preflight.css` in the `base` layer
   - `tailwindcss/utilities.css`
   - `nativewind/theme`
4. Add `metro.config.js` and wrap Expo's default Metro config with `withNativewind(config)`.
5. Import `../global.css` from `app/_layout.tsx`, the top-most app component in this Expo Router app.
6. Add an npm `overrides` entry for `lightningcss: "1.30.1"` in `package.json`.

## Alternatives Considered

- Scaffold a new app with `npx rn-new@next --nativewind`: rejected because this is an existing Expo project.
- Partial installation without configuration: rejected because NativeWind would not be usable.

## Supabase Impact

No Supabase schema, RLS, authentication, or data-layer changes are required. This is styling infrastructure only.

## Verification

- Run `npm install` to install packages and refresh `package-lock.json`.
- Run `npm run lint`.
- Run TypeScript verification if a `typecheck` script exists; otherwise use `npx tsc --noEmit`.
- Optionally start Expo with `npm run start` and confirm the app bundle loads.
