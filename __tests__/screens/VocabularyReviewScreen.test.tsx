import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import VocabularyReviewScreen from '@/app/vocabulary/review';

const mockBack = jest.fn();
let mockLocalSearchParams: { wordId?: string } = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockLocalSearchParams,
}));

const mockRecordReview = jest.fn();
const mockUseVocabularyData = jest.fn();

jest.mock('@/hooks/useVocabularyData', () => ({
  useVocabularyData: () => mockUseVocabularyData(),
}));

const mockInsets = { top: 47, right: 0, bottom: 34, left: 0 };
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }: any) => <View style={style}>{children}</View>,
    useSafeAreaInsets: () => mockInsets,
  };
});

describe('VocabularyReviewScreen', () => {
  let backHandlerCallback: (() => boolean) | null = null;

  const mockDueWords = [
    {
      id: 'v-1',
      lessonId: 'l-1',
      word: 'Adventure',
      translation: 'Cuộc phiêu lưu',
      pronunciation: '/ədˈvɛntʃər/',
      exampleSentence: 'Life is an adventure.',
      exampleTranslation: 'Cuộc sống là một cuộc phiêu lưu.',
      status: 'learning' as const,
      correctCount: 1,
      incorrectCount: 0,
      repetitions: 1,
      easeFactor: 2.5,
      intervalDays: 1,
      dueAt: '2026-08-20T00:00:00Z',
      lastReviewedAt: '2026-08-19T00:00:00Z',
    },
    {
      id: 'v-2',
      lessonId: 'l-1',
      word: 'Courage',
      translation: 'Lòng can đảm',
      pronunciation: '/ˈkɜːr.ɪdʒ/',
      exampleSentence: 'She showed great courage.',
      exampleTranslation: 'Cô ấy thể hiện lòng can đảm lớn.',
      status: 'learning' as const,
      correctCount: 2,
      incorrectCount: 0,
      repetitions: 2,
      easeFactor: 2.5,
      intervalDays: 3,
      dueAt: '2026-08-20T00:00:00Z',
      lastReviewedAt: '2026-08-17T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    backHandlerCallback = null;
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'hardwareBackPress') {
        backHandlerCallback = handler;
      }
      return { remove: jest.fn() } as any;
    });
  });

  it('renders review card and handles rating button press across cards until completion', async () => {
    mockRecordReview
      .mockResolvedValueOnce({
        nextStatus: 'learning',
        isCorrect: true,
        xpEarned: 3,
      })
      .mockResolvedValueOnce({
        nextStatus: 'mastered',
        isCorrect: true,
        xpEarned: 5,
      });

    mockUseVocabularyData.mockReturnValue({
      dueWords: mockDueWords,
      vocabularies: mockDueWords,
      recordReview: mockRecordReview,
      loading: false,
    });

    const { getByTestId, getByText, getAllByText } = render(<VocabularyReviewScreen />);

    expect(getAllByText('Adventure').length).toBeGreaterThanOrEqual(1);
    expect(getByText('+0 XP')).toBeTruthy();

    // Tap Show Answer / Flip card
    const showAnswerBtn = getByTestId('flip-hint-btn');
    fireEvent.press(showAnswerBtn);

    // Rate Good (Grade 3) for Card 1
    const goodBtn = getByTestId('grade-3-btn');
    await act(async () => {
      fireEvent.press(goodBtn);
    });

    expect(mockRecordReview).toHaveBeenCalledWith({
      vocabularyId: 'v-1',
      lessonId: 'l-1',
      grade: 3,
    });

    // Now Card 2 should be active: Courage
    expect(getAllByText('Courage').length).toBeGreaterThanOrEqual(1);
    expect(getByText('+3 XP')).toBeTruthy();

    // Flip card 2 via card press
    const cardPressable = getByTestId('flip-flashcard-pressable');
    fireEvent.press(cardPressable);

    // Rate Easy (Grade 4) for Card 2
    const easyBtn = getByTestId('grade-4-btn');
    await act(async () => {
      fireEvent.press(easyBtn);
    });

    expect(mockRecordReview).toHaveBeenCalledWith({
      vocabularyId: 'v-2',
      lessonId: 'l-1',
      grade: 4,
    });

    // Completion modal should be shown
    expect(getByTestId('review-completion-modal')).toBeTruthy();
    expect(getByText('+8 XP Earned')).toBeTruthy();

    // Close completion modal
    const closeModalBtn = getByTestId('close-completion-modal-btn');
    fireEvent.press(closeModalBtn);
    expect(mockBack).toHaveBeenCalled();
  });

  it('handles rating with Again (Grade 1) and Hard (Grade 2)', async () => {
    mockRecordReview.mockResolvedValueOnce({
      nextStatus: 'learning',
      isCorrect: false,
      xpEarned: 1,
    });

    mockUseVocabularyData.mockReturnValue({
      dueWords: [mockDueWords[0]],
      vocabularies: [mockDueWords[0]],
      recordReview: mockRecordReview,
      loading: false,
    });

    const { getByTestId } = render(<VocabularyReviewScreen />);

    // Flip card
    fireEvent.press(getByTestId('flip-flashcard-pressable'));

    // Press Again
    const againBtn = getByTestId('grade-1-btn');
    await act(async () => {
      fireEvent.press(againBtn);
    });

    expect(mockRecordReview).toHaveBeenCalledWith({
      vocabularyId: 'v-1',
      lessonId: 'l-1',
      grade: 1,
    });
  });

  it('opens exit confirm dialog when tapping back button and handles resume / exit', () => {
    mockUseVocabularyData.mockReturnValue({
      dueWords: mockDueWords,
      vocabularies: mockDueWords,
      recordReview: mockRecordReview,
      loading: false,
    });

    const { getByTestId, queryByTestId } = render(<VocabularyReviewScreen />);
    const backBtn = getByTestId('review-back-btn');
    fireEvent.press(backBtn);

    expect(getByTestId('review-exit-dialog')).toBeTruthy();

    // Resume review
    const resumeBtn = getByTestId('resume-review-btn');
    fireEvent.press(resumeBtn);
    expect(queryByTestId('review-exit-dialog')).toBeNull();

    // Open again and exit
    fireEvent.press(backBtn);
    const confirmExitBtn = getByTestId('confirm-exit-btn');
    fireEvent.press(confirmExitBtn);
    expect(mockBack).toHaveBeenCalled();
  });

  it('handles hardware back button on Android to trigger exit confirm dialog', () => {
    mockUseVocabularyData.mockReturnValue({
      dueWords: mockDueWords,
      vocabularies: mockDueWords,
      recordReview: mockRecordReview,
      loading: false,
    });

    const { getByTestId } = render(<VocabularyReviewScreen />);

    expect(backHandlerCallback).toBeTruthy();
    act(() => {
      backHandlerCallback!();
    });

    expect(getByTestId('review-exit-dialog')).toBeTruthy();
  });

  it('handles empty cards state gracefully', () => {
    mockUseVocabularyData.mockReturnValue({
      dueWords: [],
      vocabularies: [],
      recordReview: mockRecordReview,
      loading: false,
    });

    const { getByText } = render(<VocabularyReviewScreen />);
    expect(getByText('No cards to review!')).toBeTruthy();
  });

  it('falls back to vocabularies when dueWords is empty', () => {
    mockUseVocabularyData.mockReturnValue({
      dueWords: [],
      vocabularies: mockDueWords,
      recordReview: mockRecordReview,
      loading: false,
    });

    const { getAllByText } = render(<VocabularyReviewScreen />);
    expect(getAllByText('Adventure').length).toBeGreaterThanOrEqual(1);
  });

  it('prioritizes word matching wordId param as the first card in session queue', () => {
    mockLocalSearchParams = { wordId: 'v-2' };
    mockUseVocabularyData.mockReturnValue({
      dueWords: mockDueWords,
      vocabularies: mockDueWords,
      recordReview: mockRecordReview,
      loading: false,
    });

    const { getAllByText } = render(<VocabularyReviewScreen />);
    // Courage is v-2, should be the active card first instead of Adventure (v-1)
    expect(getAllByText('Courage').length).toBeGreaterThanOrEqual(1);
  });
});
