# Profile Tab Design System Harmonization & Language Card Layout Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harmonize the Profile screen with the Warm Light Canvas design system ([`DESIGN.md`](file:///d:/projects/lumio/DESIGN.md)) and eliminate the Flexbox text-wrap layout distortion causing the language switch button to bulge and deform.

**Architecture:** Update Profile root canvas to `#FFFBF4` (`colors.cream`), refactor Profile subcomponents ([`ProfileHeaderCard`](file:///d:/projects/lumio/components/profile/ProfileHeaderCard.tsx), [`ActiveLanguageCard`](file:///d:/projects/lumio/components/profile/ActiveLanguageCard.tsx), [`LearningStatsGrid`](file:///d:/projects/lumio/components/profile/LearningStatsGrid.tsx), [`ProfileSkeletonLoader`](file:///d:/projects/lumio/components/profile/ProfileSkeletonLoader.tsx)) to `#FAF7F0` (`colors.warmIvory`) card surfaces with `#241B4A` (`colors.deepIndigo`) high-contrast typography, and replace the variable-width switch button with an un-squeezable 44x44px circular button (`flexShrink: 0`) and single-line text truncation.

**Tech Stack:** React Native, Expo Router, NativeWind / Tailwind CSS, Jest, React Native Testing Library.

## Global Constraints

- Root screen background MUST be `colors.cream` (`#FFFBF4`) via inline style on `SafeAreaView` per [`AGENTS.md`](file:///d:/projects/lumio/AGENTS.md).
- Card backgrounds MUST be `colors.warmIvory` (`#FAF7F0`) or translucent white wash; pure white (`#FFFFFF`) large surfaces and pure black (`#000000`) are strictly banned per [`DESIGN.md`](file:///d:/projects/lumio/DESIGN.md).
- Primary text MUST be `colors.deepIndigo` (`#241B4A`); caption/secondary text MUST be `colors.slate` (`#5E5A80`).
- Interactive touch targets MUST maintain a minimum of 44x44px (touch target floor).
- No new major dependencies.
- Strict TypeScript throughout; no `any`.

---

### Task 1: Fix `ActiveLanguageCard` Layout & Button Geometry (Issue 2)

**Files:**
- Modify: [`components/profile/ActiveLanguageCard.tsx`](file:///d:/projects/lumio/components/profile/ActiveLanguageCard.tsx)
- Test: [`__tests__/components/profileComponents.test.tsx`](file:///d:/projects/lumio/__tests__/components/profileComponents.test.tsx)

**Interfaces:**
- Consumes: `activeLanguage` (`ActiveLanguageCardProps`), `onSwitchLanguage`
- Produces: Robust `ActiveLanguageCard` with non-deforming 44x44 circular button, single-line text truncation, and Warm Ivory styling

- [ ] **Step 1: Write/update unit tests for `ActiveLanguageCard`**
  In [`__tests__/components/profileComponents.test.tsx`](file:///d:/projects/lumio/__tests__/components/profileComponents.test.tsx), ensure the tests verify:
  1. `switch-language-button` exists and calls `onSwitchLanguage` when pressed.
  2. Language name ("Spanish"), native name ("Español"), and flag ("🇪🇸") are rendered.
  3. Empty state renders cleanly when `activeLanguage={null}`.

- [ ] **Step 2: Update `ActiveLanguageCard.tsx` implementation**
  In [`components/profile/ActiveLanguageCard.tsx`](file:///d:/projects/lumio/components/profile/ActiveLanguageCard.tsx):
  1. Change outer card container:
     - `backgroundColor: colors.warmIvory` (`#FAF7F0`)
     - `borderColor: 'rgba(36, 27, 74, 0.06)'`
     - `borderRadius: 24`
     - `padding: 20`
  2. Change Header Micro-label:
     - Label: `"ACTIVE LANGUAGE"`, color `colors.lumioCoral`
     - Dot: `backgroundColor: colors.mint`
  3. Change Left Content Column:
     - Flag badge: `width: 48, height: 48, borderRadius: 24`, `backgroundColor: 'rgba(234, 230, 255, 0.5)'`, `borderWidth: 1.5`, `borderColor: 'rgba(36, 27, 74, 0.08)'`
     - Language Name: `fontFamily: 'Fredoka_700Bold'`, `fontSize: 18`, `color: colors.deepIndigo`, `numberOfLines={1}`
     - Subtitle: `fontFamily: 'PlusJakartaSans_500Medium'`, `fontSize: 13`, `color: colors.slate`, `numberOfLines={1}`, `ellipsizeMode="tail"`
  4. Change Switch Button:
     - Standardize as 44x44px circular action button:
       ```tsx
       <Pressable
         testID="switch-language-button"
         onPress={onSwitchLanguage}
         accessibilityRole="button"
         accessibilityLabel="Switch active learning language"
         style={({ pressed }) => ({
           width: 44,
           height: 44,
           borderRadius: 22,
           backgroundColor: pressed ? 'rgba(36, 27, 74, 0.1)' : 'rgba(36, 27, 74, 0.05)',
           borderWidth: 1,
           borderColor: 'rgba(36, 27, 74, 0.08)',
           alignItems: 'center',
           justifyContent: 'center',
           flexShrink: 0,
         })}
       >
         <Ionicons name="swap-horizontal" size={20} color={colors.deepIndigo} />
       </Pressable>
       ```
  5. Update Empty State:
     - Nền: `colors.warmIvory`, viền `rgba(36, 27, 74, 0.06)`
     - Tiêu đề: `color: colors.deepIndigo`
     - Mô tả: `color: colors.slate`

- [ ] **Step 3: Run unit tests to verify**
  Run: `npx jest __tests__/components/profileComponents.test.tsx -t "ActiveLanguageCard"`
  Ensure all tests pass.

- [ ] **Step 4: Commit changes**
  Commit with message: `fix(profile): remediate ActiveLanguageCard layout distortion with circular switch button and warm ivory styling`

---

### Task 2: Refactor `ProfileHeaderCard` and `LearningStatsGrid` to Warm Light Canvas (Issue 1 Part A)

**Files:**
- Modify: [`components/profile/ProfileHeaderCard.tsx`](file:///d:/projects/lumio/components/profile/ProfileHeaderCard.tsx)
- Modify: [`components/profile/LearningStatsGrid.tsx`](file:///d:/projects/lumio/components/profile/LearningStatsGrid.tsx)
- Test: [`__tests__/components/profileComponents.test.tsx`](file:///d:/projects/lumio/__tests__/components/profileComponents.test.tsx)

- [ ] **Step 1: Update `ProfileHeaderCard.tsx`**
  1. Card surface:
     - `backgroundColor: colors.warmIvory`
     - `borderColor: 'rgba(36, 27, 74, 0.06)'`
  2. Avatar container:
     - Placeholder: `backgroundColor: 'rgba(255, 107, 87, 0.15)'`
     - Initial: `color: colors.lumioCoral`
     - Camera button: `backgroundColor: colors.lumioCoral`, `borderColor: colors.warmIvory`
  3. Typography:
     - Display name: `color: colors.deepIndigo`
     - Edit pencil button: `backgroundColor: 'rgba(36, 27, 74, 0.05)'`, `borderColor: 'rgba(36, 27, 74, 0.08)'`, icon `colors.slate`
     - Email: `color: colors.slate`
     - Joined date badge: `backgroundColor: 'rgba(36, 27, 74, 0.04)'`, text `color: colors.slate`
     - Copy ID chip: `backgroundColor: copied ? 'rgba(53, 208, 160, 0.12)' : 'rgba(36, 27, 74, 0.04)'`, text `color: copied ? colors.mintDark : colors.slate`, border `copied ? colors.mint : 'rgba(36, 27, 74, 0.08)'`
  4. Edit Name Modal:
     - Sheet: `backgroundColor: colors.warmIvory`, `borderColor: 'rgba(36, 27, 74, 0.1)'`
     - Title: `color: colors.deepIndigo`
     - Text input: `backgroundColor: '#FFFFFF'`, `color: colors.deepIndigo`, `borderColor: 'rgba(36, 27, 74, 0.15)'`

- [ ] **Step 2: Update `LearningStatsGrid.tsx`**
  1. StatCard:
     - `backgroundColor: colors.warmIvory`
     - `borderColor: 'rgba(36, 27, 74, 0.06)'`
  2. Numbers:
     - `color: colors.deepIndigo`
  3. Labels:
     - `color: colors.slate`
  4. Icon backgrounds: Keep soft tints (`rgba(..., 0.15)`).

- [ ] **Step 3: Run unit tests**
  Run: `npx jest __tests__/components/profileComponents.test.tsx`
  Ensure all tests pass.

- [ ] **Step 4: Commit changes**
  Commit with message: `feat(profile): harmonize ProfileHeaderCard and LearningStatsGrid with Warm Light Canvas`

---

### Task 3: Refactor `ProfileSkeletonLoader` and `app/(tabs)/profile.tsx` Screen Canvas (Issue 1 Part B & Fallback)

**Files:**
- Modify: [`components/profile/ProfileSkeletonLoader.tsx`](file:///d:/projects/lumio/components/profile/ProfileSkeletonLoader.tsx)
- Modify: [`app/(tabs)/profile.tsx`](file:///d:/projects/lumio/app/%28tabs%29/profile.tsx)
- Test: [`__tests__/screens/ProfileScreen.test.tsx`](file:///d:/projects/lumio/__tests__/screens/ProfileScreen.test.tsx)

- [ ] **Step 1: Update `ProfileSkeletonLoader.tsx`**
  1. Card background: change `#31265E` to `'rgba(36, 27, 74, 0.06)'`.
  2. Border: `'rgba(36, 27, 74, 0.04)'`.
  3. Inner placeholders: `'rgba(36, 27, 74, 0.08)'`.

- [ ] **Step 2: Update `app/(tabs)/profile.tsx`**
  1. `SafeAreaView`:
     ```tsx
     <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
     ```
  2. `RefreshControl`:
     - `colors={[colors.lumioCoral]}`
     - `tintColor={colors.deepIndigo}`
  3. Error state card:
     - Title: `color: colors.deepIndigo`
     - Subtext: `color: colors.slate`
  4. Language fallback integration:
     - In `profileOverview ?`:
       ```tsx
       <ActiveLanguageCard
         activeLanguage={
           profileOverview.activeLanguage
             ? {
                 id: profileOverview.activeLanguage.id,
                 name: profileOverview.activeLanguage.name,
                 nativeName: profileOverview.activeLanguage.nativeName,
                 flag: profileOverview.activeLanguage.flag,
                 startedAt: profileOverview.createdAt,
               }
             : {
                 id: currentLanguage.id,
                 name: currentLanguage.name,
                 nativeName: currentLanguage.nativeName,
                 flag: currentLanguage.flag,
                 startedAt: profileOverview.createdAt,
               }
         }
         onSwitchLanguage={handleSwitchLanguage}
       />
       ```

- [ ] **Step 3: Run Profile Screen tests**
  Run: `npx jest __tests__/screens/ProfileScreen.test.tsx`
  Ensure all tests pass.

- [ ] **Step 4: Commit changes**
  Commit with message: `feat(profile): set cream canvas on ProfileScreen and add active language store fallback`

---

### Task 4: Full Suite Verification & Lint Check

**Files:**
- All modified files

- [ ] **Step 1: Run complete profile test suite**
  Run: `npx jest __tests__/components/profileComponents.test.tsx __tests__/screens/ProfileScreen.test.tsx`
  Verify 100% passing tests.

- [ ] **Step 2: Run TypeScript typecheck**
  Run: `npm run typecheck` (or `npx tsc --noEmit`)
  Ensure 0 errors.

- [ ] **Step 3: Run linter**
  Run: `npm run lint`
  Ensure 0 errors.
