import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LessonCard } from '@/components/learn/LessonCard';

describe('LessonCard', () => {
  const defaultProps = {
    lessonNumber: 1,
    title: 'Basic Greetings',
    status: 'not_started' as const,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for not_started status', () => {
    const { getByText, getByTestId } = render(
      <LessonCard {...defaultProps} status="not_started" />
    );

    expect(getByText('Basic Greetings')).toBeTruthy();
    expect(getByText('Lesson 1')).toBeTruthy();
    expect(getByTestId('icon-play-outline')).toBeTruthy();
  });

  it('renders correctly for in_progress status with badge', () => {
    const { getByText, getByTestId } = render(
      <LessonCard
        {...defaultProps}
        title="Common Expressions"
        lessonNumber={2}
        status="in_progress"
      />
    );

    expect(getByText('Common Expressions')).toBeTruthy();
    expect(getByText('Lesson 2')).toBeTruthy();
    expect(getByText('In progress')).toBeTruthy();
    expect(getByTestId('icon-play-solid')).toBeTruthy();
  });

  it('renders correctly for completed status with checkmark badge', () => {
    const { getByText, getByTestId } = render(
      <LessonCard
        {...defaultProps}
        title="Alphabet & Sounds"
        lessonNumber={3}
        status="completed"
      />
    );

    expect(getByText('Alphabet & Sounds')).toBeTruthy();
    expect(getByText('Lesson 3')).toBeTruthy();
    expect(getByTestId('icon-checkmark')).toBeTruthy();
  });

  it('renders optional xpReward and estimatedMinutes when provided', () => {
    const { getByText } = render(
      <LessonCard
        {...defaultProps}
        xpReward={20}
        estimatedMinutes={5}
      />
    );

    expect(getByText('+20 XP')).toBeTruthy();
    expect(getByText('5 mins')).toBeTruthy();
  });

  it('triggers onPress callback when card is pressed regardless of status', () => {
    const handlePress = jest.fn();

    const { getByTestId: getByTestIdCompleted } = render(
      <LessonCard {...defaultProps} status="completed" onPress={handlePress} />
    );
    fireEvent(getByTestIdCompleted('lesson-card'), 'press');
    expect(handlePress).toHaveBeenCalledTimes(1);

    const { getByTestId: getByTestIdInProgress } = render(
      <LessonCard {...defaultProps} status="in_progress" onPress={handlePress} />
    );
    fireEvent(getByTestIdInProgress('lesson-card'), 'press');
    expect(handlePress).toHaveBeenCalledTimes(2);

    const { getByTestId: getByTestIdNotStarted } = render(
      <LessonCard {...defaultProps} status="not_started" onPress={handlePress} />
    );
    fireEvent(getByTestIdNotStarted('lesson-card'), 'press');
    expect(handlePress).toHaveBeenCalledTimes(3);
  });
});
