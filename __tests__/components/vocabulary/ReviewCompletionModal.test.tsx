import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReviewCompletionModal } from '@/components/vocabulary/ReviewCompletionModal';

describe('ReviewCompletionModal', () => {
  it('renders XP reward, summary counts and triggers onClose', () => {
    const onClose = jest.fn();
    const { getByText, getByTestId } = render(
      <ReviewCompletionModal
        visible={true}
        xpEarned={25}
        totalCards={10}
        correctCount={8}
        graduatedCount={2}
        onClose={onClose}
      />
    );

    expect(getByText('+25 XP Earned')).toBeTruthy();
    expect(getByText('80%')).toBeTruthy();
    expect(getByText('Accuracy')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
    expect(getByText('Reviewed')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('Graduated')).toBeTruthy();

    const closeBtn = getByTestId('close-completion-modal-btn');
    fireEvent.press(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
