import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LessonSummaryModal } from '@/components/lesson/LessonSummaryModal';

describe('LessonSummaryModal', () => {
  it('renders completion message "Lesson Completed!" and XP reward badge when visible', () => {
    const onClaimRewards = jest.fn();
    const { getByText, getByTestId } = render(
      <LessonSummaryModal
        visible={true}
        xpReward={25}
        onClaimRewards={onClaimRewards}
      />
    );

    expect(getByText('Lesson Completed!')).toBeTruthy();
    expect(getByText('+25 XP')).toBeTruthy();
    expect(getByText(/Awesome job practicing your spoken language today/i)).toBeTruthy();
    expect(getByTestId('claim-rewards-btn')).toBeTruthy();
  });

  it('renders progress error and handles retry press when progressError is set', () => {
    const onRetryProgress = jest.fn();
    const { getByText, getByTestId } = render(
      <LessonSummaryModal
        visible={true}
        xpReward={15}
        progressError="Network timeout"
        onRetryProgress={onRetryProgress}
        onClaimRewards={jest.fn()}
      />
    );

    expect(getByText(/Could not save your progress: Network timeout/i)).toBeTruthy();
    const retryBtn = getByTestId('retry-progress-btn');
    expect(retryBtn).toBeTruthy();
    fireEvent.press(retryBtn);
    expect(onRetryProgress).toHaveBeenCalledTimes(1);
  });

  it('handles feedback text change', () => {
    const onChangeFeedback = jest.fn();
    const { getByPlaceholderText } = render(
      <LessonSummaryModal
        visible={true}
        xpReward={20}
        userFeedback=""
        onChangeFeedback={onChangeFeedback}
        onClaimRewards={jest.fn()}
      />
    );

    const input = getByPlaceholderText(/How did you find this lesson\?/i);
    expect(input).toBeTruthy();
    fireEvent.changeText(input, 'Great lesson, loved the pronunciation tips!');
    expect(onChangeFeedback).toHaveBeenCalledWith('Great lesson, loved the pronunciation tips!');
  });

  it('handles "Claim Rewards" button press when there is no error', () => {
    const onClaimRewards = jest.fn();
    const { getByTestId } = render(
      <LessonSummaryModal
        visible={true}
        xpReward={30}
        onClaimRewards={onClaimRewards}
      />
    );

    const claimBtn = getByTestId('claim-rewards-btn');
    fireEvent.press(claimBtn);
    expect(onClaimRewards).toHaveBeenCalledTimes(1);
  });

  it('disables or does not call onClaimRewards when progressError is present', () => {
    const onClaimRewards = jest.fn();
    const { getByTestId } = render(
      <LessonSummaryModal
        visible={true}
        xpReward={30}
        progressError="Database error"
        onClaimRewards={onClaimRewards}
      />
    );

    const claimBtn = getByTestId('claim-rewards-btn');
    fireEvent.press(claimBtn);
    expect(onClaimRewards).not.toHaveBeenCalled();
  });
});
