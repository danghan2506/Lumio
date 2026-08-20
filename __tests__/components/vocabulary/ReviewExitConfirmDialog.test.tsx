import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReviewExitConfirmDialog } from '@/components/vocabulary/ReviewExitConfirmDialog';

describe('ReviewExitConfirmDialog', () => {
  it('triggers onResume and onExit callbacks', () => {
    const onResume = jest.fn();
    const onExit = jest.fn();

    const { getByTestId, getByText } = render(
      <ReviewExitConfirmDialog visible={true} onResume={onResume} onExit={onExit} />
    );

    expect(getByText('Exit Review Session?')).toBeTruthy();
    expect(getByText(/Answered cards are already saved/i)).toBeTruthy();

    const resumeBtn = getByTestId('resume-review-btn');
    fireEvent.press(resumeBtn);
    expect(onResume).toHaveBeenCalled();

    const exitBtn = getByTestId('confirm-exit-btn');
    fireEvent.press(exitBtn);
    expect(onExit).toHaveBeenCalled();
  });
});
