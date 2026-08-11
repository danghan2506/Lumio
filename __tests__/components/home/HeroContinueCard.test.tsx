import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HeroContinueCard } from '@/components/home/HeroContinueCard';

describe('HeroContinueCard', () => {
  it('renders "CONTINUE LEARNING", course title, and handles press on the "Continue" button', () => {
    const handleContinue = jest.fn();

    const { getByText } = render(
      <HeroContinueCard
        language="Spanish"
        level="A1"
        unitTitle="Unit 2"
        onContinue={handleContinue}
      />
    );

    expect(getByText('CONTINUE LEARNING')).toBeTruthy();
    expect(getByText('Spanish A1 • Unit 2')).toBeTruthy();

    const continueButton = getByText('Continue');
    expect(continueButton).toBeTruthy();

    fireEvent(continueButton, 'press');
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });

  it('renders correctly without onContinue callback', () => {
    const { getByText } = render(
      <HeroContinueCard language="French" level="B2" unitTitle="Basics 1" />
    );

    expect(getByText('CONTINUE LEARNING')).toBeTruthy();
    expect(getByText('French B2 • Basics 1')).toBeTruthy();
  });
});
