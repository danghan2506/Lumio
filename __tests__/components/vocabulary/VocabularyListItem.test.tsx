import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VocabularyListItem } from '@/components/vocabulary/VocabularyListItem';
import type { VocabularyWithProgress } from '@/types/vocabulary';

const mockItem: VocabularyWithProgress = {
  id: 'v-1',
  lessonId: 'l-1',
  word: 'Enthusiastic',
  translation: 'Nhiệt tình',
  pronunciation: '/ɪnˌθjuːziˈæstɪk/',
  exampleSentence: 'She is enthusiastic about learning.',
  exampleTranslation: 'Cô ấy rất nhiệt tình học tập.',
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
  it('renders word, phonetic, translation, and status badge', () => {
    const { getByText } = render(<VocabularyListItem item={mockItem} />);

    expect(getByText('Enthusiastic')).toBeTruthy();
    expect(getByText('/ɪnˌθjuːziˈæstɪk/')).toBeTruthy();
    expect(getByText('Nhiệt tình')).toBeTruthy();
    expect(getByText('Learning')).toBeTruthy();
    expect(getByText('She is enthusiastic about learning.')).toBeTruthy();
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
