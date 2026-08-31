# Cross-Device Progress Sync

**Date:** 2026-08-27
**Status:** Approved

## Problem

When a user logs in on a new device, the app redirects to language selection and onboarding screens because:

1. `hasSeenOnboarding` lives only in AsyncStorage (`useOnboardingStore`)
2. `selectedLanguage` / `hasSelectedLanguage` live only in AsyncStorage (`useLanguageStore`)
3. The auth listener in `_layout.tsx` checks `useLanguageStore.getState().hasSelectedLanguage` — which is device-local

Additionally, the `select-language.tsx` screen only updates Zustand — it never calls `setActiveLanguage()` RPC to persist the choice to Supabase. This means even the existing `user_languages` table may be empty for some users.

## Solution

Hydrate Zustand stores from Supabase `user_languages` on auth sign-in. No new tables or migrations needed.

## Changes

### 1. Fix `select-language.tsx` — persist to Supabase

**File:** `app/(auth)/select-language.tsx`

Currently `handleContinue` and `handleSkip` only call `setSelectedLanguage()` on the Zustand store. They must also call `setActiveLanguage()` from `lib/api.ts` to persist the choice to the `user_languages` table.

```
handleContinue:
  1. setSelectedLanguage(selectedLang)     // Zustand (local)
  2. setActiveLanguage(selectedLang)        // Supabase RPC (remote)
  3. router.replace('/')

handleSkip:
  1. setSelectedLanguage('en')
  2. setActiveLanguage('en')
  3. router.replace('/')
```

Error handling: If the RPC fails, still navigate (the local store is set). Log the error. The hydration flow on next login will handle recovery.

### 2. Add hydration logic to `_layout.tsx`

**File:** `app/_layout.tsx`

Modify the `onAuthStateChange` handler. When a session is detected and `hasSelectedLanguage` is `false`:

```
onAuthStateChange(event, session):
  if session exists:
    localHasLanguage = useLanguageStore.getState().hasSelectedLanguage

    if NOT localHasLanguage:
      try:
        activeLanguage = await getActiveLanguage()   // from lib/api.ts
        if activeLanguage exists:
          // Hydrate both stores from DB
          useLanguageStore.setState({
            selectedLanguage: activeLanguage.language_id,
            hasSelectedLanguage: true,
          })
          useOnboardingStore.setState({
            hasSeenOnboarding: true,
          })
          // Navigate to main app
          router.replace('/(tabs)')
          return
      catch:
        // DB fetch failed — fall through to language selection

      // No language in DB → first-time user on this account
      if not on select-language screen:
        router.replace('/(auth)/select-language')

    else if inAuthGroup:
      router.replace('/(tabs)')

  else if no session and not in auth group:
    router.replace('/(auth)/login')
```

Key decisions:
- **Async in auth listener:** The `onAuthStateChange` callback becomes async. Supabase auth listeners support this — the callback is fire-and-forget.
- **No flash:** Keep splash screen visible until hydration completes. Add an `isHydrating` ref to prevent premature splash hide.
- **Onboarding inference:** If a user has an active language in `user_languages`, they have completed onboarding. No need for a separate onboarding flag in the DB.
- **Race condition prevention:** Use a ref (`isHydratingRef`) to prevent multiple simultaneous hydration attempts.

### 3. Splash screen timing

**File:** `app/_layout.tsx`

Currently `SplashScreen.hideAsync()` is called as soon as fonts load. Change to:
- Keep splash visible until both fonts are loaded AND hydration is complete
- Use a state variable `isReady` that becomes `true` only when both conditions are met

### 4. Sign-out cleanup

**File:** `app/_layout.tsx` (already in auth listener)

When `session` is `null` (sign out), the existing flow redirects to login. The Zustand stores persist in AsyncStorage. This is fine — on the same device, if the same user logs back in, their local cache is still valid. If a different user logs in, the hydration flow will overwrite the stores with the new user's data from Supabase.

However, to be safe, reset both stores on sign-out:

```
if no session:
  useLanguageStore.setState({
    selectedLanguage: null,
    hasSelectedLanguage: false,
  })
  useOnboardingStore.setState({
    hasSeenOnboarding: false,
  })
  router.replace('/(auth)/login')
```

This ensures a clean state if a different user logs in on the same device.

## Files Modified

| File | Change |
|---|---|
| `app/_layout.tsx` | Add hydration logic in auth listener, manage splash screen timing, reset stores on sign-out |
| `app/(auth)/select-language.tsx` | Call `setActiveLanguage()` RPC alongside Zustand update |

## Files NOT Modified

| File | Reason |
|---|---|
| `lib/api.ts` | `getActiveLanguage()` already exists (line 115) |
| `store/useLanguageStore.ts` | No API changes; hydrated via `setState()` from outside |
| `store/useOnboardingStore.ts` | No API changes; hydrated via `setState()` from outside |
| Supabase migrations | `user_languages` table and `set_active_language` RPC already exist |

## No Migration Required

The `user_languages` table with `is_active` flag and the `set_active_language` RPC are already in the init migration (`20260808000000_init_lumio_schema.sql`). No schema changes needed.

## Testing

1. **New user, first device:** Sign up → should see onboarding → select language → language saved to both Zustand AND Supabase → enters app
2. **Same user, second device:** Sign in → app fetches `user_languages` → finds active language → hydrates stores → skips onboarding and language selection → enters app directly
3. **Sign out + different user on same device:** Sign out → stores reset → new user signs in → hydration runs for new user's data
4. **Network error during hydration:** Hydration fails gracefully → falls through to language selection screen (same as new user flow)
5. **Existing user who selected language before this fix** (no `user_languages` row): Hydration finds no active language → redirected to language selection → this time it persists to DB → future logins work correctly
