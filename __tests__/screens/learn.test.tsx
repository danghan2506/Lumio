import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LearnScreen from '@/app/(tabs)/learn';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockRefresh = jest.fn();
const mockUseLessonsData = jest.fn();

jest.mock('@/hooks/useLessonsData', () => ({
  useLessonsData: () => mockUseLessonsData(),
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders active unit header and lesson cards when loaded', () => {
    mockUseLessonsData.mockReturnValue({
      selectedLanguage: 'en',
      activeUnit: mockUnit,
      lessons: mockLessons,
      completedCount: 1,
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByText } = render(<LearnScreen />);

    expect(getByText('Greetings & Basics')).toBeTruthy();
    expect(getByText('Unit 1 • 1 / 2 lessons')).toBeTruthy();
    expect(getByText('Basic Greetings')).toBeTruthy();
    expect(getByText('Café Conversations')).toBeTruthy();
  });

  it('handles lesson card press and pushes to /lesson/[id]', () => {
    mockUseLessonsData.mockReturnValue({
      selectedLanguage: 'en',
      activeUnit: mockUnit,
      lessons: mockLessons,
      completedCount: 1,
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByText } = render(<LearnScreen />);

    fireEvent(getByText('Basic Greetings'), 'press');

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/lesson/[id]',
      params: { id: 'les-1' },
    });
  });

  it('renders Lessons and Practice tab toggle options and handles pressing tab', () => {
    mockUseLessonsData.mockReturnValue({
      selectedLanguage: 'en',
      activeUnit: mockUnit,
      lessons: mockLessons,
      completedCount: 1,
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByText } = render(<LearnScreen />);

    expect(getByText('Lessons')).toBeTruthy();
    expect(getByText('Practice')).toBeTruthy();

    // Press Practice tab option
    fireEvent(getByText('Practice'), 'press');
  });

  it('renders loading indicator when loading is true', () => {
    mockUseLessonsData.mockReturnValue({
      selectedLanguage: 'en',
      activeUnit: null,
      lessons: [],
      completedCount: 0,
      loading: true,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByTestId } = render(<LearnScreen />);

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders error alert when error occurs', () => {
    mockUseLessonsData.mockReturnValue({
      selectedLanguage: 'en',
      activeUnit: null,
      lessons: [],
      completedCount: 0,
      loading: false,
      refreshing: false,
      error: 'We could not load lessons right now. Pull down to try again.',
      refresh: mockRefresh,
    });

    const { getByText } = render(<LearnScreen />);

    expect(getByText('Failed to load lessons')).toBeTruthy();
    expect(
      getByText('We could not load lessons right now. Pull down to try again.')
    ).toBeTruthy();
  });

  it('calls refresh when try again button is pressed on error alert', () => {
    mockUseLessonsData.mockReturnValue({
      selectedLanguage: 'en',
      activeUnit: null,
      lessons: [],
      completedCount: 0,
      loading: false,
      refreshing: false,
      error: 'Database connection failed',
      refresh: mockRefresh,
    });

    const { getByText } = render(<LearnScreen />);

    const tryAgainBtn = getByText('Try again');
    fireEvent(tryAgainBtn, 'press');

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
