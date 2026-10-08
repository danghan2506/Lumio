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
