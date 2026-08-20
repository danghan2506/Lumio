import React, { act } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import VocabularyScreen from '@/app/(tabs)/vocabulary';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockRefresh = jest.fn();
const mockUseVocabularyData = jest.fn();

jest.mock('@/hooks/useVocabularyData', () => ({
  useVocabularyData: () => mockUseVocabularyData(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
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

describe('VocabularyScreen', () => {
  const mockVocabularies = [
    {
      id: 'v-1',
      lessonId: 'l-1',
      word: 'Hello',
      translation: 'Xin chào',
      pronunciation: '/həˈloʊ/',
      exampleSentence: 'Hello world',
      exampleTranslation: 'Chào thế giới',
      status: 'learning' as const,
      correctCount: 2,
      incorrectCount: 0,
      repetitions: 2,
      easeFactor: 2.5,
      intervalDays: 3,
      dueAt: '2026-08-01T00:00:00Z',
      lastReviewedAt: '2026-07-29T00:00:00Z',
    },
    {
      id: 'v-2',
      lessonId: 'l-1',
      word: 'Goodbye',
      translation: 'Tạm biệt',
      pronunciation: '/ɡʊdˈbaɪ/',
      exampleSentence: 'Goodbye my friend',
      exampleTranslation: 'Tạm biệt bạn tôi',
      status: 'mastered' as const,
      correctCount: 5,
      incorrectCount: 0,
      repetitions: 5,
      easeFactor: 2.6,
      intervalDays: 14,
      dueAt: '2026-08-30T00:00:00Z',
      lastReviewedAt: '2026-08-16T00:00:00Z',
    },
    {
      id: 'v-3',
      lessonId: 'l-2',
      word: 'Thank you',
      translation: 'Cảm ơn',
      pronunciation: '/θæŋk juː/',
      exampleSentence: 'Thank you very much',
      exampleTranslation: 'Cảm ơn bạn rất nhiều',
      status: 'unseen' as const,
      correctCount: 0,
      incorrectCount: 0,
      repetitions: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      dueAt: null,
      lastReviewedAt: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeleton loader when loading is true', () => {
    mockUseVocabularyData.mockReturnValue({
      vocabularies: [],
      dueWords: [],
      stats: { totalCount: 0, dueCount: 0, learningCount: 0, masteredCount: 0, retentionRate: 100 },
      loading: true,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByTestId } = render(<VocabularyScreen />);
    expect(getByTestId('vocabulary-skeleton-loader')).toBeTruthy();
  });

  it('renders error state with retry button and calls refresh on retry', () => {
    mockUseVocabularyData.mockReturnValue({
      vocabularies: [],
      dueWords: [],
      stats: { totalCount: 0, dueCount: 0, learningCount: 0, masteredCount: 0, retentionRate: 100 },
      loading: false,
      refreshing: false,
      error: 'Network timeout',
      refresh: mockRefresh,
    });

    const { getByText, getByTestId } = render(<VocabularyScreen />);
    expect(getByText('Unable to load vocabulary')).toBeTruthy();
    expect(getByText('Network timeout')).toBeTruthy();

    const retryBtn = getByTestId('retry-vocab-btn');
    act(() => {
      fireEvent.press(retryBtn);
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders vocabulary list and stats correctly when loaded', () => {
    mockUseVocabularyData.mockReturnValue({
      vocabularies: mockVocabularies,
      dueWords: [mockVocabularies[0], mockVocabularies[2]],
      stats: { totalCount: 3, dueCount: 2, learningCount: 1, masteredCount: 1, retentionRate: 100 },
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByText, getAllByText } = render(<VocabularyScreen />);

    expect(getAllByText('Vocabulary Vault').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Master words with spaced repetition')).toBeTruthy();
    expect(getByText('Hello')).toBeTruthy();
    expect(getByText('Xin chào')).toBeTruthy();
    expect(getByText('Goodbye')).toBeTruthy();
    expect(getByText('Tạm biệt')).toBeTruthy();
    expect(getByText('Thank you')).toBeTruthy();
    expect(getByText('Cảm ơn')).toBeTruthy();
  });

  it('navigates to /vocabulary/review when clicking Start Daily Review', () => {
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
    const startReviewBtn = getByTestId('start-review-btn');
    act(() => {
      fireEvent.press(startReviewBtn);
    });

    expect(mockPush).toHaveBeenCalledWith('/vocabulary/review');
  });

  it('navigates to /vocabulary/review when clicking Practice All Vocabulary in all caught up state', () => {
    mockUseVocabularyData.mockReturnValue({
      vocabularies: mockVocabularies,
      dueWords: [],
      stats: { totalCount: 3, dueCount: 0, learningCount: 1, masteredCount: 2, retentionRate: 100 },
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByTestId, getByText } = render(<VocabularyScreen />);
    expect(getByText('All Caught Up! ✨')).toBeTruthy();

    const practiceAllBtn = getByTestId('practice-all-btn');
    act(() => {
      fireEvent.press(practiceAllBtn);
    });

    expect(mockPush).toHaveBeenCalledWith('/vocabulary/review');
  });

  it('filters vocabulary items by search query', () => {
    mockUseVocabularyData.mockReturnValue({
      vocabularies: mockVocabularies,
      dueWords: [mockVocabularies[0]],
      stats: { totalCount: 3, dueCount: 1, learningCount: 1, masteredCount: 1, retentionRate: 100 },
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByPlaceholderText, getByText, queryByText } = render(<VocabularyScreen />);

    const searchInput = getByPlaceholderText('Search words or translations...');
    act(() => {
      fireEvent.changeText(searchInput, 'Goodbye');
    });

    expect(getByText('Goodbye')).toBeTruthy();
    expect(queryByText('Hello')).toBeNull();
    expect(queryByText('Thank you')).toBeNull();
  });

  it('filters vocabulary items by status chips (due, learning, mastered)', () => {
    mockUseVocabularyData.mockReturnValue({
      vocabularies: mockVocabularies,
      dueWords: [mockVocabularies[0]],
      stats: { totalCount: 3, dueCount: 1, learningCount: 1, masteredCount: 1, retentionRate: 100 },
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByText, queryByText } = render(<VocabularyScreen />);

    // Filter by 'Mastered'
    act(() => {
      fireEvent.press(getByText('Mastered (1)'));
    });
    expect(getByText('Goodbye')).toBeTruthy();
    expect(queryByText('Hello')).toBeNull();

    // Filter by 'Learning'
    act(() => {
      fireEvent.press(getByText('Learning (1)'));
    });
    expect(getByText('Hello')).toBeTruthy();
    expect(queryByText('Goodbye')).toBeNull();

    // Filter by 'Due'
    act(() => {
      fireEvent.press(getByText('Due (1)'));
    });
    expect(getByText('Hello')).toBeTruthy();
    expect(queryByText('Goodbye')).toBeNull();
  });

  it('renders empty state when search query matches no words', () => {
    mockUseVocabularyData.mockReturnValue({
      vocabularies: mockVocabularies,
      dueWords: [],
      stats: { totalCount: 3, dueCount: 0, learningCount: 1, masteredCount: 1, retentionRate: 100 },
      loading: false,
      refreshing: false,
      error: null,
      refresh: mockRefresh,
    });

    const { getByPlaceholderText, getByText } = render(<VocabularyScreen />);

    const searchInput = getByPlaceholderText('Search words or translations...');
    act(() => {
      fireEvent.changeText(searchInput, 'nonexistentword123');
    });

    expect(getByText('No vocabulary found')).toBeTruthy();
    expect(getByText('Try clearing your search query or changing filter.')).toBeTruthy();
  });
});
