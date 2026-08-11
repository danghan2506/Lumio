# Home Screen UI & Data Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the beginner-friendly Lumio Home Screen UI integrated with Zustand (`useLanguageStore`) & AsyncStorage for selected language management, and Supabase Auth (`useAuth`) for user data.

**Architecture:** Modular React Native components styled with NativeWind v5, connected to `useLanguageStore` (AsyncStorage persistent store) and `useAuth` (Supabase session), composed into `app/(tabs)/index.tsx`.

**Tech Stack:** React Native, Expo Router, TypeScript, NativeWind v5, `@expo/vector-icons`, Zustand + AsyncStorage, Supabase Auth, Jest.

## Global Constraints

- Primary Brand Accent: Lumio Coral (`#FF6B57`)
- Dark Surface Accent: Deep Indigo (`#241B4A`)
- Canvas Background: Warm Cream (`#FFFBF4`)
- Reward/Streak Accent: Daylight Amber (`#FFB74D`)
- Success Accent: Mint Green (`#35D0A0`)
- State Management: `useLanguageStore` for selected language (AsyncStorage), `useAuth` for Supabase user session.
- Styling: NativeWind v5 (`className`), except for `SafeAreaView` which MUST use inline `style={{ flex: 1, backgroundColor: '#FFFBF4' }}`.
- Strict TypeScript: No `any`.

---

### Task 1: Home Types & State Selectors

**Files:**
- Create: `types/home.ts`
- Modify: `data/homeData.ts`
- Test: `__tests__/data/homeData.test.ts`

**Interfaces:**
- Produces: `DailyGoalData`, `HeroCourseData`, `DailyPlanItem`, `HomeData`

- [ ] **Step 1: Write failing unit test for homeData**

```typescript
// __tests__/data/homeData.test.ts
import { HOME_DATA } from '@/data/homeData';

describe('Home Data', () => {
  it('provides default fallback data for home screen', () => {
    expect(HOME_DATA.streak).toBe(12);
    expect(HOME_DATA.dailyGoal.currentXp).toBe(15);
    expect(HOME_DATA.todaysPlan.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test __tests__/data/homeData.test.ts`  
Expected: FAIL

- [ ] **Step 3: Define types in `types/home.ts`**

```typescript
// types/home.ts
import { LanguageId } from '@/types/learning';

export type PlanItemType = 'lesson' | 'ai_conversation' | 'vocabulary';

export interface DailyPlanItem {
  id: string;
  type: PlanItemType;
  title: string;
  subtitle: string;
  completed: boolean;
  active: boolean;
  lessonId?: string;
}

export interface DailyGoalData {
  currentXp: number;
  targetXp: number;
}

export interface HomeData {
  streak: number;
  dailyGoal: DailyGoalData;
  todaysPlan: DailyPlanItem[];
}
```

- [ ] **Step 4: Create `data/homeData.ts`**

```typescript
// data/homeData.ts
import { HomeData } from '@/types/home';

export const HOME_DATA: HomeData = {
  streak: 12,
  dailyGoal: {
    currentXp: 15,
    targetXp: 20,
  },
  todaysPlan: [
    {
      id: 'plan-1',
      type: 'lesson',
      title: 'Lesson: At the café',
      subtitle: 'Order coffee and pastries',
      completed: true,
      active: false,
      lessonId: 'cafe-1',
    },
    {
      id: 'plan-2',
      type: 'ai_conversation',
      title: 'AI Conversation: Talk about your day',
      subtitle: '3-min voice chat with Lumio',
      completed: false,
      active: true,
    },
    {
      id: 'plan-3',
      type: 'vocabulary',
      title: 'New words: 10 words review',
      subtitle: 'Flashcard practice',
      completed: false,
      active: false,
    },
  ],
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test __tests__/data/homeData.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add types/home.ts data/homeData.ts __tests__/data/homeData.test.ts
git commit -m "feat(home): define home screen types and fallback data"
```

---

### Task 2: HeaderBar Component (Zustand & Auth Integration)

**Files:**
- Create: `components/home/HeaderBar.tsx`
- Test: `__tests__/components/home/HeaderBar.test.tsx`

**Interfaces:**
- Consumes: `userName` string, `languageFlag` string, `languageName` string, `streak` number
- Produces: `HeaderBar` component

- [ ] **Step 1: Write failing unit test for HeaderBar**

```typescript
// __tests__/components/home/HeaderBar.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { HeaderBar } from '@/components/home/HeaderBar';

describe('HeaderBar', () => {
  it('renders flag, personalized greeting, and streak flame', () => {
    const { getByText } = render(
      <HeaderBar
        userName="Alex"
        languageFlag="🇪🇸"
        languageName="Spanish"
        streak={12}
      />
    );
    expect(getByText(/Hola, Alex!/i)).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test __tests__/components/home/HeaderBar.test.tsx`  
Expected: FAIL

- [ ] **Step 3: Implement `components/home/HeaderBar.tsx`**

```typescript
// components/home/HeaderBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderBarProps {
  userName: string;
  languageFlag: string;
  languageName: string;
  streak: number;
  onLanguagePress?: () => void;
  onNotificationPress?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  userName,
  languageFlag,
  languageName,
  streak,
  onLanguagePress,
  onNotificationPress,
}) => {
  // Determine greeting based on language
  const getGreetingPrefix = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'spanish':
      case 'español':
        return 'Hola';
      case 'french':
      case 'français':
        return 'Bonjour';
      case 'korean':
      case '한국어':
        return '안녕';
      default:
        return 'Hello';
    }
  };

  const greeting = `${getGreetingPrefix(languageName)}, ${userName}! 👋`;

  return (
    <View className="flex-row items-center justify-between px-6 py-4 bg-[#FFFBF4]">
      {/* Language Badge & User Greeting */}
      <TouchableOpacity
        onPress={onLanguagePress}
        className="flex-row items-center space-x-2"
      >
        <Text className="text-2xl mr-1">{languageFlag}</Text>
        <Text className="text-[#241B4A] font-bold text-xl">{greeting}</Text>
      </TouchableOpacity>

      {/* Right Controls */}
      <View className="flex-row items-center space-x-3">
        {/* Streak Flame Badge */}
        <View className="flex-row items-center bg-[#FFB74D]/20 px-3 py-1.5 rounded-full border border-[#FFB74D]/40">
          <Ionicons name="flame" size={18} color="#FFB74D" />
          <Text className="text-[#241B4A] font-bold text-sm ml-1">{streak}</Text>
        </View>

        {/* Notification Bell */}
        <TouchableOpacity
          onPress={onNotificationPress}
          className="w-10 h-10 rounded-full bg-[#EAE6FF]/60 items-center justify-center border border-[#5E5A80]/15"
        >
          <Ionicons name="notifications-outline" size={20} color="#241B4A" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test __tests__/components/home/HeaderBar.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/home/HeaderBar.tsx __tests__/components/home/HeaderBar.test.tsx
git commit -m "feat(home): add HeaderBar component with language and user data integration"
```

---

### Task 3: DailyGoalCard Component

**Files:**
- Create: `components/home/DailyGoalCard.tsx`
- Test: `__tests__/components/home/DailyGoalCard.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/components/home/DailyGoalCard.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { DailyGoalCard } from '@/components/home/DailyGoalCard';

describe('DailyGoalCard', () => {
  it('renders current and target XP', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={15} targetXp={20} />
    );
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
    expect(getByText('/ 20 XP')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test & verify failure**
- [ ] **Step 3: Implement `components/home/DailyGoalCard.tsx`**
- [ ] **Step 4: Run test & verify pass**
- [ ] **Step 5: Commit**

---

### Task 4: HeroContinueCard Component

**Files:**
- Create: `components/home/HeroContinueCard.tsx`
- Test: `__tests__/components/home/HeroContinueCard.test.tsx`

- [ ] **Step 1: Write failing test**
- [ ] **Step 2: Run test & verify failure**
- [ ] **Step 3: Implement `components/home/HeroContinueCard.tsx`**
- [ ] **Step 4: Run test & verify pass**
- [ ] **Step 5: Commit**

---

### Task 5: TodaysPlanList & AiVideoHighlightCard Components

**Files:**
- Create: `components/home/TodaysPlanList.tsx`
- Create: `components/home/AiVideoHighlightCard.tsx`
- Test: `__tests__/components/home/TodaysPlanList.test.tsx`

- [ ] **Step 1: Write failing test**
- [ ] **Step 2: Run test & verify failure**
- [ ] **Step 3: Implement `components/home/TodaysPlanList.tsx` and `AiVideoHighlightCard.tsx`**
- [ ] **Step 4: Run test & verify pass**
- [ ] **Step 5: Commit**

---

### Task 6: HomeScreen Data Hook Wiring (`app/(tabs)/index.tsx`)

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Test: `__tests__/screens/HomeScreen.test.tsx`

- [ ] **Step 1: Write failing screen test**

```typescript
// __tests__/screens/HomeScreen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)/index';

describe('HomeScreen Data Wiring', () => {
  it('connects to useLanguageStore and displays selected language', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Daily goal')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test __tests__/screens/HomeScreen.test.tsx`  
Expected: FAIL

- [ ] **Step 3: Update `app/(tabs)/index.tsx` connecting `useLanguageStore` & `useAuth`**

```typescript
// app/(tabs)/index.tsx
import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { HeaderBar } from '@/components/home/HeaderBar';
import { DailyGoalCard } from '@/components/home/DailyGoalCard';
import { HeroContinueCard } from '@/components/home/HeroContinueCard';
import { TodaysPlanList } from '@/components/home/TodaysPlanList';
import { AiVideoHighlightCard } from '@/components/home/AiVideoHighlightCard';
import { HOME_DATA } from '@/data/homeData';
import { languages } from '@/data/languages';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuth } from '@/hooks/useAuth';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedLanguage } = useLanguageStore();

  // Selected language from Zustand & AsyncStorage (default: Spanish 'es')
  const currentLanguage =
    languages.find((l) => l.id === selectedLanguage) ??
    languages.find((l) => l.id === 'es')!;

  // User display name from Supabase session user metadata
  const userName =
    user?.user_metadata?.full_name?.split(' ')[0] ??
    user?.user_metadata?.name?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'Alex';

  const handleStartAiCall = () => {
    router.push('/(tabs)/ai-teacher');
  };

  const handleContinueLesson = () => {
    router.push('/lesson/cafe-1' as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF4' }}>
      <HeaderBar
        userName={userName}
        languageFlag={currentLanguage.flag}
        languageName={currentLanguage.name}
        streak={HOME_DATA.streak}
        onLanguagePress={() => router.push('/(tabs)/learn')}
        onNotificationPress={() => {}}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <DailyGoalCard
          currentXp={HOME_DATA.dailyGoal.currentXp}
          targetXp={HOME_DATA.dailyGoal.targetXp}
        />

        <HeroContinueCard
          language={currentLanguage.name}
          level="A1"
          unitTitle="Unit 2"
          onContinue={handleContinueLesson}
        />

        <TodaysPlanList
          items={HOME_DATA.todaysPlan}
          onItemPress={(item) => {
            if (item.type === 'ai_conversation') {
              handleStartAiCall();
            } else if (item.lessonId) {
              router.push(`/lesson/${item.lessonId}` as any);
            }
          }}
          onViewAll={() => router.push('/(tabs)/learn')}
        />

        <AiVideoHighlightCard onStartCall={handleStartAiCall} />
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test __tests__/screens/HomeScreen.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/index.tsx __tests__/screens/HomeScreen.test.tsx
git commit -m "feat(home): connect HomeScreen to Zustand selectedLanguage and Supabase Auth session"
```

---
