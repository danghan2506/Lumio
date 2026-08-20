import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VocabularyHeroCard } from '@/components/vocabulary/VocabularyHeroCard';

describe('VocabularyHeroCard', () => {
  it('renders Due state with CTA button', () => {
    const onStartReview = jest.fn();
    const { getByText, getByTestId } = render(
      <VocabularyHeroCard
        dueCount={12}
        masteredCount={24}
        retentionRate={92}
        onStartReview={onStartReview}
      />
    );

    expect(getByText('12')).toBeTruthy();
    expect(getByText('24')).toBeTruthy();
    expect(getByText('92%')).toBeTruthy();
    expect(getByText('Start Daily Review')).toBeTruthy();

    const ctaBtn = getByTestId('start-review-btn');
    fireEvent.press(ctaBtn);
    expect(onStartReview).toHaveBeenCalled();
  });

  it('renders All-Caught-Up state when dueCount is 0', () => {
    const onPracticeAll = jest.fn();
    const { getByText, getByTestId } = render(
      <VocabularyHeroCard
        dueCount={0}
        masteredCount={30}
        retentionRate={100}
        onStartReview={jest.fn()}
        onPracticeAll={onPracticeAll}
      />
    );

    expect(getByText(/All caught up/i)).toBeTruthy();
    const practiceBtn = getByTestId('practice-all-btn');
    fireEvent.press(practiceBtn);
    expect(onPracticeAll).toHaveBeenCalled();
  });
});
