import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LearnScreen from '@/app/(tabs)/learn';
import type { UnitRow } from '@/types/database.types';
import type { UnitProgressSummary } from '@/lib/api';

const mockUnits: UnitRow[] = [
  {
    id: 'unit-1',
    language_id: 'en',
    order: 1,
    title: 'Unit 1: Basics & Greetings',
    description: 'Learn essential greetings',
    icon_emoji: '👋',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-2',
    language_id: 'en',
    order: 2,
    title: 'Unit 2: Food & Drinks',
    description: 'Order food and talk about meals',
    icon_emoji: '🍜',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-3',
    language_id: 'en',
    order: 3,
    title: 'Unit 3: Travel & Directions',
    description: 'Navigate the city',
    icon_emoji: '✈️',
    created_at: '2026-01-01T00:00:00Z',
  },
];

const mockUnitsProgress: Record<string, UnitProgressSummary> = {
  'unit-1': { completedCount: 2, totalCount: 2, isCompleted: true, isLocked: false },
  'unit-2': { completedCount: 1, totalCount: 2, isCompleted: false, isLocked: false },
  'unit-3': { completedCount: 0, totalCount: 2, isCompleted: false, isLocked: true },
};

let mockSearchParams: Record<string, string | undefined> = {};
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children, style }: any) => <View style={style}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@/components/navigation/TabScreenWrapper', () => ({
  TabScreenWrapper: ({ children }: any) => children,
}));

jest.mock('@/lib/api', () => ({
  recordLessonProgress: jest.fn(),
}));

const mockLessonsSetActiveUnit = jest.fn();
const mockGoToPrevUnit = jest.fn();
const mockGoToNextUnit = jest.fn();
const mockRefreshLessons = jest.fn();
let capturedLessonsOptions: any = undefined;

let mockLessonsState = {
  selectedLanguage: 'en',
  units: mockUnits,
  activeUnit: mockUnits[0],
  unitsProgress: mockUnitsProgress,
  lessons: [
    {
      id: 'lesson-1',
      unit_id: 'unit-1',
      order: 1,
      title: 'Hello',
      xp_reward: 10,
      estimated_minutes: 5,
      ai_teacher_prompt: 'prompt',
      created_at: '2026-01-01T00:00:00Z',
      status: 'completed' as const,
    },
  ],
  completedCount: 1,
  loading: false,
  refreshing: false,
  error: null,
  canGoPrev: true,
  canGoNext: true,
  setActiveUnit: mockLessonsSetActiveUnit,
  goToPrevUnit: mockGoToPrevUnit,
  goToNextUnit: mockGoToNextUnit,
  refresh: mockRefreshLessons,
};

jest.mock('@/hooks/useLessonsData', () => ({
  useLessonsData: jest.fn((options) => {
    capturedLessonsOptions = options;
    return mockLessonsState;
  }),
}));

const mockPracticeSetActiveUnit = jest.fn();
const mockRefreshPractice = jest.fn();
const mockSelectLessonForPractice = jest.fn();
const mockClearSelectedPracticeLesson = jest.fn();
const mockSetFilterType = jest.fn();

let mockPracticeState = {
  selectedLanguage: 'en',
  units: mockUnits,
  activeUnit: mockUnits[0],
  unitsProgress: mockUnitsProgress,
  practiceLessons: [],
  filteredPracticeLessons: [],
  filterType: 'all' as const,
  setFilterType: mockSetFilterType,
  loading: false,
  refreshing: false,
  error: null,
  refresh: mockRefreshPractice,
  selectedPracticeLesson: null,
  selectedPracticeActivityType: null,
  activeLessonActivities: [],
  activeTranslationActivities: [],
  loadingActivities: false,
  activitiesError: null,
  setActiveUnit: mockPracticeSetActiveUnit,
  selectLessonForPractice: mockSelectLessonForPractice,
  selectLessonForTranslationPractice: jest.fn(),
  loadActivitiesForLesson: jest.fn(),
  clearSelectedPracticeLesson: mockClearSelectedPracticeLesson,
};

jest.mock('@/hooks/usePracticeData', () => ({
  usePracticeData: jest.fn(() => mockPracticeState),
}));

describe('LearnScreen Unit Navigation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    capturedLessonsOptions = undefined;

    mockLessonsState = {
      selectedLanguage: 'en',
      units: mockUnits,
      activeUnit: mockUnits[0],
      unitsProgress: mockUnitsProgress,
      lessons: [
        {
          id: 'lesson-1',
          unit_id: 'unit-1',
          order: 1,
          title: 'Hello',
          xp_reward: 10,
          estimated_minutes: 5,
          ai_teacher_prompt: 'prompt',
          created_at: '2026-01-01T00:00:00Z',
          status: 'completed' as const,
        },
      ],
      completedCount: 1,
      loading: false,
      refreshing: false,
      error: null,
      canGoPrev: true,
      canGoNext: true,
      setActiveUnit: mockLessonsSetActiveUnit,
      goToPrevUnit: mockGoToPrevUnit,
      goToNextUnit: mockGoToNextUnit,
      refresh: mockRefreshLessons,
    };

    mockPracticeState = {
      selectedLanguage: 'en',
      units: mockUnits,
      activeUnit: mockUnits[0],
      unitsProgress: mockUnitsProgress,
      practiceLessons: [],
      filteredPracticeLessons: [],
      filterType: 'all' as const,
      setFilterType: mockSetFilterType,
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefreshPractice,
      selectedPracticeLesson: null,
      selectedPracticeActivityType: null,
      activeLessonActivities: [],
      activeTranslationActivities: [],
      loadingActivities: false,
      activitiesError: null,
      setActiveUnit: mockPracticeSetActiveUnit,
      selectLessonForPractice: mockSelectLessonForPractice,
      selectLessonForTranslationPractice: jest.fn(),
      loadActivitiesForLesson: jest.fn(),
      clearSelectedPracticeLesson: mockClearSelectedPracticeLesson,
    };
  });

  it('tapping unit-header-next calls goToNextUnit', () => {
    const { getByTestId } = render(<LearnScreen />);

    const nextBtn = getByTestId('unit-header-next');
    fireEvent.press(nextBtn);

    expect(mockGoToNextUnit).toHaveBeenCalledTimes(1);
  });

  it('tapping unit-header-prev calls goToPrevUnit', () => {
    const { getByTestId } = render(<LearnScreen />);

    const prevBtn = getByTestId('unit-header-prev');
    fireEvent.press(prevBtn);

    expect(mockGoToPrevUnit).toHaveBeenCalledTimes(1);
  });

  it('tapping unit-header-title opens selector modal; choosing an unlocked unit calls setActiveUnit on BOTH hooks with the same unit', () => {
    const { getByTestId, queryByTestId } = render(<LearnScreen />);

    // Initially modal is not visible
    expect(queryByTestId('unit-selector-modal')).toBeNull();

    // Tap unit-header-title
    const titleBtn = getByTestId('unit-header-title');
    fireEvent.press(titleBtn);

    // Modal is now open
    expect(getByTestId('unit-selector-modal')).toBeTruthy();

    // Select unlocked Unit 2
    const unit2Option = getByTestId('unit-option-unit-2');
    fireEvent.press(unit2Option);

    // Modal should close and both hooks should have their active unit updated to unit 2
    expect(mockLessonsSetActiveUnit).toHaveBeenCalledTimes(1);
    expect(mockLessonsSetActiveUnit).toHaveBeenCalledWith(mockUnits[1]);

    expect(mockPracticeSetActiveUnit).toHaveBeenCalledTimes(1);
    expect(mockPracticeSetActiveUnit).toHaveBeenCalledWith(mockUnits[1]);

    expect(queryByTestId('unit-selector-modal')).toBeNull();
  });

  it('passes initialUnitId from searchParams into useLessonsData options', () => {
    mockSearchParams = { unitId: 'unit-2' };

    render(<LearnScreen />);

    expect(capturedLessonsOptions).toEqual({ initialUnitId: 'unit-2' });
  });

  it('closes unit selector modal when close button is pressed', () => {
    const { getByTestId, queryByTestId } = render(<LearnScreen />);

    // Open modal
    fireEvent.press(getByTestId('unit-header-title'));
    expect(getByTestId('unit-selector-modal')).toBeTruthy();

    // Close modal
    fireEvent.press(getByTestId('unit-selector-close-button'));
    expect(queryByTestId('unit-selector-modal')).toBeNull();
  });

  it('synchronizes active unit to practice hook when lessonsActiveUnit changes', () => {
    // Start with practice active unit not set or different
    mockPracticeState.activeUnit = null as any;

    render(<LearnScreen />);

    // Because lessonsActiveUnit is mockUnits[0], practiceSetActiveUnit should be called with mockUnits[0]
    expect(mockPracticeSetActiveUnit).toHaveBeenCalledWith(mockUnits[0]);
  });

  it('synchronizes active unit on both hooks when route unitId changes to an unlocked unit', () => {
    mockSearchParams = { unitId: 'unit-2' };

    render(<LearnScreen />);

    expect(mockLessonsSetActiveUnit).toHaveBeenCalledWith(mockUnits[1]);
    expect(mockPracticeSetActiveUnit).toHaveBeenCalledWith(mockUnits[1]);
  });
});
