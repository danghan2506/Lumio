import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LearnScreen from '@/app/(tabs)/learn';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockRefreshLessons = jest.fn();
const mockUseLessonsData = jest.fn();

jest.mock('@/hooks/useLessonsData', () => ({
  useLessonsData: () => mockUseLessonsData(),
}));

const mockRefreshPractice = jest.fn();
const mockSelectLessonForPractice = jest.fn();
const mockClearSelectedPracticeLesson = jest.fn();
const mockUsePracticeData = jest.fn();

jest.mock('@/hooks/usePracticeData', () => ({
  usePracticeData: () => mockUsePracticeData(),
}));

jest.mock('@/lib/api', () => ({
  recordLessonProgress: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
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

jest.mock('@/components/navigation/TabScreenWrapper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    TabScreenWrapper: ({ children }: any) => <View>{children}</View>,
  };
});

describe('LearnScreen', () => {
  const mockUnit = {
    id: 'unit-1',
    language_id: 'en',
    title: 'Greetings & Basics',
    description: 'Learn fundamental greetings',
    icon_emoji: '👋',
    order: 1,
    created_at: '2026-01-01T00:00:00Z',
  };

  const mockLessons = [
    {
      id: 'les-1',
      unit_id: 'unit-1',
      title: 'Basic Greetings',
      order: 1,
      xp_reward: 10,
      estimated_minutes: 5,
      ai_teacher_prompt: null,
      status: 'completed' as const,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'les-2',
      unit_id: 'unit-1',
      title: 'Café Conversations',
      order: 2,
      xp_reward: 15,
      estimated_minutes: 8,
      ai_teacher_prompt: null,
      status: 'in_progress' as const,
      created_at: '2026-01-01T00:00:00Z',
    },
  ];

  const mockPracticeLessons = [
    {
      id: 'les-1',
      unit_id: 'unit-1',
      order: 1,
      title: 'Basic Greetings Practice',
      xp_reward: 10,
      estimated_minutes: 5,
      activitiesCount: 3,
      status: 'completed' as const,
    },
    {
      id: 'les-2',
      unit_id: 'unit-1',
      order: 2,
      title: 'Café Conversations Practice',
      xp_reward: 15,
      estimated_minutes: 8,
      activitiesCount: 2,
      status: 'not_started' as const,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLessonsData.mockReturnValue({
      selectedLanguage: 'en',
      activeUnit: mockUnit,
      lessons: mockLessons,
      completedCount: 1,
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefreshLessons,
    });

    mockUsePracticeData.mockReturnValue({
      selectedLanguage: 'en',
      units: [mockUnit],
      activeUnit: mockUnit,
      practiceLessons: mockPracticeLessons,
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefreshPractice,
      selectedPracticeLesson: null,
      activeLessonActivities: [],
      loadingActivities: false,
      activitiesError: null,
      selectLessonForPractice: mockSelectLessonForPractice,
      clearSelectedPracticeLesson: mockClearSelectedPracticeLesson,
    });
  });

  it('renders active unit header and lesson cards when loaded', () => {
    const { getByText } = render(<LearnScreen />);

    expect(getByText('Greetings & Basics')).toBeTruthy();
    expect(getByText('Unit 1 • 1 / 2 lessons')).toBeTruthy();
    expect(getByText('Basic Greetings')).toBeTruthy();
    expect(getByText('Café Conversations')).toBeTruthy();
  });

  it('handles lesson card press and pushes to /lesson/[id]', () => {
    const { getByText } = render(<LearnScreen />);

    fireEvent(getByText('Basic Greetings'), 'press');

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/lesson/[id]',
      params: { id: 'les-1' },
    });
  });

  it('switches to Practice tab and renders practice cards', () => {
    const { getByText } = render(<LearnScreen />);

    // Press Practice tab option
    fireEvent(getByText('Practice'), 'press');

    expect(getByText('Basic Greetings Practice')).toBeTruthy();
    expect(getByText('Café Conversations Practice')).toBeTruthy();
    expect(getByText('3 câu hỏi')).toBeTruthy();
    expect(getByText('2 câu hỏi')).toBeTruthy();

    // Tap on a practice card
    fireEvent.press(getByText('Basic Greetings Practice'));
    expect(mockSelectLessonForPractice).toHaveBeenCalledWith(mockPracticeLessons[0]);
  });

  it('renders empty practice lessons state when practiceLessons is empty', () => {
    mockUsePracticeData.mockReturnValue({
      selectedLanguage: 'en',
      units: [mockUnit],
      activeUnit: mockUnit,
      practiceLessons: [],
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefreshPractice,
      selectedPracticeLesson: null,
      activeLessonActivities: [],
      loadingActivities: false,
      activitiesError: null,
      selectLessonForPractice: mockSelectLessonForPractice,
      clearSelectedPracticeLesson: mockClearSelectedPracticeLesson,
    });

    const { getByText } = render(<LearnScreen />);
    fireEvent(getByText('Practice'), 'press');

    expect(getByText('Chưa có bài tập trắc nghiệm')).toBeTruthy();
  });

  it('renders practice error alert when error occurs on practice tab', () => {
    mockUsePracticeData.mockReturnValue({
      selectedLanguage: 'en',
      units: [],
      activeUnit: null,
      practiceLessons: [],
      loading: false,
      refreshing: false,
      error: 'Network connection lost',
      refresh: mockRefreshPractice,
      selectedPracticeLesson: null,
      activeLessonActivities: [],
      loadingActivities: false,
      activitiesError: null,
      selectLessonForPractice: mockSelectLessonForPractice,
      clearSelectedPracticeLesson: mockClearSelectedPracticeLesson,
    });

    const { getByText } = render(<LearnScreen />);
    fireEvent(getByText('Practice'), 'press');

    expect(getByText('Failed to load practice lessons')).toBeTruthy();
    expect(getByText('Network connection lost')).toBeTruthy();

    fireEvent.press(getByText('Try again'));
    expect(mockRefreshPractice).toHaveBeenCalledTimes(1);
  });

  it('renders loading indicator when loading is true on Lessons tab', () => {
    mockUseLessonsData.mockReturnValue({
      selectedLanguage: 'en',
      activeUnit: null,
      lessons: [],
      completedCount: 0,
      loading: true,
      refreshing: false,
      error: null,
      refresh: mockRefreshLessons,
    });

    const { getByTestId } = render(<LearnScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders error alert when error occurs on Lessons tab and calls refreshLessons on try again', () => {
    mockUseLessonsData.mockReturnValue({
      selectedLanguage: 'en',
      activeUnit: null,
      lessons: [],
      completedCount: 0,
      loading: false,
      refreshing: false,
      error: 'We could not load lessons right now. Pull down to try again.',
      refresh: mockRefreshLessons,
    });

    const { getByText } = render(<LearnScreen />);

    expect(getByText('Failed to load lessons')).toBeTruthy();
    expect(
      getByText('We could not load lessons right now. Pull down to try again.')
    ).toBeTruthy();

    const tryAgainBtn = getByText('Try again');
    fireEvent(tryAgainBtn, 'press');

    expect(mockRefreshLessons).toHaveBeenCalledTimes(1);
  });
});
