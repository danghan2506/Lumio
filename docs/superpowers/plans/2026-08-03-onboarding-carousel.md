# Onboarding Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 3-slide interactive onboarding carousel for Lumio using Expo Router, NativeWind, Zustand, and AsyncStorage, navigating to Home on completion.

**Architecture:** A lightweight Zustand store manages `hasSeenOnboarding` state backed by AsyncStorage. The screen `app/onboarding.tsx` renders a paging horizontal `FlatList` with dynamic indicators and brand-themed action buttons. Root layout updates routing dynamically.

**Tech Stack:** Expo Router, React Native, NativeWind / Tailwind CSS, Zustand, AsyncStorage, Jest / React Native Testing Library.

## Global Constraints

- Deep Indigo canvas (`#241B4A`), Lumio Coral primary CTA (`#FF6B57`), Daylight Amber (`#FFB74D`), Mint (`#35D0A0`).
- Display typography: `Fredoka_700Bold`. Body typography: `PlusJakartaSans_400Regular`, `PlusJakartaSans_500Medium`.
- Touch target minimum: 48px height for buttons.
- Routing: `router.replace('/')` when completing or skipping onboarding.

---

### Task 1: Onboarding State Store (`store/useOnboardingStore.ts`)

**Files:**
- Create: `store/useOnboardingStore.ts`
- Test: `__tests__/store/useOnboardingStore.test.ts`

**Interfaces:**
- Consumes: `@react-native-async-storage/async-storage`, `zustand`
- Produces: `useOnboardingStore` with `{ hasSeenOnboarding: boolean, setHasSeenOnboarding: (val: boolean) => void, finishOnboarding: () => Promise<void> }`

- [ ] **Step 1: Write the failing unit test**

Create `__tests__/store/useOnboardingStore.test.ts`:

```typescript
import { useOnboardingStore } from '@/store/useOnboardingStore';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.setState({ hasSeenOnboarding: false });
  });

  it('defaults hasSeenOnboarding to false', () => {
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(false);
  });

  it('updates hasSeenOnboarding state when setHasSeenOnboarding is called', () => {
    useOnboardingStore.getState().setHasSeenOnboarding(true);
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/store/useOnboardingStore.test.ts`  
Expected: FAIL with "Cannot find module '@/store/useOnboardingStore'"

- [ ] **Step 3: Write implementation**

Create `store/useOnboardingStore.ts`:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (value: boolean) => void;
  finishOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (value: boolean) => set({ hasSeenOnboarding: value }),
      finishOnboarding: () => set({ hasSeenOnboarding: true }),
    }),
    {
      name: 'lumio-onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/store/useOnboardingStore.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add store/useOnboardingStore.ts __tests__/store/useOnboardingStore.test.ts
git commit -m "feat: add onboarding zustand store with asyncstorage persistence"
```

---

### Task 2: Onboarding Carousel Screen (`app/onboarding.tsx`)

**Files:**
- Create: `app/onboarding.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `useOnboardingStore` from `store/useOnboardingStore.ts`, `colors` from `@/theme/colors`
- Produces: Onboarding Screen component with 3 slides, skip button, dynamic pagination dots, and CTAs.

- [ ] **Step 1: Create `app/onboarding.tsx`**

Write `app/onboarding.tsx`:

```tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Pressable,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { useOnboardingStore } from '@/store/useOnboardingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideData {
  id: string;
  badge: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  iconSymbol: string;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    badge: 'AI VOICE TUTOR',
    badgeBg: 'rgba(255, 107, 87, 0.15)',
    title: 'Học giao tiếp cùng Lumi',
    subtitle: 'Luyện phản xạ nói tiếng Anh/Tây Ban Nha tự nhiên 24/7 với Trợ lý AI thông minh.',
    iconSymbol: '🔥',
  },
  {
    id: '2',
    badge: 'SPACED REPETITION',
    badgeBg: 'rgba(53, 208, 160, 0.15)',
    title: 'Học từ vựng thông minh',
    subtitle: 'Ghi nhớ từ vựng lâu hơn gấp 5 lần nhờ phương pháp lặp lại ngắt quãng khoa học.',
    iconSymbol: '🧠',
  },
  {
    id: '3',
    badge: 'STREAKS & REWARDS',
    badgeBg: 'rgba(255, 183, 77, 0.15)',
    title: 'Duy trì thói quen & Streak',
    subtitle: 'Tích lũy điểm thưởng, giữ vững thói quen và cảm nhận sự tiến bộ mỗi ngày.',
    iconSymbol: '⚡',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const finishOnboarding = useOnboardingStore((state) => state.finishOnboarding);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleComplete = () => {
    finishOnboarding();
    router.replace('/');
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={{ height: 48, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'flex-end' }}>
        {activeIndex < SLIDES.length - 1 ? (
          <Pressable onPress={handleComplete} hitSlop={12}>
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: colors.slate }}>
              Bỏ qua
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Carousel Body */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center', gap: 24 }}>
            {/* Visual Card Artwork Container */}
            <View
              style={{
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: 'rgba(234, 230, 255, 0.05)',
                borderWidth: 1,
                borderColor: 'rgba(234, 230, 255, 0.12)',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: colors.lumioCoral,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
              }}
            >
              <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: colors.lavenderMist, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 64 }}>{item.iconSymbol}</Text>
              </View>
            </View>

            {/* Badge */}
            <View style={{ backgroundColor: item.badgeBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 }}>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: colors.cream, letterSpacing: 1.2 }}>
                {item.badge}
              </Text>
            </View>

            {/* Content Text */}
            <View style={{ gap: 12, alignItems: 'center' }}>
              <Text
                style={{
                  fontFamily: 'Fredoka_700Bold',
                  fontSize: 28,
                  lineHeight: 34,
                  color: colors.cream,
                  textAlign: 'center',
                  letterSpacing: 0.5,
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_400Regular',
                  fontSize: 16,
                  lineHeight: 24,
                  color: colors.lavenderMist,
                  textAlign: 'center',
                }}
              >
                {item.subtitle}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Pagination & Bottom Action Bar */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 24 }}>
        {/* Pagination Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {SLIDES.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={index}
                style={{
                  height: 8,
                  width: isActive ? 24 : 8,
                  borderRadius: 4,
                  backgroundColor: isActive ? colors.lumioCoral : 'rgba(234, 230, 255, 0.25)',
                }}
              />
            );
          })}
        </View>

        {/* Action Buttons */}
        {activeIndex < SLIDES.length - 1 ? (
          <Pressable
            onPress={handleNext}
            style={{
              backgroundColor: colors.lumioCoral,
              borderRadius: 999,
              minHeight: 52,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: colors.cream }}>
              Tiếp theo
            </Text>
          </Pressable>
        ) : (
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={handleComplete}
              style={{
                backgroundColor: colors.lumioCoral,
                borderRadius: 999,
                minHeight: 52,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: colors.cream }}>
                Bắt đầu ngay
              </Text>
            </Pressable>
            <Pressable
              onPress={handleComplete}
              style={{
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                borderColor: colors.slate,
                borderRadius: 999,
                minHeight: 48,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: colors.cream }}>
                Đã có tài khoản? Đăng nhập
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Update `app/_layout.tsx` to handle onboarding route**

Modify `app/_layout.tsx` to register `onboarding` screen:

```tsx
<Stack
  screenOptions={{
    headerShown: false,
  }}
>
  <Stack.Screen name="index" />
  <Stack.Screen name="onboarding" />
</Stack>
```

- [ ] **Step 3: Test navigation manually**

Verify file syntax and routing without errors.

- [ ] **Step 4: Commit changes**

```bash
git add app/onboarding.tsx app/_layout.tsx
git commit -m "feat: implement 3-slide onboarding carousel screen"
```
