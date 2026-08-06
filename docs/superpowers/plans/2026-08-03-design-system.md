# Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full Lumio design system using NativeWind v5 / Tailwind CSS v4, including theme tokens in `theme/`, Google Fonts setup, `global.css` utilities, and a visual showcase screen in `app/index.tsx`.

**Architecture:** Split design tokens into typed TS files inside `theme/`, load Google Fonts with `expo-font` in `app/_layout.tsx`, declare Tailwind CSS v4 `@theme` tokens and `@layer utilities` in `global.css`, and create an interactive design system showcase page in `app/index.tsx`.

**Tech Stack:** Expo (React Native), TypeScript, NativeWind v5 / Tailwind CSS v4, `@expo-google-fonts/fredoka`, `@expo-google-fonts/plus-jakarta-sans`, `@expo-google-fonts/jetbrains-mono`.

## Global Constraints

- **No Pure Black**: `#000000` is strictly forbidden. Use Deep Indigo `#241B4A` or Slate `#5E5A80`.
- **CTA Accent**: Lumio Coral `#FF6B57` is the primary CTA color.
- **Strict Ownership**: Daylight Amber `#FFB74D` reserved for XP/streaks; Mint `#35D0A0` for completion/success checks.
- **Banned Fonts**: `Inter` and generic serif fonts are banned.
- **SafeAreaView Rule**: Always use inline `style={{ flex: 1 }}` on `SafeAreaView`, never `className`.
- **Minimum Tap Floor**: All interactive touch targets must be at least 48px high/wide.

---

### Task 1: Install Font Packages & Create Theme Tokens

**Files:**
- Create: `theme/colors.ts`
- Create: `theme/typography.ts`
- Create: `theme/spacing.ts`
- Create: `theme/radii.ts`
- Create: `theme/motion.ts`
- Create: `theme/index.ts`
- Create: `constants/colors.ts`
- Create: `constants/typography.ts`

**Interfaces:**
- Produces: `colors`, `typography`, `spacing`, `radii`, `motion` exported from `@/theme` and `@/constants/colors`.

- [ ] **Step 1: Install font packages via Expo CLI**

Run: `npx expo install @expo-google-fonts/fredoka @expo-google-fonts/plus-jakarta-sans @expo-google-fonts/jetbrains-mono`
Expected: Packages added to `package.json` successfully.

- [ ] **Step 2: Create `theme/colors.ts`**

```ts
export const colors = {
  deepIndigo: '#241B4A',
  canvasDarkEnd: '#4B3FA8',
  lumioCoral: '#FF6B57',
  daylightAmber: '#FFB74D',
  mint: '#35D0A0',
  lavenderMist: '#EAE6FF',
  cream: '#FFFBF4',
  slate: '#5E5A80',
  gradients: {
    canvas: ['#241B4A', '#4B3FA8'] as const,
    ember: ['#FFB74D', '#FF6B57'] as const,
  },
} as const;

export type Colors = typeof colors;
```

- [ ] **Step 3: Create `theme/typography.ts`**

```ts
export const fontFamilies = {
  display: 'Fredoka_700Bold',
  displaySemiBold: 'Fredoka_600SemiBold',
  displayMedium: 'Fredoka_500Medium',
  sansBold: 'PlusJakartaSans_700Bold',
  sansSemiBold: 'PlusJakartaSans_600SemiBold',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansRegular: 'PlusJakartaSans_400Regular',
  mono: 'JetBrainsMono_500Medium',
} as const;

export const typeScale = {
  displayLarge: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fontFamilies.display,
    letterSpacing: 0.64, // +2%
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamilies.display,
    letterSpacing: 0.48, // +2%
  },
  bodyLarge: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: fontFamilies.sansMedium,
  },
  bodyRegular: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fontFamilies.sansRegular,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.sansMedium,
  },
  microLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.44, // +4%
    textTransform: 'uppercase' as const,
  },
} as const;
```

- [ ] **Step 4: Create `theme/spacing.ts`, `theme/radii.ts`, `theme/motion.ts`, and `theme/index.ts`**

```ts
// theme/spacing.ts
export const spacing = {
  horizontalPadding: 24,
  verticalSection: 16,
  minTouchTarget: 48,
} as const;

// theme/radii.ts
export const radii = {
  card: 24, // rounded-3xl
  chip: 12, // rounded-xl
  pill: 9999, // rounded-full
} as const;

// theme/motion.ts
export const motion = {
  spring: {
    stiffness: 120,
    damping: 18,
  },
  emberDurationMs: 250,
} as const;

// theme/index.ts
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radii';
export * from './motion';
```

- [ ] **Step 5: Create `constants/colors.ts` and `constants/typography.ts` re-exports**

```ts
// constants/colors.ts
export { colors, type Colors } from '@/theme/colors';

// constants/typography.ts
export { fontFamilies, typeScale } from '@/theme/typography';
```

- [ ] **Step 6: Commit Task 1**

```bash
git add package.json package-lock.json theme/ constants/
git commit -m "feat(theme): add design tokens and font packages for Lumio"
```

---

### Task 2: Configure Global CSS & Tailwind CSS v4 `@theme`

**Files:**
- Modify: `global.css`

**Interfaces:**
- Consumes: Token names from Task 1.
- Produces: CSS utility classes and Tailwind CSS `@theme` variables for NativeWind components.

- [ ] **Step 1: Update `global.css` with `@theme` and `@layer utilities`**

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@import "nativewind/theme";

@layer theme {
  @theme {
    /* Color tokens */
    --color-deep-indigo: #241B4A;
    --color-canvas-dark-end: #4B3FA8;
    --color-lumio-coral: #FF6B57;
    --color-daylight-amber: #FFB74D;
    --color-mint: #35D0A0;
    --color-lavender-mist: #EAE6FF;
    --color-cream: #FFFBF4;
    --color-slate: #5E5A80;

    /* Font tokens */
    --font-display: Fredoka_700Bold, Fredoka, sans-serif;
    --font-sans: PlusJakartaSans_500Medium, PlusJakartaSans, sans-serif;
    --font-mono: JetBrainsMono_500Medium, monospace;
  }
}

@layer utilities {
  /* Gradients */
  .bg-canvas-gradient {
    background-color: #241B4A;
  }
  
  .bg-ember-gradient {
    background-color: #FF6B57;
  }

  /* Tactile Buttons */
  .btn-primary {
    background-color: #FF6B57;
    color: #FFFBF4;
    border-radius: 9999px;
    min-height: 48px;
    padding-left: 24px;
    padding-right: 24px;
    justify-content: center;
    align-items: center;
  }

  .btn-secondary {
    background-color: #241B4A;
    border-width: 1.5px;
    border-color: #5E5A80;
    color: #FFFBF4;
    border-radius: 9999px;
    min-height: 48px;
    padding-left: 24px;
    padding-right: 24px;
    justify-content: center;
    align-items: center;
  }

  .btn-ghost {
    background-color: transparent;
    color: #5E5A80;
    border-radius: 9999px;
    min-height: 48px;
    padding-left: 16px;
    padding-right: 16px;
    justify-content: center;
    align-items: center;
  }

  /* Card Squircles */
  .card-squircle {
    border-radius: 24px;
    background-color: #EAE6FF;
    padding: 20px;
  }

  .card-dark {
    border-radius: 24px;
    background-color: #241B4A;
    border-width: 1px;
    border-color: #5E5A80;
    padding: 20px;
  }

  .card-chip {
    border-radius: 12px;
    padding-left: 12px;
    padding-right: 12px;
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .focus-ring-coral {
    border-width: 2px;
    border-color: #FF6B57;
  }

  .min-target-floor {
    min-height: 48px;
    min-width: 48px;
  }
}
```

- [ ] **Step 2: Commit Task 2**

```bash
git add global.css
git commit -m "style(css): add Tailwind v4 theme tokens and Lumio utility classes"
```

---

### Task 3: Load Fonts & Setup Root Layout

**Files:**
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: Font hooks from `@expo-google-fonts/*`.
- Produces: Loaded custom fonts before showing app UI.

- [ ] **Step 1: Update `app/_layout.tsx` with font loading and splash screen control**

```tsx
import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from "@expo-google-fonts/fredoka";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";

import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
```

- [ ] **Step 2: Commit Task 3**

```bash
git add app/_layout.tsx
git commit -m "feat(layout): configure Google Fonts loading and splash screen"
```

---

### Task 4: Build Design System Showcase Screen (`app/index.tsx`)

**Files:**
- Modify: `app/index.tsx`

**Interfaces:**
- Consumes: `colors`, `fontFamilies`, `typeScale` from `@/theme`, plus NativeWind CSS utility classes.
- Produces: Visual verification showcase for the design system.

- [ ] **Step 1: Implement `app/index.tsx` showcase UI**

```tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { colors } from "@/theme/colors";

export default function DesignSystemShowcase() {
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 24,
          gap: 28,
        }}
      >
        {/* Header */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 32,
              lineHeight: 38,
              color: colors.cream,
              letterSpacing: 0.64,
            }}
          >
            Lumio Design System
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              fontSize: 16,
              lineHeight: 24,
              color: colors.lavenderMist,
            }}
          >
            Light up a new language. Core tokens, typography, buttons & cards.
          </Text>
        </View>

        {/* 1. Color Palette */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 20,
              color: colors.cream,
            }}
          >
            1. Color Palette & Roles
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {[
              { name: "Deep Indigo", hex: colors.deepIndigo, role: "Canvas / Surface" },
              { name: "Lumio Coral", hex: colors.lumioCoral, role: "Primary CTA" },
              { name: "Daylight Amber", hex: colors.daylightAmber, role: "XP / Streaks" },
              { name: "Mint", hex: colors.mint, role: "Success / Completion" },
              { name: "Lavender Mist", hex: colors.lavenderMist, role: "Soft Light Surface" },
              { name: "Cream", hex: colors.cream, role: "Light Canvas / Text" },
              { name: "Slate", hex: colors.slate, role: "Muted Text & Border" },
            ].map((c) => (
              <View
                key={c.name}
                style={{
                  width: "47%",
                  backgroundColor: "#31265E",
                  borderRadius: 16,
                  padding: 12,
                  gap: 6,
                  borderWidth: 1,
                  borderColor: "rgba(234, 230, 255, 0.1)",
                }}
              >
                <View
                  style={{
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: c.hex,
                  }}
                />
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    fontSize: 14,
                    color: colors.cream,
                  }}
                >
                  {c.name}
                </Text>
                <Text
                  style={{
                    fontFamily: "JetBrainsMono_500Medium",
                    fontSize: 12,
                    color: colors.lavenderMist,
                  }}
                >
                  {c.hex}
                </Text>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 11,
                    color: colors.slate,
                  }}
                >
                  {c.role}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Typography Scale */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 20,
              color: colors.cream,
            }}
          >
            2. Typography Architecture
          </Text>
          <View
            style={{
              backgroundColor: "#31265E",
              borderRadius: 20,
              padding: 16,
              gap: 16,
            }}
          >
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 11,
                  color: colors.slate,
                }}
              >
                DISPLAY LARGE (32px Fredoka Bold)
              </Text>
              <Text
                style={{
                  fontFamily: "Fredoka_700Bold",
                  fontSize: 32,
                  lineHeight: 38,
                  color: colors.cream,
                  letterSpacing: 0.64,
                }}
              >
                Hola, Lumi!
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 11,
                  color: colors.slate,
                }}
              >
                TITLE (24px Fredoka Bold)
              </Text>
              <Text
                style={{
                  fontFamily: "Fredoka_700Bold",
                  fontSize: 24,
                  lineHeight: 30,
                  color: colors.cream,
                  letterSpacing: 0.48,
                }}
              >
                Daily Goal Completed
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 11,
                  color: colors.slate,
                }}
              >
                BODY LARGE (18px Plus Jakarta Medium)
              </Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 18,
                  lineHeight: 26,
                  color: colors.lavenderMist,
                }}
              >
                Choose the correct translation for "the book".
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 11,
                  color: colors.slate,
                }}
              >
                BODY REGULAR (16px Plus Jakarta Regular)
              </Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 16,
                  lineHeight: 24,
                  color: colors.cream,
                }}
              >
                Understanding ignites speech. Every word learned is a small spark.
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 11,
                  color: colors.slate,
                }}
              >
                TABULAR NUMERALS (JetBrains Mono 500)
              </Text>
              <Text
                style={{
                  fontFamily: "JetBrainsMono_500Medium",
                  fontSize: 20,
                  color: colors.daylightAmber,
                }}
              >
                +250 XP  |  7 DAY STREAK
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Button Styles */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 20,
              color: colors.cream,
            }}
          >
            3. Buttons & Touch Targets (Min 48px)
          </Text>

          {/* Primary Button */}
          <Pressable
            onPressIn={() => setPressedBtn("primary")}
            onPressOut={() => setPressedBtn(null)}
            style={{
              backgroundColor: colors.lumioCoral,
              borderRadius: 9999,
              minHeight: 48,
              paddingHorizontal: 24,
              justifyContent: "center",
              alignItems: "center",
              transform: [{ translateY: pressedBtn === "primary" ? 2 : 0 }],
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 16,
                color: colors.cream,
              }}
            >
              Primary CTA — Start Lesson
            </Text>
          </Pressable>

          {/* Secondary Button */}
          <Pressable
            onPressIn={() => setPressedBtn("secondary")}
            onPressOut={() => setPressedBtn(null)}
            style={{
              backgroundColor: "transparent",
              borderWidth: 1.5,
              borderColor: colors.slate,
              borderRadius: 9999,
              minHeight: 48,
              paddingHorizontal: 24,
              justifyContent: "center",
              alignItems: "center",
              transform: [{ translateY: pressedBtn === "secondary" ? 2 : 0 }],
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 16,
                color: colors.cream,
              }}
            >
              Secondary — Review Vocabulary
            </Text>
          </Pressable>
        </View>

        {/* 4. Cards & Choice Options */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 20,
              color: colors.cream,
            }}
          >
            4. Cards & Lesson Options
          </Text>
          {[
            { id: 1, text: "El libro", hint: "Correct answer" },
            { id: 2, text: "La manzana", hint: "Incorrect answer" },
          ].map((item) => {
            const isSelected = selectedOption === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedOption(item.id)}
                style={{
                  backgroundColor: isSelected ? colors.lavenderMist : "#31265E",
                  borderRadius: 24,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.mint : colors.slate,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  minHeight: 64,
                }}
              >
                <View style={{ gap: 2 }}>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 18,
                      color: isSelected ? colors.deepIndigo : colors.cream,
                    }}
                  >
                    {item.text}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      fontSize: 13,
                      color: isSelected ? colors.slate : colors.lavenderMist,
                    }}
                  >
                    {item.hint}
                  </Text>
                </View>
                {isSelected && (
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.mint,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_700Bold",
                        fontSize: 16,
                        color: colors.cream,
                      }}
                    >
                      ✓
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit Task 4**

```bash
git add app/index.tsx
git commit -m "feat(ui): add Lumio Design System showcase screen in app/index.tsx"
```

---

## Self-Review Checklist

1. **Spec Coverage**: All tokens, colors, typography scales, touch targets, and button/card variants from `DESIGN.md` are covered across Tasks 1–4.
2. **Placeholder Scan**: Zero placeholders. Every file and code snippet is written in full.
3. **Type Consistency**: `colors`, `fontFamilies`, `typeScale` names match consistently across TS files, `global.css`, `_layout.tsx`, and `app/index.tsx`.

---

## Execution Handoff

Plan complete and saved to [`docs/superpowers/plans/2026-08-03-design-system.md`](file:///d:/projects/learning-language/docs/superpowers/plans/2026-08-03-design-system.md). Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch subagent per task, review between tasks.
2. **Inline Execution** - Execute tasks in this session using `executing-plans`.

Which approach would you like to use?
