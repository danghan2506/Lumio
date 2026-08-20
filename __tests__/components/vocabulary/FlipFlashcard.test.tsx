import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FlipFlashcard } from '@/components/vocabulary/FlipFlashcard';
import type { VocabularyWithProgress } from '@/types/vocabulary';

const mockItem: VocabularyWithProgress = {
  id: 'v-1',
  lessonId: 'l-1',
  word: 'Adventure',
  translation: 'Cuộc phiêu lưu',
  pronunciation: '/ədˈvɛntʃər/',
  exampleSentence: 'Life is an exciting adventure.',
  exampleTranslation: 'Cuộc sống là một cuộc phiêu lưu đầy thú vị.',
  status: 'learning',
  correctCount: 1,
  incorrectCount: 0,
  repetitions: 1,
  easeFactor: 2.5,
  intervalDays: 1,
  dueAt: '2026-08-20T00:00:00Z',
  lastReviewedAt: '2026-08-19T00:00:00Z',
};

describe('FlipFlashcard', () => {
  it('renders front face by default and toggles to back face on press', () => {
    const onFlip = jest.fn();
    const { getByTestId, getByText, getAllByText } = render(
      <FlipFlashcard item={mockItem} isFlipped={false} onFlip={onFlip} />
    );

    expect(getAllByText('Adventure').length).toBeGreaterThanOrEqual(1);
    expect(getByText('/ədˈvɛntʃər/')).toBeTruthy();
    expect(getByText('Tap card to reveal answer')).toBeTruthy();
    expect(getByText('Review Word')).toBeTruthy();
    expect(getByText('Cuộc phiêu lưu')).toBeTruthy();

    const card = getByTestId('flip-flashcard-pressable');
    fireEvent.press(card);
    expect(onFlip).toHaveBeenCalled();
  });

  it('renders "New Word" tag when status is unseen', () => {
    const unseenItem: VocabularyWithProgress = {
      ...mockItem,
      status: 'unseen',
    };
    const { getByText } = render(
      <FlipFlashcard item={unseenItem} isFlipped={false} onFlip={jest.fn()} />
    );

    expect(getByText('New Word')).toBeTruthy();
  });

  it('renders correctly when isFlipped is true', () => {
    const { getByText, getAllByText } = render(
      <FlipFlashcard item={mockItem} isFlipped={true} onFlip={jest.fn()} />
    );

    expect(getAllByText('Adventure').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Cuộc phiêu lưu')).toBeTruthy();
    expect(getByText('Translation & Context')).toBeTruthy();
    expect(getByText('Rate your recall below')).toBeTruthy();
  });
});
