# Design Specification: Vocabulary Vault List UI/UX Optimization

- **Date:** 2026-10-07
- **Status:** Approved
- **Target Files:**
  - `components/vocabulary/VocabularyListItem.tsx` (Refactor: Compact row ~54px)
  - `components/vocabulary/WordDetailBottomSheet.tsx` (New: Bottom sheet modal for details)
  - `components/vocabulary/VocabularyHeroCard.tsx` (Refactor: Slim horizontal banner ~85px)
  - `app/(tabs)/vocabulary.tsx` (Update: State for bottom sheet integration)
  - `__tests__/components/vocabulary/VocabularyListItem.test.tsx` (Update tests)
  - `__tests__/components/vocabulary/WordDetailBottomSheet.test.tsx` (New tests)
  - `__tests__/components/vocabulary/VocabularyHeroCard.test.tsx` (Verify tests)
  - `__tests__/screens/VocabularyScreen.test.tsx` (Update screen interaction tests)

---

## 1. Context & Objectives

### Problem
In `app/(tabs)/vocabulary.tsx`, the screen currently requires excessive vertical scrolling for learners:
1. `VocabularyHeroCard` occupies over 200px of vertical height at the top with large vertical cards.
2. Each `VocabularyListItem` is an expanded card (~160px height) rendering the word, phonetic pronunciation, status badge, English definition, and a multiline example sentence with its English translation inline.
3. As a result, only 1.5 to 2 items are visible above the fold on mobile screens, requiring 15–20 swipes to review 30–40 words.

### Solution
Perform a focused UI/UX layout optimization following the **Progressive Disclosure** principle:
1. **Compact Vocabulary Row:** Condense `VocabularyListItem` to ~54px height, displaying only `word`, `pronunciation`, a subtle `status` badge, and a disclosure indicator (`chevron-forward`).
2. **Word Detail Bottom Sheet:** Introduce `WordDetailBottomSheet` to house the existing detailed fields (`translation`, `exampleSentence`, `exampleTranslation`, SRS intervals, and practice action) displayed only when a user intentionally taps an item.
3. **Slim Hero Card:** Refactor `VocabularyHeroCard` into an ~85px horizontal banner to conserve over 100px of header space.

### Strict Constraints
- **Zero new external libraries:** No audio/TTS packages (e.g. `expo-speech` is out of scope).
- **Zero database/schema changes:** Exploit strictly the existing fields in `VocabularyWithProgress` (`types/vocabulary.ts`).
- **All content in English:** Preserves the English-first curriculum of the Lumio database.

---

## 2. Component Design & Layout Specs

### 2.1 Compact List Row (`components/vocabulary/VocabularyListItem.tsx`)

#### Layout & Dimensions
- **Container:** `bg-white rounded-2xl px-4 py-3 border border-lavender-mist mb-2.5 shadow-sm flex-row items-center justify-between active:bg-lavender-mist/20` (~54px height).
- **Left Column (Content):**
  - Horizontal line (`flex-row items-baseline flex-1 mr-2`):
    - `item.word`: Font `Fredoka_700Bold`, size 16px, color `colors.deepIndigo`.
    - `item.pronunciation`: (if present) Font `PlusJakartaSans_500Medium`, size 12px, color `colors.slate`, margin left 8px.
- **Right Column (Status & Affordance):**
  - Mini Status Badge:
    - `mastered`: `px-2 py-0.5 rounded-full bg-mint/15 border border-mint/30`, text `text-mint text-[11px] font-sans-bold` ("Mastered").
    - `learning`: `px-2 py-0.5 rounded-full bg-daylight-amber/15 border border-daylight-amber/30`, text `text-daylight-amber text-[11px] font-sans-bold` ("Learning").
    - `unseen`: `px-2 py-0.5 rounded-full bg-slate/10 border border-slate/20`, text `text-slate text-[11px] font-sans-medium` ("Unseen").
  - Disclosure indicator: `Ionicons name="chevron-forward" size={14} color={colors.slate}` with slight opacity (`opacity-60`).

#### Props Interface
```typescript
export interface VocabularyListItemProps {
  item: VocabularyWithProgress;
  onPress?: () => void;
}
```

---

### 2.2 Word Detail Bottom Sheet (`components/vocabulary/WordDetailBottomSheet.tsx`)

A React Native `Modal` with a semi-transparent backdrop and an animated slide-up container.

#### Modal Structure
- **Backdrop:** Semi-transparent overlay (`rgba(0, 0, 0, 0.45)`). Tapping backdrop calls `onClose`.
- **Sheet Container:** `bg-white rounded-t-3xl px-6 pt-3 pb-8 w-full max-h-[80%]`.
- **Drag Handle Affordance:** Centered bar `w-12 h-1.5 rounded-full bg-slate/20 mx-auto mb-4`.
- **Content Sections:**
  1. **Header Row:**
     - Left:
       - Word: Font `Fredoka_700Bold`, size 24px, color `colors.deepIndigo`.
       - Pronunciation: Font `PlusJakartaSans_500Medium`, size 14px, color `colors.slate`.
     - Right: Close button (`Ionicons name="close" size={24} color={colors.slate}`).
  2. **Definition & Status Row:**
     - English Translation: Font `PlusJakartaSans_700Bold`, size 16px, color `colors.canvasDarkEnd`.
     - Status Badge: Mastered / Learning / Unseen badge pill.
  3. **Context / Example Sentence Card (if `exampleSentence` exists):**
     - Container: `bg-cream rounded-2xl p-4 border border-lavender-mist/70 my-4`.
     - Example Sentence: Font `PlusJakartaSans_600SemiBold`, size 14px, color `colors.deepIndigo`.
     - Example Translation: Font `PlusJakartaSans_400Regular`, size 13px, color `colors.slate`, italicized, mt-1.5.
  4. **SRS Progress Details (if user has reviewed this card):**
     - Mini info pills:
       - Next Review Interval: `intervalDays` days.
       - Correct Reviews: `correctCount`.
  5. **Action Button:**
     - "Practice This Word" button (`bg-lumio-coral py-3.5 rounded-2xl items-center shadow-md active:opacity-90`):
       - Triggers `onPractice(item.id)` which navigates to `/vocabulary/review` with `wordId`.

#### Props Interface
```typescript
export interface WordDetailBottomSheetProps {
  visible: boolean;
  item: VocabularyWithProgress | null;
  onClose: () => void;
  onPractice: (wordId: string) => void;
}
```

---

### 2.3 Slim Hero Card (`components/vocabulary/VocabularyHeroCard.tsx`)

#### Layout & Dimensions
- Change from a multi-block 220px card to an ~85px horizontal card.
- **Container:** `bg-canvas-dark-end rounded-2xl p-4 mb-4 shadow-md border border-white/10 flex-row items-center justify-between`.
- **Left Content:**
  - Title: Font `Fredoka_700Bold`, size 16px, color `colors.cream` ("Vocabulary Vault" or "All Caught Up! ✨").
  - Stats Summary Pill Row (`flex-row items-center mt-1`):
    - Due: Text `PlusJakartaSans_700Bold`, color `colors.daylightAmber` ("⚡ {dueCount} Due").
    - Separator: Bullet dot `•` in `colors.lavenderMist`.
    - Mastered: Text `PlusJakartaSans_700Bold`, color `colors.mint` ("{masteredCount} Mastered").
    - Separator: Bullet dot `•` in `colors.lavenderMist`.
    - Retention: Text `PlusJakartaSans_600SemiBold`, color `colors.lavenderMist` ("{retentionRate}%").
- **Right Content:**
  - When `dueCount > 0`: Compact CTA button `bg-lumio-coral px-4 py-2.5 rounded-xl flex-row items-center active:opacity-90` ("Review ▶").
  - When `dueCount === 0`: Compact CTA button `bg-white/20 px-3.5 py-2.5 rounded-xl flex-row items-center active:bg-white/30 border border-white/20` ("Practice All").

---

### 2.4 Tab Screen Integration (`app/(tabs)/vocabulary.tsx`)

- Add `selectedWord: VocabularyWithProgress | null` state.
- In `VocabularyListItem.onPress`: Set `setSelectedWord(item)`.
- Mount `WordDetailBottomSheet`:
  - `visible={Boolean(selectedWord)}`
  - `item={selectedWord}`
  - `onClose={() => setSelectedWord(null)}`
  - `onPractice={(wordId) => { setSelectedWord(null); router.push({ pathname: '/vocabulary/review', params: { wordId } }); }}`

---

## 3. Testing Strategy

1. **`VocabularyListItem.test.tsx`:**
   - Verify it renders `word`, `pronunciation`, and status badge.
   - Verify it does NOT render `exampleSentence` in the list item.
   - Verify `onPress` callback fires when row is pressed.

2. **`WordDetailBottomSheet.test.tsx` (New):**
   - Verify nothing renders when `visible=false` or `item=null`.
   - Verify it renders `word`, `pronunciation`, `translation`, `exampleSentence`, and `exampleTranslation` when visible.
   - Verify close button and backdrop click invoke `onClose`.
   - Verify "Practice This Word" button triggers `onPractice` with the correct `wordId`.

3. **`VocabularyHeroCard.test.tsx`:**
   - Verify stats (`dueCount`, `masteredCount`, `retentionRate`) render in the slim horizontal layout.
   - Verify action buttons trigger appropriate callbacks.

4. **`VocabularyScreen.test.tsx`:**
   - Update tests where clicking an item opened review directly: clicking item now sets the selected word, and clicking practice inside the bottom sheet triggers navigation.
   - Verify search and filter chips still function properly with compact list rows.

---

## 4. Verification & Sanity Check

- Run `npm test` to verify all unit & component tests pass.
- Run `npm run typecheck` to ensure 0 TypeScript errors.
- Run `npm run lint` to ensure strict lint compliance.
