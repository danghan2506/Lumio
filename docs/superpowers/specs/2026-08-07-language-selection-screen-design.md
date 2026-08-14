# Specification: Language Selection Screen (Onboarding Flow)

**Date:** 2026-08-07  
**Author:** Antigravity AI & Lumio Team  
**Status:** Proposed / Draft  

---

## 1. Overview & Purpose

The **Language Selection Screen** is a critical onboarding touchpoint where new users select their target learning language (English, Spanish, Korean, French). It establishes Lumio's brand identity ("Light up a new language") using tactile squircle cards, active learner badges, mascot encouragement, and spring micro-interactions.

---

## 2. User Experience & Features

1. **Header Zone:**
   - App title or step progress bar (`Step 1 of 3: Choose target language`).
   - Mascot header box with Lumi mascot icon and title: *"What language would you like to light up today?"*
   
2. **Interactive Language Grid / Cards:**
   - **Squircle Cards (`rounded-3xl` / `24px` radius)** displaying:
     - Country Flag (emoji or custom asset)
     - Primary Language Name (e.g. `English`, `Español`, `한국어`, `Français`)
     - Native Name subtext (e.g., `English`, `Spanish`, `Korean`, `French`)
     - Learner Badge / Tag (e.g., `1.2M Learners`, `Popular`, `New`)
     - Selection indicator (lumio Coral border `#FF6B57` and Mint `#35D0A0` checkmark pill when active)
   - Minimum tap target of 64px vertical height for easy touch interaction.

3. **Bottom Action CTA Bar:**
   - Sticky / Fixed bottom bar with `Lumio Coral` primary button (*"Continue"*).
   - Disabled state until a language option is selected.
   - Smooth press translation (`translateY: 2px` on press).

---

## 3. Data & State Architecture

### Component State & Store
- **Selection State:** Local state `selectedLanguage: LanguageId | null` defaulting to `'en'` or `null`.
- **Global Store Persistence:** Updating `selectedLanguage` in `useOnboardingStore` or `useUserStore`.
- **Supabase Integration:** On authenticated onboarding completion, updates `profiles.target_language` via Supabase RLS policy.

### Type Definition (`types/learning.ts`)
```ts
export type LanguageId = 'en' | 'ko' | 'fr' | 'es';

export interface Language {
  id: LanguageId;
  name: string;
  nativeName: string;
  flag: string;
  learnerLanguage: 'vi';
  badge?: string;
  learnerCount?: string;
}
```

---

## 4. UI Design Tokens Alignment (`DESIGN.md`)

- **Canvas:** Deep Indigo (`#241B4A`)
- **Card Unselected:** `#31265E` surface with 1px border (`rgba(234, 230, 255, 0.1)`)
- **Card Selected:** Soft Lavender Mist (`#EAE6FF`) or Deep Indigo with Lumio Coral (`#FF6B57`) 2px border and Mint (`#35D0A0`) checkmark indicator.
- **CTA Button:** Lumio Coral (`#FF6B57`) full-width pill button.
- **Typography:** Display title with `Fredoka_700Bold`, descriptions with `PlusJakartaSans_500Medium`, badges with `JetBrainsMono_500Medium`.

---

## 5. File Location Strategy

- **Screen component:** `app/(auth)/select-language.tsx` or `app/onboarding/language.tsx`.
- **Reusable Card component:** `components/ui/LanguageCard.tsx`.
- **Data source:** `data/languages.ts`.

---

## 6. Verification & Self-Review

- [x] Align with `DESIGN.md` colors, typography, and anti-patterns.
- [x] No raw error objects exposed to user.
- [x] RLS policy compliance for Supabase profile update.
- [x] Full mobile touch accessibility (min 48px/64px tap target).
