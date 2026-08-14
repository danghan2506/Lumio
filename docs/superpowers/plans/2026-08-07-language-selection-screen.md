# Language Selection Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the interactive Language Selection screen UI for Lumio's onboarding flow, allowing users to select their target learning language with tactile squircle cards and persist their choice.

**Architecture:** Enrich language dataset in `data/languages.ts`, create a reusable `LanguageCard` component, and implement the `(auth)/select-language.tsx` screen using Lumio's design tokens.

**Tech Stack:** React Native, Expo Router, NativeWind / Tailwind CSS, Zustand, TypeScript.

## Global Constraints

- **Canvas Background:** Deep Indigo (`#241B4A`)
- **Primary CTA:** Lumio Coral (`#FF6B57`) full-width pill button (`rounded-full`, minHeight `52px`)
- **Typography:** `Fredoka_700Bold` for screen titles, `PlusJakartaSans_500Medium`/`700Bold` for body and labels, `JetBrainsMono_500Medium` for badges
- **Accessibility:** All pressable cards and buttons must meet minimum 48px/64px tap height
- **Fonts & Imports:** Centralized theme colors from `@/theme/colors`

---

### Task 1: Extend Language Types and Data

**Files:**
- Modify: `types/learning.ts:1-12`
- Modify: `data/languages.ts:1-35`

**Interfaces:**
- Consumes: Existing `Language` and `LanguageId` types.
- Produces: `Language` type with optional `badge` and `learnerCount` fields; enriched dataset in `data/languages.ts`.

- [ ] **Step 1: Update `types/learning.ts` to include optional badge and learner count fields**

```typescript
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

- [ ] **Step 2: Update `data/languages.ts` with enriched language data**

```typescript
import type { Language, LanguageId } from '@/types/learning';

export const languages: Language[] = [
  {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    learnerLanguage: 'vi',
    badge: 'POPULAR',
    learnerCount: '1.2M Learners',
  },
  {
    id: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    learnerLanguage: 'vi',
    learnerCount: '850K Learners',
  },
  {
    id: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    badge: 'POPULAR',
    learnerCount: '620K Learners',
  },
  {
    id: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    learnerLanguage: 'vi',
    learnerCount: '450K Learners',
  },
];

export const LANGUAGE_IDS: LanguageId[] = languages.map((l) => l.id);
```

- [ ] **Step 3: Run TypeScript typecheck to verify interface correctness**

Run: `npm run typecheck`
Expected: PASS with 0 errors.

---

### Task 2: Build Reusable `LanguageCard` Component

**Files:**
- Create: `components/ui/LanguageCard.tsx`

**Interfaces:**
- Consumes: `Language` from `@/types/learning`, `colors` from `@/theme/colors`.
- Produces: `LanguageCard` component accepting `language: Language`, `isSelected: boolean`, `onSelect: () => void`.

- [ ] **Step 1: Create `components/ui/LanguageCard.tsx`**

```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import type { Language } from '@/types/learning';

interface LanguageCardProps {
  language: Language;
  isSelected: boolean;
  onSelect: () => void;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({
  language,
  isSelected,
  onSelect,
}) => {
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`Select ${language.name}`}
      style={{
        backgroundColor: isSelected ? colors.lavenderMist : '#31265E',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderWidth: 2,
        borderColor: isSelected ? colors.lumioCoral : 'rgba(234, 230, 255, 0.12)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 72,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: isSelected ? 'rgba(36, 27, 74, 0.1)' : 'rgba(234, 230, 255, 0.08)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 26 }}>{language.flag}</Text>
        </View>

        <View style={{ gap: 2, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                fontFamily: 'Fredoka_700Bold',
                fontSize: 18,
                color: isSelected ? colors.deepIndigo : colors.cream,
              }}
            >
              {language.name}
            </Text>
            {language.badge ? (
              <View
                style={{
                  backgroundColor: isSelected ? colors.lumioCoral : 'rgba(255, 107, 87, 0.18)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 9999,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans_700Bold',
                    fontSize: 10,
                    color: isSelected ? colors.cream : colors.lumioCoral,
                    letterSpacing: 0.6,
                  }}
                >
                  {language.badge}
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            style={{
              fontFamily: 'PlusJakartaSans_500Medium',
              fontSize: 14,
              color: isSelected ? colors.slate : colors.lavenderMist,
            }}
          >
            {language.nativeName}
            {language.learnerCount ? `  •  ${language.learnerCount}` : ''}
          </Text>
        </View>
      </View>

      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: isSelected ? colors.mint : 'rgba(234, 230, 255, 0.15)',
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 12,
        }}
      >
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_700Bold',
            fontSize: 14,
            color: isSelected ? colors.deepIndigo : 'transparent',
          }}
        >
          ✓
        </Text>
      </View>
    </Pressable>
  );
};
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS with 0 errors.

---

### Task 3: Build Onboarding Language Selection Screen `(auth)/select-language.tsx`

**Files:**
- Create: `app/(auth)/select-language.tsx`

**Interfaces:**
- Consumes: `languages` from `@/data/languages`, `LanguageCard` from `@/components/ui/LanguageCard`.
- Produces: `SelectLanguageScreen` component for Expo Router navigation.

- [ ] **Step 1: Create `app/(auth)/select-language.tsx`**

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { languages } from '@/data/languages';
import { LanguageCard } from '@/components/ui/LanguageCard';
import { images } from '@/constants/images';
import type { LanguageId } from '@/types/learning';

export default function SelectLanguageScreen() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<LanguageId>('en');

  const handleContinue = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" />

      {/* Top Header Navigation */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingVertical: 14,
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(255, 183, 77, 0.15)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: colors.daylightAmber,
          }}
        >
          <Text
            style={{
              fontFamily: 'JetBrainsMono_500Medium',
              fontSize: 12,
              color: colors.daylightAmber,
            }}
          >
            STEP 1 OF 3
          </Text>
        </View>

        <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={12}>
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              fontSize: 14,
              color: colors.slate,
            }}
          >
            Skip
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 32,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot Banner */}
        <View
          style={{
            backgroundColor: '#31265E',
            borderRadius: 24,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            borderWidth: 1,
            borderColor: 'rgba(234, 230, 255, 0.15)',
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: colors.lumioCoral,
            }}
          >
            <Image
              source={images.mascot}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                fontFamily: 'Fredoka_700Bold',
                fontSize: 20,
                lineHeight: 26,
                color: colors.cream,
              }}
            >
              What language would you like to learn?
            </Text>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_400Regular',
                fontSize: 13,
                color: colors.lavenderMist,
              }}
            >
              Choose a language to light up your daily practice with Lumi.
            </Text>
          </View>
        </View>

        {/* Card Options */}
        <View style={{ gap: 14 }}>
          {languages.map((lang) => (
            <LanguageCard
              key={lang.id}
              language={lang}
              isSelected={selectedLang === lang.id}
              onSelect={() => setSelectedLang(lang.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA Bar */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 24,
          paddingTop: 12,
          backgroundColor: colors.deepIndigo,
          borderTopWidth: 1,
          borderTopColor: 'rgba(234, 230, 255, 0.08)',
        }}
      >
        <Pressable
          onPress={handleContinue}
          style={{
            backgroundColor: colors.lumioCoral,
            borderRadius: 9999,
            minHeight: 54,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_700Bold',
              fontSize: 17,
              color: colors.cream,
            }}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Run typecheck verification**

Run: `npm run typecheck`
Expected: PASS with 0 errors.
