# Cross-Device Progress Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hydrate Zustand stores from Supabase on login so users can continue learning on any device without repeating onboarding/language selection.

**Architecture:** On `SIGNED_IN` auth event, if local stores are empty, fetch `user_languages` from Supabase. If an active language exists, hydrate both `useLanguageStore` and `useOnboardingStore` and navigate to main app. Also fix `select-language.tsx` to persist the choice to Supabase via `setActiveLanguage()` RPC.

**Tech Stack:** Expo Router, Supabase JS client, Zustand

## Global Constraints

- TypeScript strict mode, no `any`
- Follow existing patterns in the codebase
- Handle errors explicitly on all Supabase calls
- Never expose raw error objects to the user
- Run `npm run lint` and `npm run typecheck` after each task and fix all errors

---

### Task 1: Fix `select-language.tsx` to persist language choice to Supabase

**Files:**
- Modify: `app/(auth)/select-language.tsx:1-191`

**Interfaces:**
- Consumes: `setActiveLanguage(languageId: LanguageId): Promise<void>` from `lib/api.ts` (already exists at line 28)
- Produces: When user selects a language, it is saved to both Zustand (local) AND `user_languages` table (remote)

- [ ] **Step 1: Add `setActiveLanguage` import**

Add the import at the top of `app/(auth)/select-language.tsx`:

```typescript
import { setActiveLanguage } from '@/lib/api';
```

- [ ] **Step 2: Update `handleContinue` to call the RPC**

Replace the current `handleContinue`:

```typescript
const handleContinue = () => {
  setSelectedLanguage(selectedLang);
  router.replace('/');
};
```

With:

```typescript
const handleContinue = async () => {
  setSelectedLanguage(selectedLang);
  try {
    await setActiveLanguage(selectedLang);
  } catch (err) {
    console.warn('Failed to sync language to server:', err);
  }
  router.replace('/');
};
```

- [ ] **Step 3: Update `handleSkip` to call the RPC**

Replace the current `handleSkip`:

```typescript
const handleSkip = () => {
  setSelectedLanguage('en');
  router.replace('/');
};
```

With:

```typescript
const handleSkip = async () => {
  setSelectedLanguage('en');
  try {
    await setActiveLanguage('en');
  } catch (err) {
    console.warn('Failed to sync language to server:', err);
  }
  router.replace('/');
};
```

- [ ] **Step 4: Run lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/\(auth\)/select-language.tsx
git commit -m "fix: persist language selection to Supabase via setActiveLanguage RPC"
```

---

### Task 2: Add hydration logic and sign-out cleanup to `_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx:1-103`

**Interfaces:**
- Consumes: `getActiveLanguage(): Promise<UserLanguage | null>` from `lib/api.ts` (already exists at line 115)
- Consumes: `useLanguageStore` from `store/useLanguageStore.ts`
- Consumes: `useOnboardingStore` from `store/useOnboardingStore.ts`
- Produces: On `SIGNED_IN`, if user has an active language in DB → stores are hydrated and user navigates to `/(tabs)`. On sign-out → stores are reset.

- [ ] **Step 1: Add imports**

Add these imports to `app/_layout.tsx`:

```typescript
import { useRef, useState } from "react";  // replace the existing useEffect-only import
import { getActiveLanguage } from "@/lib/api";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import type { LanguageId } from "@/types/learning";
```

Keep the existing `useEffect` import (just add `useRef` and `useState` alongside it).

- [ ] **Step 2: Add `isReady` state and hydration ref**

Inside the `RootLayout` component, after the `useFonts` call, add:

```typescript
const [isReady, setIsReady] = useState(false);
const isHydratingRef = useRef(false);
```

- [ ] **Step 3: Rewrite the auth state listener useEffect**

Replace the entire auth state listener `useEffect` (lines 48-74) with:

```typescript
// Auth state listener: redirect based on session, hydrate from Supabase
useEffect(() => {
  if (!loaded && !error) return;

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event: string, session: Session | null) => {
      const inAuthGroup = segments[0] === "(auth)";

      if (session) {
        const hasSelectedLanguage = useLanguageStore.getState().hasSelectedLanguage;

        if (!hasSelectedLanguage) {
          // Local store is empty — try to hydrate from Supabase
          if (isHydratingRef.current) return;
          isHydratingRef.current = true;

          getActiveLanguage()
            .then((activeLanguage) => {
              if (activeLanguage?.language_id) {
                // User has a language in DB — hydrate stores and go to app
                useLanguageStore.setState({
                  selectedLanguage: activeLanguage.language_id as LanguageId,
                  hasSelectedLanguage: true,
                });
                useOnboardingStore.setState({
                  hasSeenOnboarding: true,
                });
                router.replace("/(tabs)" as Href);
              } else {
                // No language in DB — first-time setup
                if (segments[1] !== "select-language") {
                  router.replace("/(auth)/select-language");
                }
              }
            })
            .catch(() => {
              // DB fetch failed — fall through to language selection
              if (segments[1] !== "select-language") {
                router.replace("/(auth)/select-language");
              }
            })
            .finally(() => {
              isHydratingRef.current = false;
              setIsReady(true);
            });
          return;
        }

        // Local store has language — go to app if still on auth screens
        if (inAuthGroup) {
          router.replace("/(tabs)" as Href);
        }
        setIsReady(true);
      } else {
        // Signed out — reset stores and go to login
        useLanguageStore.setState({
          selectedLanguage: null,
          hasSelectedLanguage: false,
        });
        useOnboardingStore.setState({
          hasSeenOnboarding: false,
        });
        if (!inAuthGroup) {
          router.replace("/(auth)/login");
        }
        setIsReady(true);
      }
    }
  );

  return () => subscription.unsubscribe();
}, [loaded, error, segments, router]);
```

- [ ] **Step 4: Update splash screen hiding logic**

Replace the existing splash screen `useEffect` (lines 41-45):

```typescript
useEffect(() => {
  if (loaded || error) {
    SplashScreen.hideAsync();
  }
}, [loaded, error]);
```

With:

```typescript
useEffect(() => {
  if ((loaded || error) && isReady) {
    SplashScreen.hideAsync();
  }
}, [loaded, error, isReady]);
```

- [ ] **Step 5: Run lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: hydrate stores from Supabase on login for cross-device sync"
```

---

### Task 3: Manual verification

- [ ] **Step 1: Verify existing tests still pass**

Run: `npm test -- --passWithNoTests`
Expected: All existing tests pass

- [ ] **Step 2: Run full lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: No errors

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: fix lint/type issues from cross-device sync feature"
```
