import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)/index';
import { useRouter } from 'expo-router';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    session: null,
    user: null,
    loading: false,
    signOut: jest.fn(),
  }),
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

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders HeaderBar, DailyGoalCard, HeroContinueCard, TodaysPlanList, and AiVideoHighlightCard', () => {
    const { getByText } = render(<HomeScreen />);

    // HeaderBar
    expect(getByText(/Hola, Alex! 👋/i)).toBeTruthy();

    // DailyGoalCard
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
    expect(getByText('/ 20 XP')).toBeTruthy();

    // HeroContinueCard
    expect(getByText('CONTINUE LEARNING')).toBeTruthy();
    expect(getByText('Spanish A1 • Unit 2')).toBeTruthy();

    // TodaysPlanList
    expect(getByText("Today's plan")).toBeTruthy();
    expect(getByText('Lesson: At the café')).toBeTruthy();

    // AiVideoHighlightCard
    expect(getByText('AI Video Call')).toBeTruthy();
  });

  it('navigates to lesson when Continue button is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    const continueBtn = getByText('Continue');
    fireEvent(continueBtn, 'press');
    expect(mockPush).toHaveBeenCalledWith('/lesson/cafe-1');
  });

  it('navigates to learn tab when language badge is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    const languageBadge = getByText(/Hola, Alex! 👋/i);
    fireEvent(languageBadge, 'press');
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/learn');
  });

  it('navigates to ai-teacher tab when AI Video Call button is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    const startCallBtn = getByText('AI Video Call');
    fireEvent(startCallBtn, 'press');
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/ai-teacher');
  });
});

