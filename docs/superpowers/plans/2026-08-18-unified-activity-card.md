# Unified ActivityCard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or subagent-driven-development to implement this plan task-by-task.

**Goal:** Unify `LessonCard` and `PracticeCard` into a single reusable, high-fidelity `ActivityCard` component with consistent styling, localized Vietnamese copy, and status indicators matching `DESIGN.md`.

**Architecture:** Create `components/ui/ActivityCard.tsx` using NativeWind and project theme tokens (`Fredoka`, `PlusJakartaSans`, `lumioCoral`, `mint`, `daylightAmber`, `cream`). Update `LessonCard.tsx` and `PracticeCard.tsx` as backward-compatible wrappers, and update `app/(tabs)/learn.tsx` to render `ActivityCard` directly.

**Tech Stack:** Expo, React Native, NativeWind / Tailwind CSS, `@expo/vector-icons`, Jest, `@testing-library/react-native`.

---

### Task 1: Create `ActivityCard` Component with TDD

**Files:**
- Create: `components/ui/ActivityCard.tsx`
- Create: `__tests__/components/ui/ActivityCard.test.tsx`

**Step 1: Write failing test suite for `ActivityCard`**

```tsx
// __tests__/components/ui/ActivityCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityCard } from '@/components/ui/ActivityCard';

describe('ActivityCard', () => {
  const defaultProps = {
    orderNumber: 1,
    title: 'Basic Greetings',
    status: 'not_started' as const,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for not_started status', () => {
    const { getByText, getByTestId } = render(
      <ActivityCard {...defaultProps} status="not_started" />
    );

    expect(getByText('Basic Greetings')).toBeTruthy();
    expect(getByText('Bài 1')).toBeTruthy();
    expect(getByTestId('icon-play-outline')).toBeTruthy();
  });

  it('renders correctly for in_progress status with "Đang học" badge and solid play icon', () => {
    const { getByText, getByTestId } = render(
      <ActivityCard
        {...defaultProps}
        orderNumber={2}
        title="Common Expressions"
        status="in_progress"
      />
    );

    expect(getByText('Common Expressions')).toBeTruthy();
    expect(getByText('Bài 2')).toBeTruthy();
    expect(getByText('Đang học')).toBeTruthy();
    expect(getByTestId('icon-play-solid')).toBeTruthy();
  });

  it('renders correctly for completed status with "Đã xong" badge and checkmark icon', () => {
    const { getByText, getByTestId } = render(
      <ActivityCard
        {...defaultProps}
        orderNumber={3}
        title="Alphabet & Sounds"
        status="completed"
      />
    );

    expect(getByText('Alphabet & Sounds')).toBeTruthy();
    expect(getByText('Bài 3')).toBeTruthy();
    expect(getByText('Đã xong')).toBeTruthy();
    expect(getByTestId('icon-checkmark')).toBeTruthy();
  });

  it('renders typeLabel when provided', () => {
    const { getByText } = render(
      <ActivityCard
        {...defaultProps}
        typeLabel="Trắc nghiệm"
      />
    );

    expect(getByText('Bài 1 • Trắc nghiệm')).toBeTruthy();
  });

  it('renders metadata items (questions count, xpReward, estimatedMinutes) when provided', () => {
    const { getByText } = render(
      <ActivityCard
        {...defaultProps}
        questionsCount={4}
        xpReward={20}
        estimatedMinutes={5}
      />
    );

    expect(getByText('4 câu hỏi')).toBeTruthy();
    expect(getByText('+20 XP')).toBeTruthy();
    expect(getByText('5 phút')).toBeTruthy();
  });

  it('triggers onPress callback when card is pressed', () => {
    const handlePress = jest.fn();
    const { getByTestId } = render(
      <ActivityCard {...defaultProps} onPress={handlePress} />
    );

    fireEvent.press(getByTestId('activity-card'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test __tests__/components/ui/ActivityCard.test.tsx`
Expected: FAIL (Cannot find module `@/components/ui/ActivityCard`)

**Step 3: Implement `ActivityCard.tsx`**

```tsx
// components/ui/ActivityCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface ActivityCardProps {
  orderNumber: number;
  title: string;
  status: 'completed' | 'in_progress' | 'not_started';
  typeLabel?: string;
  questionsCount?: number;
  xpReward?: number;
  estimatedMinutes?: number;
  onPress: () => void;
  testID?: string;
}

export function ActivityCard({
  orderNumber,
  title,
  status,
  typeLabel,
  questionsCount,
  xpReward,
  estimatedMinutes,
  onPress,
  testID = 'activity-card',
}: ActivityCardProps) {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  // Status-dependent container border
  const borderColorStyle = isInProgress
    ? { borderColor: colors.lumioCoral }
    : isCompleted
    ? { borderColor: `${colors.mint}40` }
    : { borderColor: 'rgba(51, 65, 85, 0.4)' }; // slate-700/40

  // Status-dependent header label color
  const labelColor = isCompleted
    ? colors.mint
    : isInProgress
    ? colors.lumioCoral
    : colors.lavenderMist;

  const headerLabel = typeLabel
    ? `Bài ${orderNumber} • ${typeLabel}`
    : `Bài ${orderNumber}`;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
      style={borderColorStyle}
      className="mx-4 mb-3.5 p-4 rounded-3xl border bg-slate-900/60 flex-row items-center justify-between"
      accessibilityRole="button"
      accessibilityLabel={`${headerLabel}: ${title}`}
    >
      {/* Left / Main Section */}
      <View className="flex-1 mr-3">
        {/* Header row: Order number & optional status badge */}
        <View className="flex-row items-center mb-1">
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: labelColor,
            }}
            className="text-xs uppercase tracking-wider mr-2"
          >
            {headerLabel}
          </Text>

          {isInProgress && (
            <View className="px-2.5 py-0.5 rounded-full bg-[#FF6B57]/15 border border-[#FF6B57]/30">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.lumioCoral,
                }}
                className="text-[10px]"
              >
                Đang học
              </Text>
            </View>
          )}

          {isCompleted && (
            <View className="px-2.5 py-0.5 rounded-full bg-[#35D0A0]/15 border border-[#35D0A0]/30 flex-row items-center">
              <Ionicons name="checkmark-circle" size={10} color={colors.mint} style={{ marginRight: 3 }} />
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.mint,
                }}
                className="text-[10px]"
              >
                Đã xong
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text
          style={{
            fontFamily: 'Fredoka_700Bold',
            color: colors.cream,
          }}
          className="text-base mb-2"
          numberOfLines={2}
        >
          {title}
        </Text>

        {/* Metadata row (Questions count, XP reward & duration) */}
        <View className="flex-row items-center flex-wrap">
          {questionsCount !== undefined && (
            <View className="flex-row items-center mr-3">
              <Ionicons name="help-circle-outline" size={12} color={colors.lavenderMist} style={{ marginRight: 4 }} />
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lavenderMist,
                }}
                className="text-xs"
              >
                {`${questionsCount} câu hỏi`}
              </Text>
            </View>
          )}

          {xpReward !== undefined && (
            <View className="flex-row items-center mr-3">
              <Ionicons name="sparkles" size={12} color={colors.daylightAmber} style={{ marginRight: 4 }} />
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.daylightAmber,
                }}
                className="text-xs"
              >
                {`+${xpReward} XP`}
              </Text>
            </View>
          )}

          {estimatedMinutes !== undefined && estimatedMinutes > 0 && (
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={12} color={colors.lavenderMist} style={{ marginRight: 4 }} />
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lavenderMist,
                }}
                className="text-xs opacity-80"
              >
                {`${estimatedMinutes} phút`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right Action / Status Badge Icon */}
      <View className="items-center justify-center">
        {isCompleted && (
          <View
            className="w-10 h-10 rounded-full bg-[#35D0A0]/15 items-center justify-center border border-[#35D0A0]/40"
            testID="icon-checkmark"
          >
            <Ionicons name="checkmark-sharp" size={20} color={colors.mint} />
          </View>
        )}

        {isInProgress && (
          <View
            className="w-10 h-10 rounded-full bg-[#FF6B57] items-center justify-center shadow-sm"
            testID="icon-play-solid"
          >
            <Ionicons name="play" size={18} color={colors.cream} style={{ marginLeft: 2 }} />
          </View>
        )}

        {status === 'not_started' && (
          <View
            className="w-10 h-10 rounded-full bg-slate-800/60 items-center justify-center border border-slate-700/50"
            testID="icon-play-outline"
          >
            <Ionicons name="play-outline" size={18} color={colors.lavenderMist} style={{ marginLeft: 2 }} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test __tests__/components/ui/ActivityCard.test.tsx`
Expected: PASS (all 6 tests pass)

**Step 5: Commit**

```bash
git add components/ui/ActivityCard.tsx __tests__/components/ui/ActivityCard.test.tsx
git commit -m "feat(ui): create unified ActivityCard component"
```

---

### Task 2: Refactor `LessonCard` and `PracticeCard` as Wrappers around `ActivityCard`

**Files:**
- Modify: `components/learn/LessonCard.tsx`
- Modify: `components/practice/PracticeCard.tsx`
- Modify: `__tests__/components/learn/LessonCard.test.tsx`
- Modify: `__tests__/components/practice/PracticeCard.test.tsx`

**Step 1: Update `components/learn/LessonCard.tsx` and `components/practice/PracticeCard.tsx`**

Update `LessonCard.tsx` to delegate to `ActivityCard`:
```tsx
import React from 'react';
import { ActivityCard } from '@/components/ui/ActivityCard';

export interface LessonCardProps {
  lessonNumber: number;
  title: string;
  status: 'completed' | 'in_progress' | 'not_started';
  xpReward?: number;
  estimatedMinutes?: number;
  onPress: () => void;
}

export function LessonCard({
  lessonNumber,
  title,
  status,
  xpReward,
  estimatedMinutes,
  onPress,
}: LessonCardProps) {
  return (
    <ActivityCard
      orderNumber={lessonNumber}
      title={title}
      status={status}
      xpReward={xpReward}
      estimatedMinutes={estimatedMinutes}
      onPress={onPress}
      testID="lesson-card"
    />
  );
}
```

Update `PracticeCard.tsx` to delegate to `ActivityCard`:
```tsx
import React from 'react';
import { ActivityCard } from '@/components/ui/ActivityCard';

export interface PracticeCardProps {
  lessonNumber: number;
  title: string;
  activitiesCount: number;
  xpReward: number;
  estimatedMinutes: number;
  status: 'completed' | 'in_progress' | 'not_started';
  onPress: () => void;
  testID?: string;
}

export function PracticeCard({
  lessonNumber,
  title,
  activitiesCount,
  xpReward,
  estimatedMinutes,
  status,
  onPress,
  testID = 'practice-card',
}: PracticeCardProps) {
  return (
    <ActivityCard
      orderNumber={lessonNumber}
      typeLabel="Trắc nghiệm"
      title={title}
      questionsCount={activitiesCount}
      xpReward={xpReward}
      estimatedMinutes={estimatedMinutes}
      status={status}
      onPress={onPress}
      testID={testID}
    />
  );
}
```

**Step 2: Update tests for `LessonCard` and `PracticeCard` to reflect unified Vietnamese strings**

Update `__tests__/components/learn/LessonCard.test.tsx` and `__tests__/components/practice/PracticeCard.test.tsx`.

**Step 3: Run tests to verify**

Run: `npm test __tests__/components/learn/LessonCard.test.tsx __tests__/components/practice/PracticeCard.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add components/learn/LessonCard.tsx components/practice/PracticeCard.tsx __tests__/components/learn/LessonCard.test.tsx __tests__/components/practice/PracticeCard.test.tsx
git commit -m "refactor(components): delegate LessonCard and PracticeCard to ActivityCard"
```

---

### Task 3: Update `LearnScreen` and Verify All Screens & Tests

**Files:**
- Modify: `app/(tabs)/learn.tsx`
- Modify: `__tests__/screens/learn.test.tsx`

**Step 1: Update `app/(tabs)/learn.tsx` to use `ActivityCard` directly**

Use `ActivityCard` in both `lessons.map` and `practiceLessons.map`.

**Step 2: Run screen tests & full test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run TypeScript check**

Run: `npm run typecheck`
Expected: PASS (no type errors)

**Step 4: Commit**

```bash
git add app/\(tabs\)/learn.tsx __tests__/screens/learn.test.tsx
git commit -m "feat(learn): render unified ActivityCard on Learn screen"
```
