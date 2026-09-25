# Warm Cream Light Theme Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the mobile application to a cohesive Warm Cream light canvas (`#FFFBF4`), eliminating jarring theme switching and restyling the bottom navigation (`TabBar`), learning screens (`LearnScreen`, `ActivityCard`), and exercise quiz modals (`MultipleChoiceQuizModal`, `TranslationQuizModal`) with Warm Ivory (`#FAF7F0`) card surfaces and Deep Indigo (`#241B4A`) typography per `DESIGN.md`.

**Architecture:** Update `TabBar` to a frosted translucent cream background with refined Coral active pill indicator; redesign `ActivityCard` and `LearnScreen` using `#FAF7F0` warm ivory card surfaces, subtle hairline borders (`rgba(36, 27, 74, 0.06)`), and Deep Indigo headings; synchronize `MultipleChoiceQuizModal` and `TranslationQuizModal` (plus completion and exit dialogs) to the warm cream background and warm ivory choice cards, strictly avoiding clinical pure `#FFFFFF`.

**Tech Stack:** React Native (0.81.5), Expo (SDK 54), Expo Router, NativeWind / Tailwind CSS, `@expo/vector-icons`, Jest, `@testing-library/react-native`.

## Global Constraints

- **Strict Canvas Consistency:** All primary tabs and quiz screens use `colors.cream` (`#FFFBF4`) as the root container background.
- **Zero Pure White on Large Cards:** Large flat `#FFFFFF` cards are strictly banned per `DESIGN.md`. All card surfaces use Warm Ivory (`#FAF7F0`) or translucent wash (`rgba(255, 255, 255, 0.75)` / `bg-white/75`).
- **Typography Standards:** Primary headings and body text use `colors.deepIndigo` (`#241B4A`) with `Fredoka` and `Plus Jakarta Sans`. Subtext uses `colors.slate` (`#5E5A80`).
- **Strict TDD Workflow:** For each task: Write failing test -> Verify RED -> Implement minimal code -> Verify GREEN -> Commit.
- **No Unapproved Libraries:** Rely strictly on existing dependencies.

---

### Task 1: Redesign `TabBar` for Light Cream Canvas with TDD

**Files:**
- Modify: `components/navigation/TabBar.tsx`
- Test: `__tests__/components/navigation/TabBar.test.tsx`

**Interfaces:**
- Consumes: `BottomTabBarProps` from `@react-navigation/bottom-tabs`, `colors` from `@/theme/colors`
- Produces: `TabBar` rendering a frosted translucent cream container (`rgba(255, 251, 244, 0.95)` / `colors.cream`) with subtle top hairline border (`rgba(36, 27, 74, 0.06)`), Coral active indicator pill (`rgba(255, 107, 87, 0.12)` background, `rgba(255, 107, 87, 0.3)` border), inactive items in `colors.slate`, active text in `colors.deepIndigo`, active icon in `colors.lumioCoral`.

- [ ] **Step 1: Write the failing test for light theme TabBar styling**

In `__tests__/components/navigation/TabBar.test.tsx`, add a test verifying that the TabBar container applies the light theme background color and border:

```tsx
it('applies light cream background and subtle border on container', () => {
  const { getByTestId } = render(<TabBar {...mockProps} />);
  const container = getByTestId('tab-bar-container');
  expect(container.props.style).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        backgroundColor: 'rgba(255, 251, 244, 0.95)',
        borderTopColor: 'rgba(36, 27, 74, 0.06)',
      }),
    ])
  );
});
```

- [ ] **Step 2: Run test to verify it fails (RED)**

Run: `npm test -- __tests__/components/navigation/TabBar.test.tsx`  
Expected: FAIL because container currently has `backgroundColor: colors.deepIndigo` (`#241B4A`) and lacks `testID="tab-bar-container"`.

- [ ] **Step 3: Implement minimal TabBar styling**

In `components/navigation/TabBar.tsx`:
1. Add `testID="tab-bar-container"` to outer View.
2. Update outer View style:
   ```tsx
   style={[
     {
       backgroundColor: 'rgba(255, 251, 244, 0.95)',
       paddingBottom: Math.max(insets.bottom, 12),
       paddingTop: 8,
       paddingHorizontal: 12,
       borderTopWidth: 1,
       borderTopColor: 'rgba(36, 27, 74, 0.06)',
       shadowColor: '#241B4A',
       shadowOffset: { width: 0, height: -4 },
       shadowOpacity: 0.04,
       shadowRadius: 12,
       elevation: 4,
     },
   ]}
   ```
3. Update active pill style:
   ```tsx
   backgroundColor: 'rgba(255, 107, 87, 0.12)',
   borderWidth: 1,
   borderColor: 'rgba(255, 107, 87, 0.3)',
   ```
4. Update label text color:
   ```tsx
   color: isFocused ? colors.deepIndigo : colors.slate,
   ```

- [ ] **Step 4: Run test to verify it passes (GREEN)**

Run: `npm test -- __tests__/components/navigation/TabBar.test.tsx`  
Expected: PASS with 2 tests passing.

- [ ] **Step 5: Commit changes**

```bash
git add components/navigation/TabBar.tsx __tests__/components/navigation/TabBar.test.tsx
git commit -m "feat(ui): redesign TabBar with warm cream frosted light theme"
```

---

### Task 2: Redesign `ActivityCard` and `LearnScreen` for Warm Ivory / Light Cream with TDD

**Files:**
- Modify: `components/ui/ActivityCard.tsx`
- Modify: `app/(tabs)/learn.tsx`
- Test: `__tests__/components/ui/ActivityCard.test.tsx`
- Test: `__tests__/screens/learn.test.tsx`

**Interfaces:**
- Consumes: `ActivityCardProps` from `components/ui/ActivityCard.tsx`, `useLessonsData`, `usePracticeData`
- Produces: `ActivityCard` with `#FAF7F0` warm ivory card background, `border-[rgba(36,27,74,0.06)]`, `colors.deepIndigo` title, `colors.slate` subtext/order label; `LearnScreen` with `backgroundColor: colors.cream`, light-themed segment toggle, and light-themed filter chips.

- [ ] **Step 1: Write the failing tests for ActivityCard and LearnScreen**

1. In `__tests__/components/ui/ActivityCard.test.tsx`, add a test verifying the card surface uses Warm Ivory `#FAF7F0` (not pure white) and Deep Indigo title:

```tsx
it('uses warm ivory background and deep indigo title on light canvas', () => {
  const { getByTestId, getByText } = render(
    <ActivityCard {...defaultProps} status="not_started" />
  );
  const card = getByTestId('activity-card');
  expect(card.props.style).toEqual(
    expect.objectContaining({
      backgroundColor: '#FAF7F0',
    })
  );
  const title = getByText('Basic Greetings');
  expect(title.props.style).toEqual(
    expect.objectContaining({
      color: '#241B4A',
    })
  );
});
```

2. In `__tests__/screens/learn.test.tsx`, verify `LearnScreen` root uses `colors.cream`:

```tsx
it('renders with warm cream background on root SafeAreaView', () => {
  const { getByTestId } = render(<LearnScreen />);
  const safeArea = getByTestId('learn-screen-safe-area');
  expect(safeArea.props.style).toEqual(
    expect.objectContaining({
      backgroundColor: '#FFFBF4',
    })
  );
});
```

- [ ] **Step 2: Run tests to verify failure (RED)**

Run: `npm test -- __tests__/components/ui/ActivityCard.test.tsx __tests__/screens/learn.test.tsx`  
Expected: FAIL due to `bg-slate-900/60` and `backgroundColor: colors.deepIndigo`.

- [ ] **Step 3: Implement minimal code for ActivityCard and LearnScreen**

1. In `components/ui/ActivityCard.tsx`:
   - Change label color for `not_started`:
     ```tsx
     const labelColor = isCompleted
       ? colors.mint
       : isInProgress
       ? colors.lumioCoral
       : colors.slate;
     ```
   - Change card container style:
     ```tsx
     const containerStyle = {
       backgroundColor: '#FAF7F0',
       ...(isInProgress
         ? { borderColor: colors.lumioCoral, borderWidth: 1.5 }
         : isCompleted
         ? { borderColor: 'rgba(53, 208, 160, 0.4)', borderWidth: 1 }
         : { borderColor: 'rgba(36, 27, 74, 0.08)', borderWidth: 1 }),
     };
     ```
   - Update `className`: replace `bg-slate-900/60` with `shadow-sm` and apply `containerStyle`.
   - Update title color: `color: colors.deepIndigo`.
   - Update subtext and metadata colors: `color: colors.slate`.
   - Update trailing icon: circle background `rgba(36, 27, 74, 0.05)`, icon color `colors.deepIndigo` (or `colors.lumioCoral` when in-progress).

2. In `app/(tabs)/learn.tsx`:
   - Add `testID="learn-screen-safe-area"` to `SafeAreaView`.
   - Update `SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}`.
   - Update `RefreshControl`: `tintColor={colors.deepIndigo}`.
   - Update filter pills: inactive background `rgba(36, 27, 74, 0.05)`, border `rgba(36, 27, 74, 0.1)`, text `colors.slate`.
   - Update empty state card: `bg-[#FAF7F0] border border-[rgba(36,27,74,0.08)]`, title in `colors.deepIndigo`, subtitle in `colors.slate`.

- [ ] **Step 4: Run tests to verify pass (GREEN)**

Run: `npm test -- __tests__/components/ui/ActivityCard.test.tsx __tests__/screens/learn.test.tsx`  
Expected: PASS for all test cases.

- [ ] **Step 5: Commit changes**

```bash
git add components/ui/ActivityCard.tsx app/(tabs)/learn.tsx __tests__/components/ui/ActivityCard.test.tsx __tests__/screens/learn.test.tsx
git commit -m "feat(ui): update LearnScreen and ActivityCard with warm ivory surfaces and cream canvas"
```

---

### Task 3: Redesign Quiz Modals (`MultipleChoiceQuizModal` & `TranslationQuizModal`) for Light Canvas with TDD

**Files:**
- Modify: `components/practice/MultipleChoiceQuizModal.tsx`
- Modify: `components/practice/TranslationQuizModal.tsx`
- Modify: `components/practice/QuizCompletionModal.tsx`
- Modify: `components/practice/QuizExitConfirmDialog.tsx`
- Test: `__tests__/components/practice/MultipleChoiceQuizModal.test.tsx`
- Test: `__tests__/components/practice/TranslationQuizModal.test.tsx`

**Interfaces:**
- Consumes: `MultipleChoiceQuizModalProps`, `TranslationQuizModalProps`, `QuizResultSummary`
- Produces: Modals rendered on `backgroundColor: colors.cream` (`#FFFBF4`), dark StatusBar (`dark-content`), `#FAF7F0` Warm Ivory choice cards with Deep Indigo text (never pure `#FFFFFF`), light-themed completion sheet and exit dialog.

- [ ] **Step 1: Write the failing tests for Quiz Modals light theme**

1. In `__tests__/components/practice/MultipleChoiceQuizModal.test.tsx`:
   Add test verifying that the modal root has `backgroundColor: '#FFFBF4'` and option cards have `#FAF7F0` surface:

```tsx
it('renders with warm cream canvas and warm ivory option cards', () => {
  const { getByTestId, getByText } = render(
    <MultipleChoiceQuizModal
      visible={true}
      lessonTitle="Greetings"
      questions={mockQuestions}
      onClose={jest.fn()}
    />
  );
  const root = getByTestId('quiz-modal-container');
  expect(root.props.style).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ backgroundColor: '#FFFBF4' }),
    ])
  );
  const optionCard = getByTestId('quiz-option-0');
  expect(optionCard.props.style).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ backgroundColor: '#FAF7F0' }),
    ])
  );
});
```

2. In `__tests__/components/practice/TranslationQuizModal.test.tsx`:
   Add test verifying root container has `backgroundColor: '#FFFBF4'` and word bank tiles have `#FAF7F0` surface.

- [ ] **Step 2: Run tests to verify failure (RED)**

Run: `npm test -- __tests__/components/practice/MultipleChoiceQuizModal.test.tsx __tests__/components/practice/TranslationQuizModal.test.tsx`  
Expected: FAIL because roots have `backgroundColor: colors.deepIndigo` (`#241B4A`).

- [ ] **Step 3: Implement minimal code for Quiz Modals and dialogs**

1. In `components/practice/MultipleChoiceQuizModal.tsx`:
   - Change StatusBar to `barStyle="dark-content" backgroundColor={colors.cream}`.
   - Add `testID="quiz-modal-container"` to root View with `backgroundColor: colors.cream`.
   - Update header: border `rgba(36, 27, 74, 0.08)`, close button background `rgba(36, 27, 74, 0.06)`, close icon `colors.deepIndigo`, header title `colors.slate`.
   - Update question prompt card: `backgroundColor: '#FAF7F0'`, border `rgba(36, 27, 74, 0.06)`, question text `colors.deepIndigo`.
   - Update option cards:
     - Normal: `backgroundColor: '#FAF7F0'`, `borderColor: 'rgba(36, 27, 74, 0.08)'`, option text `colors.deepIndigo`, label badge background `rgba(36, 27, 74, 0.06)` with `colors.deepIndigo` text.
     - Selected: `borderColor: colors.lumioCoral`, `backgroundColor: 'rgba(255, 107, 87, 0.08)'`.
     - Correct: `borderColor: colors.mint`, `backgroundColor: 'rgba(53, 208, 160, 0.12)'`.
     - Incorrect: `borderColor: colors.lumioCoral`, `backgroundColor: 'rgba(255, 107, 87, 0.15)'`.

2. In `components/practice/TranslationQuizModal.tsx`:
   - Change StatusBar to `barStyle="dark-content" backgroundColor={colors.cream}`.
   - Root container View: `backgroundColor: colors.cream`.
   - Target sentence card: `backgroundColor: '#FAF7F0'`, border `rgba(36, 27, 74, 0.06)`, text in `colors.deepIndigo`.
   - Target answer slot area: dashed border `rgba(36, 27, 74, 0.15)`, background `rgba(255, 251, 244, 0.6)`.
   - Word bank chips: `backgroundColor: '#FAF7F0'`, border `rgba(36, 27, 74, 0.1)`, text in `colors.deepIndigo`.

3. In `components/practice/QuizCompletionModal.tsx` & `QuizExitConfirmDialog.tsx`:
   - Update dialog background from `colors.deepIndigo` to `#FAF7F0` (warm ivory).
   - Update dialog title to `colors.deepIndigo` and dialog description to `colors.slate`.

- [ ] **Step 4: Run tests to verify pass (GREEN)**

Run: `npm test -- __tests__/components/practice/MultipleChoiceQuizModal.test.tsx __tests__/components/practice/TranslationQuizModal.test.tsx`  
Expected: PASS for all tests.

- [ ] **Step 5: Commit changes**

```bash
git add components/practice/MultipleChoiceQuizModal.tsx components/practice/TranslationQuizModal.tsx components/practice/QuizCompletionModal.tsx components/practice/QuizExitConfirmDialog.tsx __tests__/components/practice/MultipleChoiceQuizModal.test.tsx __tests__/components/practice/TranslationQuizModal.test.tsx
git commit -m "feat(ui): style practice quiz modals with warm cream canvas and warm ivory cards"
```

---

### Task 4: Full Test Suite Regression & Verification

**Files:**
- Run all test suites across the project

- [ ] **Step 1: Run complete Jest test suite**

Run: `npm test`  
Expected: All test suites pass with zero failures.

- [ ] **Step 2: Run TypeScript and Linter checks**

Run: `npm run typecheck && npm run lint`  
Expected: 0 type errors and 0 lint errors.

- [ ] **Step 3: Verification of DESIGN.md compliance**

Inspect modified files to verify:
1. Every container uses `colors.cream` (`#FFFBF4`).
2. No large cards use flat `#FFFFFF`. All cards use Warm Ivory (`#FAF7F0`) or translucent wash.
3. Typography uses `colors.deepIndigo` (`#241B4A`) for titles and `colors.slate` (`#5E5A80`) for subtext.
