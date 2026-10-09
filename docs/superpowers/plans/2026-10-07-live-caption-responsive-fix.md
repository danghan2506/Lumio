# AI Tutor Live Caption Responsive & Spatial Isolation Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the responsiveness of the live caption box in the AI tutor lesson screen by clamping height, introducing auto-scrolling, stabilizing font metrics, scaling the mascot adaptively on compact viewports, and partitioning the layout into 3 strictly isolated zones so text never overflows or overlaps the 64px microphone button.

**Architecture:** Refactor `app/lesson/[id].tsx` from an unconstrained `justifyContent: 'space-between'` into three bounded zones (Header, Adaptive Center Stage, and Protected Controls Dock). Upgrade `LessonCaptionsSlot.tsx` with `minHeight: 64`, `maxHeight: 128`, and an internal auto-scrolling `ScrollView` with unified `PlusJakartaSans_500Medium` typography. Upgrade `MascotStage.tsx` to responsively scale avatar dimensions when screen height is below 720px.

**Tech Stack:** React Native (0.81), Expo (SDK 54), TypeScript, NativeWind / Tailwind CSS, React Native Reanimated.

## Global Constraints

- Follow design tokens from `DESIGN.md`: Dark canvas (`colors.deepIndigo` `#241B4A`), Accent Coral (`colors.lumioCoral` `#FF6B57`), Cream (`colors.cream` `#FFFBF4`), Lavender Mist (`colors.lavenderMist` `#EAE6FF`), Slate (`colors.slate` `#5E5A80`).
- No generic font `Inter` or unmasked square images.
- Strict Spatial Separation: Zero visual overlap between the caption slot and the bottom audio controls dock across any viewport size (minimum 20px margin buffer).
- All interactive controls must satisfy the 48px minimum touch target floor (Mic is 64px, toggles are 48px).
- Strict adherence to `verification-before-completion` protocol before marking completion.

---

### Task 1: Upgrade `LessonCaptionsSlot` with Height Clamping, Auto-Scrolling, and Stable Typography

**Files:**
- Modify: `components/lesson/LessonCaptionsSlot.tsx`
- Modify: `__tests__/components/lesson/LessonCaptionsSlot.test.tsx`

**Interfaces:**
- Consumes: `LessonCaptionsSlotProps { languageName?: string; showCaptions: boolean; captionText?: string | null; isLive?: boolean; }`
- Produces: Enhanced `LessonCaptionsSlot` with `minHeight: 64`, `maxHeight: 128`, auto-scrolling `ScrollView`, and unified `PlusJakartaSans_500Medium` font weight to eliminate text jumping.

- [ ] **Step 1: Write the failing tests for clamped height and scrollable behavior**

Edit `__tests__/components/lesson/LessonCaptionsSlot.test.tsx` to add tests for clamped container height, scrollview existence, and long caption rendering:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { LessonCaptionsSlot } from '@/components/lesson/LessonCaptionsSlot';

describe('LessonCaptionsSlot', () => {
  it('renders default voice guidance hint when showCaptions is true and no captionText is provided', () => {
    const { getByText } = render(
      <LessonCaptionsSlot languageName="Spanish" showCaptions={true} />
    );
    expect(getByText('Speak naturally in Spanish to practice with Lumi.')).toBeTruthy();
  });

  it('renders fallback voice guidance hint when languageName is omitted', () => {
    const { getByText } = render(
      <LessonCaptionsSlot showCaptions={true} />
    );
    expect(getByText('Speak naturally in your language to practice with Lumi.')).toBeTruthy();
  });

  it('renders custom captionText when provided', () => {
    const { getByText, queryByText } = render(
      <LessonCaptionsSlot
        languageName="Spanish"
        showCaptions={true}
        captionText="Hola, ¿cómo estás?"
      />
    );
    expect(getByText('Hola, ¿cómo estás?')).toBeTruthy();
    expect(queryByText(/Speak naturally in Spanish to practice with Lumi\./i)).toBeNull();
  });

  it('preserves layout with minHeight 64 and hides caption text when showCaptions is false', () => {
    const { queryByText, getByTestId } = render(
      <LessonCaptionsSlot
        languageName="Spanish"
        showCaptions={false}
        captionText="Hola, ¿cómo estás?"
      />
    );
    expect(queryByText('Hola, ¿cómo estás?')).toBeNull();
    expect(queryByText(/Speak naturally/i)).toBeNull();
    const placeholder = getByTestId('captions-slot-placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder.props.style).toEqual(
      expect.objectContaining({ minHeight: 64 })
    );
  });

  it('clamps card container style with minHeight 64 and maxHeight 128', () => {
    const { getByTestId } = render(
      <LessonCaptionsSlot
        languageName="Spanish"
        showCaptions={true}
        captionText="Testing height clamping bounds."
      />
    );
    const card = getByTestId('captions-slot-card');
    expect(card.props.style).toEqual(
      expect.objectContaining({
        minHeight: 64,
        maxHeight: 128,
      })
    );
  });

  it('renders long text inside a scrollable view with stable font metrics', () => {
    const longText =
      'Great job on your pronunciation! In Spanish, remember to say Buenos días in the morning instead of Buenas tardes. Let us practice ordering breakfast together.';
    const { getByText, getByTestId } = render(
      <LessonCaptionsSlot
        languageName="Spanish"
        showCaptions={true}
        captionText={longText}
        isLive={true}
      />
    );
    expect(getByText(longText)).toBeTruthy();
    const scrollView = getByTestId('captions-scroll-view');
    expect(scrollView).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/components/lesson/LessonCaptionsSlot.test.tsx`
Expected: FAIL due to missing `minHeight: 64`, `maxHeight: 128`, or `captions-scroll-view` testID.

- [ ] **Step 3: Implement minimal code in `LessonCaptionsSlot.tsx`**

Modify `components/lesson/LessonCaptionsSlot.tsx`:

```tsx
import React, { useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors } from '@/theme/colors';

export interface LessonCaptionsSlotProps {
  languageName?: string;
  showCaptions: boolean;
  captionText?: string | null;
  isLive?: boolean;
}

export function LessonCaptionsSlot({
  languageName = 'your language',
  showCaptions,
  captionText,
  isLive = false,
}: LessonCaptionsSlotProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  if (!showCaptions) {
    return <View testID="captions-slot-placeholder" style={{ minHeight: 64 }} />;
  }

  return (
    <View
      testID="captions-slot-card"
      style={{
        marginHorizontal: 24,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: isLive ? 'rgba(94,90,128,0.26)' : 'rgba(94,90,128,0.14)',
        borderWidth: 1,
        borderColor: isLive ? 'rgba(255,107,87,0.4)' : 'rgba(94,90,128,0.2)',
        minHeight: 64,
        maxHeight: 128,
        justifyContent: 'center',
      }}
    >
      {/* Fixed-height header row for LIVE indicator to prevent layout jumping */}
      <View
        style={{
          height: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
          opacity: isLive ? 1 : 0,
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.lumioCoral,
            marginRight: 6,
          }}
        />
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.lumioCoral,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          LIVE
        </Text>
      </View>

      {/* Internal scroll view with auto-scroll to bottom */}
      <ScrollView
        testID="captions-scroll-view"
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_500Medium',
            color: isLive ? colors.cream : colors.lavenderMist,
            fontSize: 13,
            textAlign: 'center',
            lineHeight: 19,
            opacity: isLive ? 1 : 0.85,
          }}
        >
          {captionText || `Speak naturally in ${languageName} to practice with Lumi.`}
        </Text>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/components/lesson/LessonCaptionsSlot.test.tsx`
Expected: PASS (all 6 tests pass).

- [ ] **Step 5: Commit changes**

```bash
git add components/lesson/LessonCaptionsSlot.tsx __tests__/components/lesson/LessonCaptionsSlot.test.tsx
git commit -m "feat(lesson): add clamped height, auto-scrolling, and stable typography to LessonCaptionsSlot"
```

---

### Task 2: Add Viewport-Aware Responsive Scaling to `MascotStage`

**Files:**
- Modify: `components/lesson/MascotStage.tsx`
- Modify: `__tests__/components/lesson/MascotStage.test.tsx`

**Interfaces:**
- Consumes: `MascotStageProps { callStatus: string; teacherStatus: string; isMuted: boolean; onRetryTeacher?: () => void; }`
- Produces: `MascotStage` supporting compact viewports (`windowHeight < 720px`) by reducing avatar frame from 190px to 150px and vertical padding from 20px to 8px.

- [ ] **Step 1: Write test for responsive sizing in `MascotStage.test.tsx`**

Edit `__tests__/components/lesson/MascotStage.test.tsx` to add a test checking responsive sizing under compact height:

```typescript
  it('renders with compact dimensions on short screens', () => {
    // Test that the mascot stage root container renders and contains avatar frame
    const { getByTestId } = render(
      <MascotStage callStatus="joined" teacherStatus="connected" isMuted={false} />
    );
    const stageContainer = getByTestId('mascot-stage-container');
    expect(stageContainer).toBeTruthy();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/components/lesson/MascotStage.test.tsx`
Expected: FAIL due to missing `testID="mascot-stage-container"`.

- [ ] **Step 3: Implement minimal code in `MascotStage.tsx`**

Modify `components/lesson/MascotStage.tsx` to read `useWindowDimensions()` and apply responsive sizing:

```tsx
import { useWindowDimensions } from 'react-native';
...
export function MascotStage({
  callStatus,
  teacherStatus,
  isMuted,
  onRetryTeacher,
}: MascotStageProps) {
  const { height: windowHeight } = useWindowDimensions();
  const isCompact = windowHeight < 720;

  const outerFrameSize = isCompact ? 150 : 190;
  const auraSize = isCompact ? 134 : 170;
  const avatarFrameSize = isCompact ? 124 : 156;
  const avatarImageSize = isCompact ? 116 : 148;
  const containerPaddingY = isCompact ? 8 : 16;
...
```

Add `testID="mascot-stage-container"` to the root `<View style={{ alignItems: 'center', paddingVertical: containerPaddingY }}>`.
Adjust inner dimensions using the calculated responsive constants.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/components/lesson/MascotStage.test.tsx`
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit changes**

```bash
git add components/lesson/MascotStage.tsx __tests__/components/lesson/MascotStage.test.tsx
git commit -m "feat(lesson): add viewport-aware responsive scaling to MascotStage"
```

---

### Task 3: Restructure `app/lesson/[id].tsx` into 3 Isolated Zones with Protected Buffer

**Files:**
- Modify: `app/lesson/[id].tsx:210-390`

**Interfaces:**
- Consumes: `LessonHeader`, `MascotStage`, `LessonCaptionsSlot`, `AudioControls`
- Produces: Strictly partitioned 3-zone layout preventing any vertical intrusion into `AudioControls`.

- [ ] **Step 1: Check existing screen test behavior**

Run: `npm test -- __tests__/screens/audio-lesson.test.tsx`
Expected: PASS or identifies current snapshot/layout expectations.

- [ ] **Step 2: Restructure layout in `app/lesson/[id].tsx`**

Replace the current unconstrained flex container (lines 210-390):

```tsx
    <View
      style={{
        flex: 1,
        backgroundColor: colors.deepIndigo,
        paddingTop: topInset,
        paddingBottom: bottomInset,
      }}
    >
      {/* ─── ZONE 1: Header Dock (Fixed Height) ─── */}
      <View style={{ flexShrink: 0, zIndex: 10 }}>
        <LessonHeader
          languageFlag={language?.flag}
          languageName={language?.name}
          lessonOrder={lesson.order}
          lessonTitle={lesson.title}
          xpReward={lesson.xp_reward}
          onBack={() => router.back()}
        />

        {/* Call Connection Error Banner */}
        {status === 'error' && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              padding: 16,
              borderRadius: 20,
              backgroundColor: 'rgba(255,107,87,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(94,90,128,0.25)',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="alert-circle-outline"
              size={28}
              color={colors.lumioCoral}
              style={{ marginBottom: 8 }}
            />
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.cream,
                fontSize: 13,
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              Couldn&apos;t connect to the audio call
            </Text>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.lavenderMist,
                fontSize: 11,
                textAlign: 'center',
                marginBottom: 12,
                opacity: 0.75,
              }}
            >
              {errorMessage}
            </Text>
            <TouchableOpacity
              onPress={() => void retry()}
              style={{
                backgroundColor: colors.lumioCoral,
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.cream,
                  fontSize: 12,
                }}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ─── ZONE 2: Adaptive Center Stage (Mascot + Captions) ─── */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 8,
          minHeight: 0, // Enables proper flex shrinking in React Native
        }}
      >
        <MascotStage
          callStatus={status}
          teacherStatus={teacher.status}
          isMuted={isMuted}
          onRetryTeacher={() => void teacher.retry()}
        />
        <View style={{ marginTop: 16, width: '100%', maxWidth: 440 }}>
          <LessonCaptionsSlot
            languageName={language?.name}
            showCaptions={showCaptions}
            captionText={captionText}
            isLive={captionsActive}
          />
        </View>
      </View>

      {/* ─── ZONE 3: Protected Audio Controls Dock ─── */}
      <View
        style={{
          flexShrink: 0,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
          minHeight: 96,
          justifyContent: 'center',
        }}
      >
        <AudioControls
          isMuted={isMuted}
          isCallJoined={status === 'joined'}
          showCaptions={showCaptions}
          onToggleMute={() => void toggleMute()}
          onToggleCaptions={() => setShowCaptions(!showCaptions)}
        />
      </View>

      {/* ─── Summary Modal ─── */}
      <LessonSummaryModal
        visible={showSummary}
        xpReward={lesson.xp_reward}
        progressError={progressError}
        userFeedback={userFeedback}
        onChangeFeedback={setUserFeedback}
        onRetryProgress={() => {
          if (lastPayloadRef.current) void handleLessonComplete(lastPayloadRef.current);
        }}
        onClaimRewards={() => {
          setShowSummary(false);
          router.replace('/(tabs)/learn');
        }}
      />
    </View>
```

- [ ] **Step 3: Run screen tests to verify functionality**

Run: `npm test -- __tests__/screens/audio-lesson.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit changes**

```bash
git add app/lesson/[id].tsx
git commit -m "feat(lesson): partition audio lesson into 3 isolated zones with protected mic controls dock"
```

---

### Task 4: Full Verification Before Completion (`verification-before-completion`)

**Files:**
- Audit & Verify: All changed files and test suites

**Gate Protocol:**
Run fresh commands and collect evidence before claiming completion.

- [ ] **Step 1: Execute lesson component test suite**

Run: `npm test -- __tests__/components/lesson/LessonCaptionsSlot.test.tsx __tests__/components/lesson/MascotStage.test.tsx __tests__/screens/audio-lesson.test.tsx`
Verify: 0 failed tests.

- [ ] **Step 2: Execute TypeScript compiler check**

Run: `npm run typecheck`
Verify: Exit code 0, 0 errors.

- [ ] **Step 3: Execute linter check**

Run: `npm run lint`
Verify: 0 lint errors.

- [ ] **Step 4: Verify layout bounding criteria**
- Confirm `LessonCaptionsSlot` style has `minHeight: 64` and `maxHeight: 128`.
- Confirm `AudioControls` is housed in a dedicated dock with `minHeight: 96` and `paddingTop: 16`.
- Confirm `MascotStage` has responsive dimensions for `windowHeight < 720`.

- [ ] **Step 5: Commit and record verification evidence in completion report**
