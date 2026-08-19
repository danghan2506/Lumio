import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HeroContinueCard } from '@/components/home/HeroContinueCard';

describe('HeroContinueCard', () => {
  it('renders dynamic lesson title, unit title, chips and handles continue press', () => {
    const handleContinue = jest.fn();

    const { getByText } = render(
      <HeroContinueCard
        lessonTitle="Greetings & Introductions"
        unitTitle="Unit 1"
        xpReward={10}
        estimatedMinutes={5}
        isCourseCompleted={false}
        onContinue={handleContinue}
      />
    );

    expect(getByText('CONTINUE LEARNING')).toBeTruthy();
    expect(getByText('Unit 1 • Greetings & Introductions')).toBeTruthy();
    expect(getByText('+10 XP')).toBeTruthy();
    expect(getByText('~5 min')).toBeTruthy();

    const continueButton = getByText('Continue');
    fireEvent(continueButton, 'press');
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });

  it('renders Course Completed state when isCourseCompleted is true', () => {
    const { getByText } = render(
      <HeroContinueCard
        lessonTitle="Final Mastery"
        unitTitle="Unit 2"
        xpReward={20}
        estimatedMinutes={10}
        isCourseCompleted={true}
      />
    );

    expect(getByText('COURSE COMPLETED 🎉')).toBeTruthy();
    expect(getByText('Review')).toBeTruthy();
  });
});
