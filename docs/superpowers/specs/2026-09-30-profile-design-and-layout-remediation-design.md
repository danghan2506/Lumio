# Spec: Profile Tab Design System Harmonization & Language Card Layout Remediation

- **Document ID:** `SPEC-2026-09-30-PROFILE-REMEDIATION`
- **Target Date:** September 30, 2026
- **Status:** Approved
- **Reference Standards:** [AGENTS.md](file:///d:/projects/lumio/AGENTS.md), [DESIGN.md](file:///d:/projects/lumio/DESIGN.md)

---

## 1. Executive Summary & Goals

This specification resolves two distinct issues in the Profile tab:
1. **Design System Mismatch (Issue 1):** The Profile screen is currently rendered with legacy dark mode tokens (`colors.deepIndigo` canvas and dark card backgrounds), clashing with the unified **Warm Light Canvas** (`#FFFBF4` Cream base, `#FAF7F0` Warm Ivory cards, and `#241B4A` Deep Indigo typography) mandated in [DESIGN.md](file:///d:/projects/lumio/DESIGN.md).
2. **Flexbox Layout Distortion in Active Language Card (Issue 2):** In [`ActiveLanguageCard.tsx`](file:///d:/projects/lumio/components/profile/ActiveLanguageCard.tsx), the language switch button lacks `flexShrink: 0`, and the text lacks single-line truncation. When placed beside a language title and date label on standard mobile viewports (360px–390px), the text is squeezed, wrapping into multiple vertical lines. Because the container has `borderRadius: 9999`, this vertical stretching deforms the pill button into a bloated, bulging rounded square/box. Additionally, when `profileOverview.activeLanguage` is `null`, an oversized 220px fallback empty-state card is rendered unexpectedly.

### Success Criteria:
1. **Full Warm Light Canvas Compliance:** [`app/(tabs)/profile.tsx`](file:///d:/projects/lumio/app/%28tabs%29/profile.tsx) uses `backgroundColor: colors.cream` (`#FFFBF4`). All subcomponents ([`ProfileHeaderCard.tsx`](file:///d:/projects/lumio/components/profile/ProfileHeaderCard.tsx), [`ActiveLanguageCard.tsx`](file:///d:/projects/lumio/components/profile/ActiveLanguageCard.tsx), [`LearningStatsGrid.tsx`](file:///d:/projects/lumio/components/profile/LearningStatsGrid.tsx), [`ProfileSkeletonLoader.tsx`](file:///d:/projects/lumio/components/profile/ProfileSkeletonLoader.tsx)) use `colors.warmIvory` (`#FAF7F0`) card surfaces with whispered borders (`rgba(36, 27, 74, 0.06)`).
2. **WCAG AAA Text Contrast:** All headlines and numerical values render in `colors.deepIndigo` (`#241B4A`) with > 12:1 contrast ratio against the Cream and Warm Ivory surfaces. Captions and metadata render in `colors.slate` (`#5E5A80`).
3. **Bulletproof Switch Button Geometry:** The language switch button in `ActiveLanguageCard.tsx` is standardized as a high-affordance, circular action button (`w-11 h-11` / `44x44px`, `rounded-full`) with `flexShrink: 0`, matching the established design pattern in `UnitHeader.tsx` and `HeaderBar.tsx`.
4. **Text Truncation Guard:** Language name and subtitle in `ActiveLanguageCard.tsx` have `numberOfLines={1}` and `ellipsizeMode="tail"` to prevent layout collision on small screens.
5. **Seamless Language Store Fallback:** In `profile.tsx`, when `profileOverview.activeLanguage` is `null`, the UI seamlessly falls back to the user's active language from `useLanguageStore`, preventing the 220px empty state from dominating the screen.
6. **100% Test Passing:** All unit and screen tests in `__tests__/components/profileComponents.test.tsx` and `__tests__/screens/ProfileScreen.test.tsx` pass cleanly with no visual or functional regressions.

---

## 2. Detailed Technical Specifications

### 2.1 `app/(tabs)/profile.tsx`
- **Root Container:**
  - `<SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>`
- **RefreshControl:**
  - `colors={[colors.lumioCoral]}`
  - `tintColor={colors.deepIndigo}` (replaces `colors.cream` which is invisible on light canvas).
- **Error State Container:**
  - Background: `rgba(255, 107, 87, 0.1)`
  - Border: `1px solid rgba(255, 107, 87, 0.3)`
  - Title: `color: colors.deepIndigo`, `fontFamily: 'Fredoka_700Bold'`, `fontSize: 20`
  - Message: `color: colors.slate`, `fontFamily: 'PlusJakartaSans_500Medium'`, `fontSize: 14`
- **Active Language Fallback:**
  - Use `resolvedActiveLanguage`:
    ```ts
    const resolvedActiveLanguage = profileOverview?.activeLanguage ?? {
      id: currentLanguage.id,
      name: currentLanguage.name,
      nativeName: currentLanguage.nativeName,
      flag: currentLanguage.flag,
      startedAt: profileOverview?.createdAt ?? new Date().toISOString(),
    };
    ```

### 2.2 `components/profile/ProfileHeaderCard.tsx`
- **Card Container:**
  - Background: `colors.warmIvory` (`#FAF7F0`)
  - Border: `1px solid rgba(36, 27, 74, 0.06)`
  - Shadow: `shadow-sm`
- **Avatar Container:**
  - Border: `3px solid colors.daylightAmber`
  - Fallback avatar background: `rgba(255, 107, 87, 0.15)`
  - User initial: `color: colors.lumioCoral`, `fontFamily: 'Fredoka_700Bold'`
  - Camera button: `backgroundColor: colors.lumioCoral`, `borderColor: colors.warmIvory`
- **User Information:**
  - Display name: `color: colors.deepIndigo`, `fontFamily: 'Fredoka_700Bold'`
  - Edit name pencil button: `backgroundColor: 'rgba(36, 27, 74, 0.05)'`, `borderColor: 'rgba(36, 27, 74, 0.08)'`, icon color: `colors.slate`
  - Email: `color: colors.slate`, `fontFamily: 'PlusJakartaSans_500Medium'`
  - Joined date badge: `backgroundColor: 'rgba(36, 27, 74, 0.04)'`, `color: colors.slate`
  - ID chip: `backgroundColor: copied ? 'rgba(53, 208, 160, 0.12)' : 'rgba(36, 27, 74, 0.04)'`, `borderColor: copied ? colors.mint : 'rgba(36, 27, 74, 0.08)'`, text `color: copied ? colors.mintDark : colors.slate`
- **Edit Name Modal:**
  - Overlay: `backgroundColor: 'rgba(20, 15, 45, 0.65)'`
  - Sheet: `backgroundColor: colors.warmIvory`, `borderColor: 'rgba(36, 27, 74, 0.1)'`
  - Title: `color: colors.deepIndigo`
  - Input: `backgroundColor: '#FFFFFF'`, `borderColor: 'rgba(36, 27, 74, 0.15)'`, `color: colors.deepIndigo`

### 2.3 `components/profile/ActiveLanguageCard.tsx`
- **Card Container:**
  - Background: `colors.warmIvory` (`#FAF7F0`)
  - Border: `1px solid rgba(36, 27, 74, 0.06)`
  - Border radius: `24px` (`rounded-3xl`)
  - Padding: `20px`
- **Header Micro-label:**
  - Label: `"ACTIVE LANGUAGE"`, `fontFamily: 'PlusJakartaSans_600SemiBold'`, `fontSize: 11`, `color: colors.lumioCoral`
  - Active indicator dot: `8x8px`, `borderRadius: 4`, `backgroundColor: colors.mint`
- **Main Content Row:**
  - Container: `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'space-between'`, `gap: 12`
  - Left Section (`flex: 1`, `flexDirection: 'row'`, `alignItems: 'center'`, `gap: 14`):
    - Flag badge: `width: 48, height: 48, borderRadius: 24`, `backgroundColor: 'rgba(234, 230, 255, 0.5)'`, `borderWidth: 1.5`, `borderColor: 'rgba(36, 27, 74, 0.08)'`
    - Info column (`flex: 1`, `gap: 2`):
      - Language Name: `fontFamily: 'Fredoka_700Bold'`, `fontSize: 18`, `color: colors.deepIndigo`, `numberOfLines: 1`
      - Subtitle: `fontFamily: 'PlusJakartaSans_500Medium'`, `fontSize: 13`, `color: colors.slate`, `numberOfLines: 1`, `ellipsizeMode: 'tail'`
  - Right Section (Switch Button):
    - `Pressable` with `testID="switch-language-button"`
    - Dimensions: `width: 44, height: 44, borderRadius: 22` (`rounded-full`)
    - Layout: `flexShrink: 0`, `alignItems: 'center'`, `justifyContent: 'center'`
    - Styling: `backgroundColor: pressed ? 'rgba(36, 27, 74, 0.1)' : 'rgba(36, 27, 74, 0.05)'`, `borderWidth: 1`, `borderColor: 'rgba(36, 27, 74, 0.08)'`
    - Icon: `<Ionicons name="swap-horizontal" size={20} color={colors.deepIndigo} />`
    - Accessibility: `accessibilityRole="button"`, `accessibilityLabel="Switch active learning language"`
- **Empty State (when activeLanguage is explicitly null):**
  - Card background: `colors.warmIvory`, border `rgba(36, 27, 74, 0.06)`
  - Title: `color: colors.deepIndigo`
  - Description: `color: colors.slate`

### 2.4 `components/profile/LearningStatsGrid.tsx`
- **StatCard Styling:**
  - Background: `colors.warmIvory` (`#FAF7F0`)
  - Border: `1px solid rgba(36, 27, 74, 0.06)`
  - Value text: `fontFamily: 'PlusJakartaSans_700Bold'`, `fontSize: 24`, `color: colors.deepIndigo`
  - Label text: `fontFamily: 'PlusJakartaSans_600SemiBold'`, `fontSize: 11`, `color: colors.slate`
  - Icon container backgrounds:
    - XP: `rgba(255, 183, 77, 0.15)` (Amber)
    - Lessons: `rgba(53, 208, 160, 0.15)` (Mint)
    - Words Mastered: `rgba(255, 107, 87, 0.15)` (Coral)
    - Days Active: `rgba(53, 208, 160, 0.15)` (Mint)
    - Current Streak: `rgba(255, 183, 77, 0.15)` (Amber)

### 2.5 `components/profile/ProfileSkeletonLoader.tsx`
- **Skeleton Cards:**
  - Background: `rgba(36, 27, 74, 0.06)` (subtle warm grey/cream pulse)
  - Border: `1px solid rgba(36, 27, 74, 0.04)`
  - Inner avatar placeholder: `rgba(36, 27, 74, 0.08)`
  - Inner text placeholders: `rgba(36, 27, 74, 0.08)`

---

## 3. Test Strategy & Verification

1. **Unit Tests (`__tests__/components/profileComponents.test.tsx`):**
   - Update tests for `ActiveLanguageCard`:
     - Test that pressing `switch-language-button` triggers `onSwitchLanguage`.
     - Test that language name, native name, flag are rendered correctly.
     - Test empty state rendering when `activeLanguage={null}`.
2. **Screen Integration Tests (`__tests__/screens/ProfileScreen.test.tsx`):**
   - Verify skeleton loader renders on initial load.
   - Verify profile details, active language, stats, and sign out button render with the new styling.
   - Verify language switch button press navigates to learn/selection flow.
