# Vocabulary Vault List UI/UX Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize the Vocabulary Vault screen by condensing list rows to a compact single-line layout (~54px), refactoring the hero section into a slim horizontal banner (~85px), and presenting full word details (definitions, examples, SRS stats, practice) inside a slide-up bottom sheet modal.

**Architecture:** 
- `VocabularyListItem.tsx` is refactored from an expanded card into a lightweight compact row rendering only `word`, `pronunciation`, a mini `status` badge, and a `chevron-forward` indicator.
- `WordDetailBottomSheet.tsx` is created as a dedicated modal presenting contextual details (`translation`, `exampleSentence`, `exampleTranslation`, SRS intervals, and a "Practice This Word" CTA).
- `VocabularyHeroCard.tsx` is streamlined into a horizontal card grouping queue counters and review actions.
- `app/(tabs)/vocabulary.tsx` coordinates `selectedWord` state to toggle the bottom sheet.

**Tech Stack:** React Native, Expo, NativeWind, TypeScript, Jest, `@testing-library/react-native`.

## Global Constraints
- Zero external dependencies: no audio/TTS libraries added.
- Zero database changes: strictly use existing `VocabularyWithProgress` properties.
- English-first content: definitions and example translations are in English.
- Maintain strict TypeScript and lint compliance (`npm run typecheck`, `npm run lint`).

---

### Task 1: Refactor `VocabularyListItem` into a Compact Row and Update Tests

**Files:**
- Modify: `components/vocabulary/VocabularyListItem.tsx`
- Test: `__tests__/components/vocabulary/VocabularyListItem.test.tsx`

**Interfaces:**
- Consumes: `VocabularyWithProgress` from `types/vocabulary.ts`.
- Produces: `VocabularyListItem({ item, onPress }): React.FC<VocabularyListItemProps>` rendering a compact ~54px row.

- [ ] **Step 1: Write the failing test for compact `VocabularyListItem`**

Update `__tests__/components/vocabulary/VocabularyListItem.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VocabularyListItem } from '@/components/vocabulary/VocabularyListItem';
import type { VocabularyWithProgress } from '@/types/vocabulary';

const mockItem: VocabularyWithProgress = {
  id: 'v-1',
  lessonId: 'l-1',
  word: 'Enthusiastic',
  translation: 'Eager and enthusiastic',
  pronunciation: '/ɪnˌθjuːziˈæstɪk/',
  exampleSentence: 'She is enthusiastic about learning.',
  exampleTranslation: 'She is very enthusiastic about learning.',
  status: 'learning',
  correctCount: 2,
  incorrectCount: 0,
  repetitions: 2,
  easeFactor: 2.5,
  intervalDays: 3,
  dueAt: '2026-08-22T00:00:00Z',
  lastReviewedAt: '2026-08-19T00:00:00Z',
};

describe('VocabularyListItem', () => {
  it('renders word, pronunciation, and status badge without inlining example sentences', () => {
    const { getByText, queryByText } = render(<VocabularyListItem item={mockItem} />);

    expect(getByText('Enthusiastic')).toBeTruthy();
    expect(getByText('/ɪnˌθjuːziˈæstɪk/')).toBeTruthy();
    expect(getByText('Learning')).toBeTruthy();

    // Verify example sentence is NOT rendered inline in the compact list row
    expect(queryByText('She is enthusiastic about learning.')).toBeNull();
  });

  it('calls onPress when clicked', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <VocabularyListItem item={mockItem} onPress={mockOnPress} />
    );

    const itemPressable = getByTestId(`vocab-item-${mockItem.id}`);
    fireEvent.press(itemPressable);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test __tests__/components/vocabulary/VocabularyListItem.test.tsx`
Expected: FAIL because `queryByText('She is enthusiastic about learning.')` finds the element in the old implementation.

- [ ] **Step 3: Implement minimal compact `VocabularyListItem.tsx`**

Replace `components/vocabulary/VocabularyListItem.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import type { VocabularyWithProgress } from '@/types/vocabulary';

export interface VocabularyListItemProps {
  item: VocabularyWithProgress;
  onPress?: () => void;
}

export const VocabularyListItem: React.FC<VocabularyListItemProps> = ({ item, onPress }) => {
  const renderStatusBadge = () => {
    switch (item.status) {
      case 'mastered':
        return (
          <View className="px-2 py-0.5 rounded-full bg-mint/15 border border-mint/30">
            <Text className="text-mint font-sans-bold text-[11px]">Mastered</Text>
          </View>
        );
      case 'learning':
        return (
          <View className="px-2 py-0.5 rounded-full bg-daylight-amber/15 border border-daylight-amber/30">
            <Text className="text-daylight-amber font-sans-bold text-[11px]">Learning</Text>
          </View>
        );
      default:
        return (
          <View className="px-2 py-0.5 rounded-full bg-slate/10 border border-slate/20">
            <Text className="text-slate font-sans-medium text-[11px]">Unseen</Text>
          </View>
        );
    }
  };

  return (
    <Pressable
      testID={`vocab-item-${item.id}`}
      onPress={onPress}
      disabled={!onPress}
      className="bg-white rounded-2xl px-4 py-3 border border-lavender-mist mb-2.5 shadow-sm flex-row items-center justify-between active:bg-lavender-mist/20"
    >
      <View className="flex-row items-baseline flex-1 mr-2">
        <Text
          style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
          className="text-base"
        >
          {item.word}
        </Text>
        {Boolean(item.pronunciation) && (
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
            className="text-xs ml-2"
          >
            {item.pronunciation}
          </Text>
        )}
      </View>

      <View className="flex-row items-center">
        {renderStatusBadge()}
        <Ionicons
          name="chevron-forward"
          size={14}
          color={colors.slate}
          style={{ opacity: 0.6, marginLeft: 6 }}
        />
      </View>
    </Pressable>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test __tests__/components/vocabulary/VocabularyListItem.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/vocabulary/VocabularyListItem.tsx __tests__/components/vocabulary/VocabularyListItem.test.tsx
git commit -m "refactor(vocabulary): condense VocabularyListItem into compact row"
```

---

### Task 2: Implement `WordDetailBottomSheet` Component and Tests

**Files:**
- Create: `components/vocabulary/WordDetailBottomSheet.tsx`
- Test: `__tests__/components/vocabulary/WordDetailBottomSheet.test.tsx`

**Interfaces:**
- Consumes: `VocabularyWithProgress` from `types/vocabulary.ts`.
- Produces: `WordDetailBottomSheet({ visible, item, onClose, onPractice }): React.FC<WordDetailBottomSheetProps>`

- [ ] **Step 1: Write the failing test for `WordDetailBottomSheet`**

Create `__tests__/components/vocabulary/WordDetailBottomSheet.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WordDetailBottomSheet } from '@/components/vocabulary/WordDetailBottomSheet';
import type { VocabularyWithProgress } from '@/types/vocabulary';

const mockItem: VocabularyWithProgress = {
  id: 'v-101',
  lessonId: 'l-1',
  word: 'Resilience',
  translation: 'Ability to recover quickly',
  pronunciation: '/rɪˈzɪl.jəns/',
  exampleSentence: 'She showed great resilience in overcoming hardship.',
  exampleTranslation: 'She demonstrated strong ability to recover.',
  status: 'learning',
  correctCount: 4,
  incorrectCount: 1,
  repetitions: 3,
  easeFactor: 2.5,
  intervalDays: 6,
  dueAt: '2026-08-25T00:00:00Z',
  lastReviewedAt: '2026-08-19T00:00:00Z',
};

describe('WordDetailBottomSheet', () => {
  it('renders nothing visible when visible=false or item is null', () => {
    const { queryByText } = render(
      <WordDetailBottomSheet
        visible={false}
        item={mockItem}
        onClose={jest.fn()}
        onPractice={jest.fn()}
      />
    );
    expect(queryByText('Resilience')).toBeNull();
  });

  it('renders word details, translation, examples, and SRS progress when visible', () => {
    const { getByText } = render(
      <WordDetailBottomSheet
        visible={true}
        item={mockItem}
        onClose={jest.fn()}
        onPractice={jest.fn()}
      />
    );

    expect(getByText('Resilience')).toBeTruthy();
    expect(getByText('/rɪˈzɪl.jəns/')).toBeTruthy();
    expect(getByText('Ability to recover quickly')).toBeTruthy();
    expect(getByText('She showed great resilience in overcoming hardship.')).toBeTruthy();
    expect(getByText('She demonstrated strong ability to recover.')).toBeTruthy();
    expect(getByText('Learning')).toBeTruthy();
    expect(getByText(/6d interval/i)).toBeTruthy();
  });

  it('calls onClose when close button or backdrop is clicked', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <WordDetailBottomSheet
        visible={true}
        item={mockItem}
        onClose={onClose}
        onPractice={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('close-detail-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('word-detail-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('calls onPractice with item id when Practice This Word is clicked', () => {
    const onPractice = jest.fn();
    const { getByTestId } = render(
      <WordDetailBottomSheet
        visible={true}
        item={mockItem}
        onClose={jest.fn()}
        onPractice={onPractice}
      />
    );

    fireEvent.press(getByTestId('practice-word-btn'));
    expect(onPractice).toHaveBeenCalledWith('v-101');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test __tests__/components/vocabulary/WordDetailBottomSheet.test.tsx`
Expected: FAIL with "Cannot find module '@/components/vocabulary/WordDetailBottomSheet'".

- [ ] **Step 3: Implement `WordDetailBottomSheet.tsx`**

Create `components/vocabulary/WordDetailBottomSheet.tsx`:
```tsx
import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import type { VocabularyWithProgress } from '@/types/vocabulary';

export interface WordDetailBottomSheetProps {
  visible: boolean;
  item: VocabularyWithProgress | null;
  onClose: () => void;
  onPractice: (wordId: string) => void;
}

export const WordDetailBottomSheet: React.FC<WordDetailBottomSheetProps> = ({
  visible,
  item,
  onClose,
  onPractice,
}) => {
  if (!item) return null;

  const renderStatusBadge = () => {
    switch (item.status) {
      case 'mastered':
        return (
          <View className="px-2.5 py-1 rounded-full bg-mint/15 border border-mint/30">
            <Text className="text-mint font-sans-bold text-xs">Mastered</Text>
          </View>
        );
      case 'learning':
        return (
          <View className="px-2.5 py-1 rounded-full bg-daylight-amber/15 border border-daylight-amber/30">
            <Text className="text-daylight-amber font-sans-bold text-xs">Learning</Text>
          </View>
        );
      default:
        return (
          <View className="px-2.5 py-1 rounded-full bg-slate/10 border border-slate/20">
            <Text className="text-slate font-sans-medium text-xs">Unseen</Text>
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/45">
        <Pressable
          testID="word-detail-backdrop"
          className="flex-1"
          onPress={onClose}
        />

        <View className="bg-white rounded-t-3xl px-6 pt-3 pb-8 max-h-[85%] border-t border-lavender-mist shadow-2xl">
          {/* Drag Handle Bar */}
          <View className="w-12 h-1.5 rounded-full bg-slate/20 self-center mb-3" />

          {/* Header Row */}
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-3">
              <Text
                style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
                className="text-2xl"
              >
                {item.word}
              </Text>
              {Boolean(item.pronunciation) && (
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
                  className="text-sm mt-0.5"
                >
                  {item.pronunciation}
                </Text>
              )}
            </View>

            <Pressable
              testID="close-detail-btn"
              onPress={onClose}
              className="w-9 h-9 rounded-full bg-slate/10 items-center justify-center active:opacity-70"
            >
              <Ionicons name="close" size={20} color={colors.deepIndigo} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
            {/* Meaning & Status Row */}
            <View className="flex-row items-center justify-between py-2 border-b border-lavender-mist/50 mb-3">
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.canvasDarkEnd }}
                className="text-base flex-1 mr-2"
              >
                {item.translation}
              </Text>
              {renderStatusBadge()}
            </View>

            {/* Example Sentence Box */}
            {Boolean(item.exampleSentence) && (
              <View className="bg-cream rounded-2xl p-4 border border-lavender-mist/70 mb-3">
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.slate }}
                  className="text-[11px] uppercase tracking-wider mb-1"
                >
                  Context Example
                </Text>
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.deepIndigo }}
                  className="text-sm leading-relaxed"
                >
                  {item.exampleSentence}
                </Text>
                {Boolean(item.exampleTranslation) && (
                  <Text
                    style={{ fontFamily: 'PlusJakartaSans_400Regular', color: colors.slate }}
                    className="text-xs mt-1.5 italic"
                  >
                    {item.exampleTranslation}
                  </Text>
                )}
              </View>
            )}

            {/* SRS Retention Info */}
            <View className="flex-row items-center justify-between bg-canvas-dark-end/5 rounded-xl p-3">
              <View className="items-center flex-1">
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.deepIndigo }}
                  className="text-xs"
                >
                  {item.intervalDays}d interval
                </Text>
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
                  className="text-[10px]"
                >
                  SRS Spacing
                </Text>
              </View>
              <View className="w-[1px] h-6 bg-lavender-mist" />
              <View className="items-center flex-1">
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.deepIndigo }}
                  className="text-xs"
                >
                  {item.correctCount} correct
                </Text>
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
                  className="text-[10px]"
                >
                  Retention Stats
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action CTA */}
          <Pressable
            testID="practice-word-btn"
            onPress={() => onPractice(item.id)}
            className="bg-lumio-coral py-3.5 rounded-2xl items-center flex-row justify-center shadow-md active:opacity-90"
          >
            <Ionicons name="play" size={16} color={colors.cream} className="mr-2" />
            <Text
              style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
              className="text-sm ml-2"
            >
              Practice This Word
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test __tests__/components/vocabulary/WordDetailBottomSheet.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/vocabulary/WordDetailBottomSheet.tsx __tests__/components/vocabulary/WordDetailBottomSheet.test.tsx
git commit -m "feat(vocabulary): add WordDetailBottomSheet component"
```

---

### Task 3: Refactor `VocabularyHeroCard` into a Slim Horizontal Banner and Update Tests

**Files:**
- Modify: `components/vocabulary/VocabularyHeroCard.tsx`
- Test: `__tests__/components/vocabulary/VocabularyHeroCard.test.tsx`

**Interfaces:**
- Consumes: `dueCount`, `masteredCount`, `retentionRate`, `onStartReview`, `onPracticeAll` from props.
- Produces: `VocabularyHeroCard` rendering an ~85px horizontal card.

- [ ] **Step 1: Check existing `VocabularyHeroCard` tests**

Run: `npm test __tests__/components/vocabulary/VocabularyHeroCard.test.tsx`
Verify current expectations (`'12'`, `'24'`, `'92%'`, `'Start Daily Review'`, `'All caught up'`).

- [ ] **Step 2: Refactor `components/vocabulary/VocabularyHeroCard.tsx`**

Refactor `components/vocabulary/VocabularyHeroCard.tsx` to streamline vertical height:
```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface VocabularyHeroCardProps {
  dueCount: number;
  masteredCount: number;
  retentionRate: number;
  onStartReview: () => void;
  onPracticeAll?: () => void;
}

export const VocabularyHeroCard: React.FC<VocabularyHeroCardProps> = ({
  dueCount,
  masteredCount,
  retentionRate,
  onStartReview,
  onPracticeAll,
}) => {
  const isAllCaughtUp = dueCount === 0;

  return (
    <View className="bg-canvas-dark-end rounded-2xl p-4 mb-3.5 shadow-md border border-white/10 flex-row items-center justify-between">
      {/* Left Column: Title & Stats Chips */}
      <View className="flex-1 mr-3">
        <Text
          style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
          className="text-base leading-tight"
        >
          {isAllCaughtUp ? 'All Caught Up! ✨' : 'Vocabulary Vault'}
        </Text>

        <View className="flex-row items-center mt-1.5 flex-wrap">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.daylightAmber }}
            className="text-xs"
          >
            <Text>{dueCount}</Text> Due
          </Text>
          <Text style={{ color: colors.lavenderMist }} className="text-xs mx-1.5">
            •
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.mint }}
            className="text-xs"
          >
            <Text>{masteredCount}</Text> Mastered
          </Text>
          <Text style={{ color: colors.lavenderMist }} className="text-xs mx-1.5">
            •
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist }}
            className="text-xs"
          >
            <Text>{retentionRate}%</Text>
          </Text>
        </View>
      </View>

      {/* Right Column: Compact Action CTA */}
      {isAllCaughtUp ? (
        <Pressable
          testID="practice-all-btn"
          onPress={onPracticeAll ?? onStartReview}
          className="bg-white/20 active:bg-white/30 px-3.5 py-2.5 rounded-xl items-center flex-row justify-center border border-white/20"
        >
          <Ionicons name="refresh" size={15} color={colors.cream} />
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
            className="text-xs ml-1.5"
          >
            Practice All
          </Text>
        </Pressable>
      ) : (
        <Pressable
          testID="start-review-btn"
          onPress={onStartReview}
          className="bg-lumio-coral active:opacity-90 px-3.5 py-2.5 rounded-xl items-center flex-row justify-center shadow-md active:translate-y-0.5"
        >
          <Ionicons name="play" size={15} color={colors.cream} />
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
            className="text-xs ml-1.5"
          >
            Start Daily Review
          </Text>
        </Pressable>
      )}
    </View>
  );
};
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npm test __tests__/components/vocabulary/VocabularyHeroCard.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/vocabulary/VocabularyHeroCard.tsx
git commit -m "refactor(vocabulary): slim down VocabularyHeroCard into horizontal banner"
```

---

### Task 4: Integrate `WordDetailBottomSheet` into `app/(tabs)/vocabulary.tsx` and Update Tests

**Files:**
- Modify: `app/(tabs)/vocabulary.tsx`
- Test: `__tests__/screens/VocabularyScreen.test.tsx`

**Interfaces:**
- Consumes: `VocabularyListItem`, `WordDetailBottomSheet`, `VocabularyHeroCard`, `useVocabularyData`.
- Produces: Complete Vocabulary Vault screen with compact list rows and bottom sheet modal interaction.

- [ ] **Step 1: Update `__tests__/screens/VocabularyScreen.test.tsx`**

Update the test case at line 198 in `__tests__/screens/VocabularyScreen.test.tsx` to verify that tapping a vocabulary item opens the detail sheet, and pressing "Practice This Word" triggers router push:
```tsx
  it('opens detail sheet when clicking a vocabulary item and navigates to review on practice', () => {
    mockUseVocabularyData.mockReturnValue({
      vocabularies: mockVocabularies,
      dueWords: [mockVocabularies[0]],
      stats: { totalCount: 3, dueCount: 1, learningCount: 1, masteredCount: 1, retentionRate: 100 },
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByTestId } = render(<VocabularyScreen />);
    const vocabItem = getByTestId('vocab-item-v-1');
    act(() => {
      fireEvent.press(vocabItem);
    });

    // Detail sheet should now display practice button
    const practiceBtn = getByTestId('practice-word-btn');
    act(() => {
      fireEvent.press(practiceBtn);
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/vocabulary/review',
      params: { wordId: 'v-1' },
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test __tests__/screens/VocabularyScreen.test.tsx`
Expected: FAIL because `practice-word-btn` is not present yet in `VocabularyScreen`.

- [ ] **Step 3: Update `app/(tabs)/vocabulary.tsx`**

Update `app/(tabs)/vocabulary.tsx`:
```tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenWrapper } from '@/components/navigation/TabScreenWrapper';
import { useVocabularyData } from '@/hooks/useVocabularyData';
import { VocabularyHeroCard } from '@/components/vocabulary/VocabularyHeroCard';
import {
  VocabularyFilterBar,
  VocabularyFilterType,
} from '@/components/vocabulary/VocabularyFilterBar';
import { VocabularyListItem } from '@/components/vocabulary/VocabularyListItem';
import { WordDetailBottomSheet } from '@/components/vocabulary/WordDetailBottomSheet';
import { VocabularySkeletonLoader } from '@/components/vocabulary/VocabularySkeletonLoader';
import { colors } from '@/theme/colors';
import type { VocabularyWithProgress } from '@/types/vocabulary';

export default function VocabularyScreen() {
  const router = useRouter();
  const { vocabularies, dueWords, stats, loading, refreshing, error, refresh } =
    useVocabularyData();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<VocabularyFilterType>('all');
  const [selectedWord, setSelectedWord] = useState<VocabularyWithProgress | null>(null);

  const filteredVocabularies = useMemo(() => {
    return vocabularies.filter((item) => {
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.translation.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === 'all') return true;
      if (activeFilter === 'due') {
        return dueWords.some((d) => d.id === item.id);
      }
      return item.status === activeFilter;
    });
  }, [vocabularies, dueWords, searchQuery, activeFilter]);

  const filterCounts = useMemo(() => {
    return {
      all: vocabularies.length,
      due: dueWords.length,
      learning: vocabularies.filter((v) => v.status === 'learning').length,
      mastered: vocabularies.filter((v) => v.status === 'mastered').length,
    };
  }, [vocabularies, dueWords]);

  return (
    <TabScreenWrapper>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
        {/* Header */}
        <View className="px-6 pt-3 pb-2 flex-row items-center justify-between">
          <View>
            <Text
              style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
              className="text-2xl"
            >
              Vocabulary Vault
            </Text>
            <Text
              style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
              className="text-xs mt-0.5"
            >
              Master words with spaced repetition
            </Text>
          </View>
        </View>

        {loading ? (
          <VocabularySkeletonLoader />
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-14 h-14 rounded-full bg-lumio-coral/15 items-center justify-center mb-3">
              <Ionicons name="alert-circle" size={30} color={colors.lumioCoral} />
            </View>
            <Text
              style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
              className="text-lg text-center mb-1"
            >
              Unable to load vocabulary
            </Text>
            <Text
              style={{ fontFamily: 'PlusJakartaSans_400Regular', color: colors.slate }}
              className="text-sm text-center mb-5"
            >
              {error}
            </Text>
            <Pressable
              testID="retry-vocab-btn"
              onPress={refresh}
              className="bg-lumio-coral px-6 py-3 rounded-2xl active:opacity-90 shadow-sm"
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
                className="text-sm"
              >
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <FlatList
              data={filteredVocabularies}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <VocabularyListItem
                  item={item}
                  onPress={() => setSelectedWord(item)}
                />
              )}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  tintColor={colors.lumioCoral}
                />
              }
              ListHeaderComponent={
                <View className="pt-3">
                  <VocabularyHeroCard
                    dueCount={stats.dueCount}
                    masteredCount={stats.masteredCount}
                    retentionRate={stats.retentionRate}
                    onStartReview={() => router.push('/vocabulary/review' as any)}
                  />
                  <VocabularyFilterBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    counts={filterCounts}
                  />
                </View>
              }
              ListEmptyComponent={
                <View className="py-12 items-center justify-center">
                  <Ionicons name="search-outline" size={40} color={colors.slate} />
                  <Text
                    style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.deepIndigo }}
                    className="text-base mt-2"
                  >
                    No vocabulary found
                  </Text>
                  <Text
                    style={{ fontFamily: 'PlusJakartaSans_400Regular', color: colors.slate }}
                    className="text-xs text-center mt-1 text-gray-500"
                  >
                    Try clearing your search query or changing filter.
                  </Text>
                </View>
              }
            />

            <WordDetailBottomSheet
              visible={Boolean(selectedWord)}
              item={selectedWord}
              onClose={() => setSelectedWord(null)}
              onPractice={(wordId) => {
                setSelectedWord(null);
                router.push({
                  pathname: '/vocabulary/review',
                  params: { wordId },
                } as any);
              }}
            />
          </>
        )}
      </SafeAreaView>
    </TabScreenWrapper>
  );
}
```

- [ ] **Step 4: Run tests to verify all tests pass**

Run: `npm test __tests__/screens/VocabularyScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/vocabulary.tsx __tests__/screens/VocabularyScreen.test.tsx
git commit -m "feat(vocabulary): integrate WordDetailBottomSheet into VocabularyScreen"
```

---

### Task 5: Full Verification & Sanity Checks

**Files:**
- All touched files.

- [ ] **Step 1: Run all vocabulary unit and screen tests**

Run: `npm test __tests__/components/vocabulary __tests__/screens/VocabularyScreen.test.tsx`
Expected: PASS

- [ ] **Step 2: Run TypeScript typecheck**

Run: `npm run typecheck`
Expected: 0 errors

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: 0 lint errors

- [ ] **Step 4: Final commit (if needed)**
