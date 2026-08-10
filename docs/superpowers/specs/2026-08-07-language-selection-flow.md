# Language Selection Flow — Post-Auth Redirect

**Date:** 2026-08-07
**Status:** Approved

## Goal

After login/register, redirect new users to the language selection screen before entering the main app. Users who have already selected a language skip straight to main.

## Flow

```
Login/Register success
  → Supabase session active
  → Root layout checks `hasSelectedLanguage` (Zustand + AsyncStorage)
    → false: navigate to /(auth)/select-language
    → true: navigate to / (main)

Select-language screen:
  → Continue: save selectedLanguage + hasSelectedLanguage=true → navigate /
  → Skip: save default (en) + hasSelectedLanguage=true → navigate /
```

## Storage

Zustand store with AsyncStorage persistence (same pattern as `useOnboardingStore`):

```typescript
interface LanguageState {
  selectedLanguage: LanguageId | null;
  hasSelectedLanguage: boolean;
  setSelectedLanguage: (id: LanguageId) => void;
}
```

Future: sync to Supabase user profile when DB schema is created.

## Changes

| File | Change |
|------|--------|
| `store/useLanguageStore.ts` | Create — Zustand + AsyncStorage persisted store |
| `app/_layout.tsx` | Modify auth redirect: session + !hasSelectedLanguage → select-language |
| `app/(auth)/select-language.tsx` | Modify handleContinue: save to store, navigate to `/` |
| `app/(auth)/login.tsx` | Remove `router.replace('/')` from onSuccess — let root layout handle redirect |
| `app/(auth)/register.tsx` | Same as login |
