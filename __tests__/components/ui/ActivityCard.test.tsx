import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityCard } from '@/components/ui/ActivityCard';

describe('ActivityCard', () => {
  const defaultProps = {
    orderNumber: 1,
    title: 'Basic Greetings',
    status: 'not_started' as const,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for not_started status', () => {
    const { getByText, getByTestId } = render(
      <ActivityCard {...defaultProps} status="not_started" />
    );

    expect(getByText('Basic Greetings')).toBeTruthy();
    expect(getByText('Lesson 1')).toBeTruthy();
    expect(getByTestId('icon-play-outline')).toBeTruthy();
  });

  it('renders correctly for in_progress status with "In Progress" badge and solid play icon', () => {
    const { getByText, getByTestId } = render(
      <ActivityCard
        {...defaultProps}
        orderNumber={2}
        title="Common Expressions"
        status="in_progress"
      />
    );

    expect(getByText('Common Expressions')).toBeTruthy();
    expect(getByText('Lesson 2')).toBeTruthy();
    expect(getByText('In Progress')).toBeTruthy();
    expect(getByTestId('icon-play-solid')).toBeTruthy();
  });

  it('renders correctly for completed status with "Completed" badge and checkmark icon', () => {
    const { getByText, getByTestId } = render(
      <ActivityCard
        {...defaultProps}
        orderNumber={3}
        title="Alphabet & Sounds"
        status="completed"
      />
    );

    expect(getByText('Alphabet & Sounds')).toBeTruthy();
    expect(getByText('Lesson 3')).toBeTruthy();
    expect(getByText('Completed')).toBeTruthy();
    expect(getByTestId('icon-checkmark')).toBeTruthy();
  });

  it('renders typeLabel when provided', () => {
    const { getByText } = render(
      <ActivityCard
        {...defaultProps}
        typeLabel="Quiz"
      />
    );

    expect(getByText('Lesson 1 • Quiz')).toBeTruthy();
  });

  it('renders metadata items (questions count, xpReward, estimatedMinutes) when provided', () => {
    const { getByText } = render(
      <ActivityCard
        {...defaultProps}
        questionsCount={4}
        xpReward={20}
        estimatedMinutes={5}
      />
    );

    expect(getByText('4 questions')).toBeTruthy();
    expect(getByText('+20 XP')).toBeTruthy();
    expect(getByText('5 mins')).toBeTruthy();
  });

  it('triggers onPress callback when card is pressed', () => {
    const handlePress = jest.fn();
    const { getByTestId } = render(
      <ActivityCard {...defaultProps} onPress={handlePress} />
    );

    fireEvent.press(getByTestId('activity-card'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
});
