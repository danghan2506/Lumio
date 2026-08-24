# AI Teacher Mascot-Centric UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the AI Teacher Audio Lesson screen (`app/lesson/[id].tsx`) to be mascot-centric, voice-driven, and uncluttered by removing raw prompts and modularizing components in `components/lesson/` without affecting any other screen.

**Architecture:** Decompose the screen into single-responsibility components (`LessonHeader`, `MascotStage`, `LessonCaptionsSlot`, `AudioControls`, `LessonSummaryModal`) in `components/lesson/`. The screen orchestrates WebRTC call state and agent hooks, passing state to pure UI components.

**Tech Stack:** React Native, Expo Router, NativeWind / Tailwind CSS, React Native Reanimated, TypeScript, Jest, React Native Testing Library.

## Global Constraints
- **Zero Cross-Screen Impact:** Do not modify any files outside `app/lesson/[id].tsx`, `components/lesson/*`, and `__tests__/*`.
- **Palette & Typography:** Deep Indigo (`#241B4A`), Lumio Coral (`#FF6B57`), Daylight Amber (`#FFB74D`), Mint (`#35D0A0`), Slate (`#5E5A80`), Cream (`#FFFBF4`). Display font `Fredoka_700Bold`, body font `PlusJakartaSans`.
- **Touch Targets:** Minimum tap target ≥ 48px.
- **No Raw Prompts:** No `lesson.ai_teacher_prompt` or system prompt text in the UI.

---

### Task 1: Create `LessonHeader` Component

**Files:**
- Create: `components/lesson/LessonHeader.tsx`
- Test: `__tests__/components/lesson/LessonHeader.test.tsx`

**Interfaces:**
- Consumes:
  ```ts
  interface LessonHeaderProps {
    languageFlag?: string;
    languageName?: string;
    lessonOrder: number;
    lessonTitle: string;
    xpReward: number;
    onBack: () => void;
  }
  ```
- Produces: `LessonHeader` component

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/lesson/LessonHeader.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LessonHeader } from '@/components/lesson/LessonHeader';

describe('LessonHeader', () => {
  it('renders language, lesson title, xp reward and handles back press', () => {
    const onBack = jest.fn();
    const { getByText, getByTestId } = render(
      <LessonHeader
        languageFlag="🇬🇧"
        languageName="English"
        lessonOrder={1}
        lessonTitle="Basic Greetings"
        xpReward={10}
        onBack={onBack}
      />
    );
    expect(getByText(/Lesson 1: Basic Greetings/i)).toBeTruthy();
    expect(getByText(/10 XP/i)).toBeTruthy();
    fireEvent.press(getByTestId('lesson-back-btn'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Implement `LessonHeader`**

```tsx
// components/lesson/LessonHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface LessonHeaderProps {
  languageFlag?: string;
  languageName?: string;
  lessonOrder: number;
  lessonTitle: string;
  xpReward: number;
  onBack: () => void;
}

export function LessonHeader({
  languageFlag = '🌐',
  languageName = 'Language',
  lessonOrder,
  lessonTitle,
  xpReward,
  onBack,
}: LessonHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <TouchableOpacity
        testID="lesson-back-btn"
        onPress={onBack}
        activeOpacity={0.7}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(94,90,128,0.15)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="chevron-back" size={22} color={colors.cream} />
      </TouchableOpacity>

      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 10,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: 'rgba(94,90,128,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(94,90,128,0.18)',
        }}
      >
        <Text style={{ fontSize: 13, marginRight: 6 }}>{languageFlag}</Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.lavenderMist,
            fontSize: 12,
          }}
        >
          Lesson {lessonOrder}: {lessonTitle}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: colors.daylightAmber,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
        }}
      >
        <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo, fontSize: 12 }}>
          +{xpReward} XP
        </Text>
      </View>
    </View>
  );
}
```

---

### Task 2: Create `MascotStage` Component with Live Status Pill

**Files:**
- Create: `components/lesson/MascotStage.tsx`
- Test: `__tests__/components/lesson/MascotStage.test.tsx`

**Interfaces:**
- Consumes:
  ```ts
  interface MascotStageProps {
    callStatus: 'connecting' | 'joining' | 'joined' | 'error';
    teacherStatus: 'idle' | 'connecting' | 'connected' | 'failed';
    isMuted: boolean;
    onRetryTeacher?: () => void;
  }
  ```
- Produces: `MascotStage` component

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/lesson/MascotStage.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MascotStage } from '@/components/lesson/MascotStage';

describe('MascotStage', () => {
  it('renders connecting state when call is connecting', () => {
    const { getByText } = render(
      <MascotStage callStatus="connecting" teacherStatus="idle" isMuted={false} />
    );
    expect(getByText(/Connecting to Lumi/i)).toBeTruthy();
  });

  it('renders Lumi is listening when joined and teacher is connected', () => {
    const { getByText } = render(
      <MascotStage callStatus="joined" teacherStatus="connected" isMuted={false} />
    );
    expect(getByText(/Lumi is listening/i)).toBeTruthy();
  });

  it('renders muted state when muted', () => {
    const { getByText } = render(
      <MascotStage callStatus="joined" teacherStatus="connected" isMuted={true} />
    );
    expect(getByText(/Microphone muted/i)).toBeTruthy();
  });

  it('shows retry button when teacher failed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <MascotStage callStatus="joined" teacherStatus="failed" isMuted={false} onRetryTeacher={onRetry} />
    );
    expect(getByText(/Teacher unavailable/i)).toBeTruthy();
    fireEvent.press(getByText(/Retry teacher/i));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Implement `MascotStage`**

```tsx
// components/lesson/MascotStage.tsx
import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { images } from '@/constants/images';

interface MascotStageProps {
  callStatus: 'connecting' | 'joining' | 'joined' | 'error';
  teacherStatus: 'idle' | 'connecting' | 'connected' | 'failed';
  isMuted: boolean;
  onRetryTeacher?: () => void;
}

export function MascotStage({
  callStatus,
  teacherStatus,
  isMuted,
  onRetryTeacher,
}: MascotStageProps) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  const isLive = callStatus === 'joined' && teacherStatus === 'connected' && !isMuted;

  useEffect(() => {
    if (isLive) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 1200, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1200 }),
          withTiming(0.2, { duration: 1200 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1.0, { duration: 300 });
      pulseOpacity.value = withTiming(0.2, { duration: 300 });
    }
  }, [isLive, pulseScale, pulseOpacity]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const renderStatusPill = () => {
    if (callStatus === 'error') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,107,87,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 }}>
          <Ionicons name="alert-circle" size={14} color={colors.lumioCoral} style={{ marginRight: 6 }} />
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lumioCoral, fontSize: 12 }}>
            Connection error
          </Text>
        </View>
      );
    }

    if (callStatus === 'connecting' || callStatus === 'joining' || teacherStatus === 'connecting') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,183,77,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 }}>
          <ActivityIndicator size="small" color={colors.daylightAmber} style={{ marginRight: 6 }} />
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.daylightAmber, fontSize: 12 }}>
            Connecting to Lumi…
          </Text>
        </View>
      );
    }

    if (teacherStatus === 'failed') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,107,87,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 }}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.lumioCoral} style={{ marginRight: 6 }} />
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lumioCoral, fontSize: 12, marginRight: 8 }}>
            Teacher unavailable
          </Text>
          {onRetryTeacher && (
            <TouchableOpacity onPress={onRetryTeacher}>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream, fontSize: 12, textDecorationLine: 'underline' }}>
                Retry teacher
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (isMuted) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(94,90,128,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 }}>
          <Ionicons name="mic-off" size={13} color={colors.slate} style={{ marginRight: 6 }} />
          <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist, fontSize: 12 }}>
            Microphone muted
          </Text>
        </View>
      );
    }

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(53,208,160,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint, marginRight: 6 }} />
        <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.mint, fontSize: 12 }}>
          Lumi is listening
        </Text>
      </View>
    );
  };

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <View style={{ width: 190, height: 190, justifyContent: 'center', alignItems: 'center' }}>
        {/* Animated outer aura */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 170,
              height: 170,
              borderRadius: 85,
              backgroundColor: isLive ? colors.lumioCoral : 'transparent',
            },
            animatedGlowStyle,
          ]}
        />

        {/* Mascot Avatar Frame */}
        <View
          style={{
            width: 156,
            height: 156,
            borderRadius: 78,
            borderWidth: 3,
            borderColor: isLive ? colors.lumioCoral : 'rgba(94,90,128,0.3)',
            overflow: 'hidden',
            backgroundColor: '#1E1B3C',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image
            source={images.lumiTutor}
            style={{ width: 148, height: 148 }}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Live Status Pill */}
      <View style={{ marginTop: 16 }}>{renderStatusPill()}</View>
    </View>
  );
}
```

---

### Task 3: Create `LessonCaptionsSlot` Component

**Files:**
- Create: `components/lesson/LessonCaptionsSlot.tsx`
- Test: `__tests__/components/lesson/LessonCaptionsSlot.test.tsx`

**Interfaces:**
- Consumes:
  ```ts
  interface LessonCaptionsSlotProps {
    languageName?: string;
    showCaptions: boolean;
    captionText?: string;
  }
  ```
- Produces: `LessonCaptionsSlot` component

- [ ] **Step 1: Write test for `LessonCaptionsSlot`**

```tsx
// __tests__/components/lesson/LessonCaptionsSlot.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { LessonCaptionsSlot } from '@/components/lesson/LessonCaptionsSlot';

describe('LessonCaptionsSlot', () => {
  it('renders default voice guidance hint when showCaptions is true without custom text', () => {
    const { getByText } = render(
      <LessonCaptionsSlot languageName="English" showCaptions={true} />
    );
    expect(getByText(/Speak naturally in English to practice with Lumi/i)).toBeTruthy();
  });

  it('renders custom live caption when provided', () => {
    const { getByText } = render(
      <LessonCaptionsSlot languageName="English" showCaptions={true} captionText="Hello there!" />
    );
    expect(getByText('Hello there!')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement `LessonCaptionsSlot`**

```tsx
// components/lesson/LessonCaptionsSlot.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/theme/colors';

interface LessonCaptionsSlotProps {
  languageName?: string;
  showCaptions: boolean;
  captionText?: string;
}

export function LessonCaptionsSlot({
  languageName = 'your language',
  showCaptions,
  captionText,
}: LessonCaptionsSlotProps) {
  if (!showCaptions) {
    return <View style={{ minHeight: 48 }} />;
  }

  return (
    <View
      style={{
        marginHorizontal: 24,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(94,90,128,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(94,90,128,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
      }}
    >
      <Text
        style={{
          fontFamily: 'PlusJakartaSans_500Medium',
          color: colors.lavenderMist,
          fontSize: 13,
          textAlign: 'center',
          lineHeight: 19,
          opacity: 0.85,
        }}
      >
        {captionText || `Speak naturally in ${languageName} to practice with Lumi.`}
      </Text>
    </View>
  );
}
```

---

### Task 4: Create `AudioControls` Component

**Files:**
- Create: `components/lesson/AudioControls.tsx`
- Test: `__tests__/components/lesson/AudioControls.test.tsx`

**Interfaces:**
- Consumes:
  ```ts
  interface AudioControlsProps {
    isMuted: boolean;
    isCallJoined: boolean;
    showCaptions: boolean;
    onToggleMute: () => void;
    onToggleCaptions: () => void;
  }
  ```
- Produces: `AudioControls` component

- [ ] **Step 1: Write test for `AudioControls`**

```tsx
// __tests__/components/lesson/AudioControls.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AudioControls } from '@/components/lesson/AudioControls';

describe('AudioControls', () => {
  it('triggers onToggleMute on mic press when call is joined', () => {
    const onToggleMute = jest.fn();
    const onToggleCaptions = jest.fn();
    const { getByTestId } = render(
      <AudioControls
        isMuted={false}
        isCallJoined={true}
        showCaptions={true}
        onToggleMute={onToggleMute}
        onToggleCaptions={onToggleCaptions}
      />
    );
    fireEvent.press(getByTestId('mic-toggle'));
    expect(onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleCaptions on captions button press', () => {
    const onToggleMute = jest.fn();
    const onToggleCaptions = jest.fn();
    const { getByTestId } = render(
      <AudioControls
        isMuted={false}
        isCallJoined={true}
        showCaptions={true}
        onToggleMute={onToggleMute}
        onToggleCaptions={onToggleCaptions}
      />
    );
    fireEvent.press(getByTestId('captions-toggle'));
    expect(onToggleCaptions).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Implement `AudioControls`**

```tsx
// components/lesson/AudioControls.tsx
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface AudioControlsProps {
  isMuted: boolean;
  isCallJoined: boolean;
  showCaptions: boolean;
  onToggleMute: () => void;
  onToggleCaptions: () => void;
}

export function AudioControls({
  isMuted,
  isCallJoined,
  showCaptions,
  onToggleMute,
  onToggleCaptions,
}: AudioControlsProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 24,
      }}
    >
      {/* Captions Toggle Button */}
      <TouchableOpacity
        testID="captions-toggle"
        onPress={onToggleCaptions}
        activeOpacity={0.8}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: showCaptions ? colors.cream : 'rgba(94,90,128,0.2)',
          borderWidth: 1.5,
          borderColor: showCaptions ? 'transparent' : 'rgba(94,90,128,0.3)',
        }}
      >
        <Ionicons
          name="chatbox-ellipses-outline"
          size={20}
          color={showCaptions ? colors.deepIndigo : colors.cream}
        />
      </TouchableOpacity>

      {/* Primary Mic Toggle */}
      <TouchableOpacity
        testID="mic-toggle"
        onPress={onToggleMute}
        disabled={!isCallJoined}
        activeOpacity={0.8}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isMuted ? colors.deepIndigo : colors.lumioCoral,
          borderWidth: isMuted ? 2 : 0,
          borderColor: isMuted ? colors.lumioCoral : 'transparent',
          opacity: isCallJoined ? 1 : 0.5,
          shadowColor: colors.lumioCoral,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isMuted ? 0 : 0.3,
          shadowRadius: 10,
          elevation: isMuted ? 0 : 4,
        }}
      >
        <Ionicons
          name={isMuted ? 'mic-off' : 'mic'}
          size={28}
          color={colors.cream}
        />
      </TouchableOpacity>

      {/* Decorative Wave/Audio indicator button */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(94,90,128,0.15)',
          borderWidth: 1.5,
          borderColor: 'rgba(94,90,128,0.25)',
        }}
      >
        <Ionicons name="volume-high-outline" size={20} color={colors.lavenderMist} />
      </View>
    </View>
  );
}
```

---

### Task 5: Create `LessonSummaryModal` Component & Export Barrel

**Files:**
- Create: `components/lesson/LessonSummaryModal.tsx`
- Create: `components/lesson/index.ts`
- Test: `__tests__/components/lesson/LessonSummaryModal.test.tsx`

**Interfaces:**
- Consumes:
  ```ts
  interface LessonSummaryModalProps {
    visible: boolean;
    xpReward: number;
    progressError: string | null;
    userFeedback: string;
    onChangeFeedback: (text: string) => void;
    onRetrySaveProgress: () => void;
    onClaimRewards: () => void;
  }
  ```
- Produces: `LessonSummaryModal` component

- [ ] **Step 1: Write test for `LessonSummaryModal`**

```tsx
// __tests__/components/lesson/LessonSummaryModal.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LessonSummaryModal } from '@/components/lesson/LessonSummaryModal';

describe('LessonSummaryModal', () => {
  it('renders completion modal and handles reward claim', () => {
    const onClaim = jest.fn();
    const { getByText } = render(
      <LessonSummaryModal
        visible={true}
        xpReward={15}
        progressError={null}
        userFeedback=""
        onChangeFeedback={jest.fn()}
        onRetrySaveProgress={jest.fn()}
        onClaimRewards={onClaim}
      />
    );
    expect(getByText('Lesson Completed!')).toBeTruthy();
    expect(getByText('+15 XP')).toBeTruthy();
    fireEvent.press(getByText('Claim Rewards'));
    expect(onClaim).toHaveBeenCalledTimes(1);
  });

  it('shows error and retry button when progressError exists', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <LessonSummaryModal
        visible={true}
        xpReward={15}
        progressError="Failed to save"
        userFeedback=""
        onChangeFeedback={jest.fn()}
        onRetrySaveProgress={onRetry}
        onClaimRewards={jest.fn()}
      />
    );
    expect(getByText(/Failed to save/i)).toBeTruthy();
    fireEvent.press(getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Implement `LessonSummaryModal` and `index.ts`**

```tsx
// components/lesson/LessonSummaryModal.tsx
import React from 'react';
import { View, Text, Modal, Image, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '@/theme/colors';
import { images } from '@/constants/images';

interface LessonSummaryModalProps {
  visible: boolean;
  xpReward: number;
  progressError: string | null;
  userFeedback: string;
  onChangeFeedback: (text: string) => void;
  onRetrySaveProgress: () => void;
  onClaimRewards: () => void;
}

export function LessonSummaryModal({
  visible,
  xpReward,
  progressError,
  userFeedback,
  onChangeFeedback,
  onRetrySaveProgress,
  onClaimRewards,
}: LessonSummaryModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#1A1432',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: 24,
            borderTopWidth: 1,
            borderTopColor: 'rgba(94,90,128,0.2)',
          }}
        >
          <View style={{ alignItems: 'center', marginTop: -64, marginBottom: 12 }}>
            <Image
              source={images.lumiCelebration}
              style={{ width: 130, height: 130 }}
              resizeMode="contain"
            />
          </View>

          <Text
            style={{
              fontFamily: 'Fredoka_700Bold',
              color: colors.cream,
              fontSize: 24,
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            Lesson Completed!
          </Text>
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_500Medium',
              color: colors.lavenderMist,
              fontSize: 13,
              textAlign: 'center',
              marginBottom: 20,
              opacity: 0.75,
            }}
          >
            Awesome job practicing your spoken language today.
          </Text>

          <View
            style={{
              backgroundColor: 'rgba(94,90,128,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(94,90,128,0.15)',
              padding: 16,
              borderRadius: 16,
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <View
              style={{
                backgroundColor: colors.daylightAmber,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                marginBottom: 4,
              }}
            >
              <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo, fontSize: 14 }}>
                +{xpReward} XP
              </Text>
            </View>
          </View>

          {progressError && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lumioCoral,
                  fontSize: 12,
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                Could not save your progress: {progressError}
              </Text>
              <TouchableOpacity
                onPress={onRetrySaveProgress}
                style={{
                  backgroundColor: colors.lumioCoral,
                  paddingHorizontal: 24,
                  paddingVertical: 8,
                  borderRadius: 999,
                }}
              >
                <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream, fontSize: 12 }}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            placeholder="Leave lesson feedback (optional)..."
            placeholderTextColor={colors.slate}
            value={userFeedback}
            onChangeText={onChangeFeedback}
            style={{
              fontFamily: 'PlusJakartaSans_500Medium',
              color: colors.cream,
              backgroundColor: 'rgba(255,255,255,0.03)',
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(94,90,128,0.2)',
              marginBottom: 20,
              fontSize: 13,
            }}
            multiline={true}
            numberOfLines={2}
          />

          <TouchableOpacity
            onPress={onClaimRewards}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.lumioCoral,
              minHeight: 52,
              borderRadius: 999,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 14,
            }}
          >
            <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream, fontSize: 16 }}>
              Claim Rewards
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
```

```tsx
// components/lesson/index.ts
export { LessonHeader } from './LessonHeader';
export { MascotStage } from './MascotStage';
export { LessonCaptionsSlot } from './LessonCaptionsSlot';
export { AudioControls } from './AudioControls';
export { LessonSummaryModal } from './LessonSummaryModal';
```

---

### Task 6: Refactor `app/lesson/[id].tsx` and Update Screen Tests

**Files:**
- Modify: `app/lesson/[id].tsx`
- Modify: `__tests__/screens/audio-lesson.test.tsx`

- [ ] **Step 1: Refactor `app/lesson/[id].tsx` to assemble modular components**
- [ ] **Step 2: Update `__tests__/screens/audio-lesson.test.tsx`**
- [ ] **Step 3: Run all tests to ensure zero regressions across the codebase**
