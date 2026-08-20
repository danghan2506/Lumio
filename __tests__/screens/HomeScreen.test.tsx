import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)/index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockRefresh = jest.fn();
const mockDashboardData = {
  userName: 'Alex',
  avatarUrl: null,
  activeLanguage: {
    id: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    learnerLanguage: 'vi',
  },
  streak: 12,
  isStreakActiveToday: true,
  dailyGoal: {
    currentXp: 15,
    targetXp: 20,
    isCompleted: false,
  },
  continueLesson: {
    lessonId: 'es-unit-1-lesson-1',
    lessonTitle: 'Greetings & Introductions',
    unitTitle: 'Unit 1',
    unitOrder: 1,
    xpReward: 10,
    estimatedMinutes: 5,
    isCourseCompleted: false,
  },
  todaysPlan: [
    {
      id: 'plan-1',
      type: 'lesson' as const,
      title: 'Lesson: Greetings',
      subtitle: 'Unit 1 • 5 mins',
      completed: false,
      active: true,
      lessonId: 'es-unit-1-lesson-1',
    },
  ],
  aiTopicLessonId: 'es-unit-1-lesson-1',
  aiTopicTitle: 'Greetings & Introductions',
};

jest.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    data: mockDashboardData,
    loading: false,
    refreshing: false,
    error: null,
    refresh: mockRefresh,
  }),
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

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dynamic HeaderBar, DailyGoalCard, HeroContinueCard, TodaysPlanList, and AiVideoHighlightCard', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText(/Hola, Alex! 👋/i)).toBeTruthy();
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
    expect(getByText('/ 20 XP')).toBeTruthy();
    expect(getByText('CONTINUE LEARNING')).toBeTruthy();
    expect(getByText('Unit 1 • Greetings & Introductions')).toBeTruthy();
    expect(getByText("Today's plan")).toBeTruthy();
    expect(getByText('Lesson: Greetings')).toBeTruthy();
    expect(getByText('AI Video Call')).toBeTruthy();
    expect(getByText('Topic: Greetings & Introductions')).toBeTruthy();
  });

  it('navigates to the real lesson ID when Continue button is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    const continueBtn = getByText('Continue');
    fireEvent(continueBtn, 'press');
    expect(mockPush).toHaveBeenCalledWith('/lesson/es-unit-1-lesson-1');
  });

  it('navigates to learn tab when language badge is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    const languageBadge = getByText(/Hola, Alex! 👋/i);
    fireEvent(languageBadge, 'press');
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/learn');
  });

  it('navigates to lesson with AI context when AI Video Call button is pressed', () => {
    const { getByTestId } = render(<HomeScreen />);
    const startCallBtn = getByTestId('start-call-card');
    fireEvent(startCallBtn, 'press');
    expect(mockPush).toHaveBeenCalledWith('/lesson/es-unit-1-lesson-1');
  });
});

