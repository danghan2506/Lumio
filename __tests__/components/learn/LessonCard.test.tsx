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
    expect(getByText('Bài 1')).toBeTruthy();
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
    expect(getByText('Bài 2')).toBeTruthy();
    expect(getByText('Đang học')).toBeTruthy();
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
    expect(getByText('Bài 3')).toBeTruthy();
    expect(getByText('Đã xong')).toBeTruthy();
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
    expect(getByText('5 phút')).toBeTruthy();
  });

  it('triggers onPress callback when card is pressed regardless of status', () => {
    const handlePress = jest.fn();

    const { getByTestId: getByTestIdCompleted } = render(
      <LessonCard {...defaultProps} status="completed" onPress={handlePress} />
    );
    fireEvent.press(getByTestIdCompleted('lesson-card'));
    expect(handlePress).toHaveBeenCalledTimes(1);

    const { getByTestId: getByTestIdInProgress } = render(
      <LessonCard {...defaultProps} status="in_progress" onPress={handlePress} />
    );
    fireEvent.press(getByTestIdInProgress('lesson-card'));
    expect(handlePress).toHaveBeenCalledTimes(2);

    const { getByTestId: getByTestIdNotStarted } = render(
      <LessonCard {...defaultProps} status="not_started" onPress={handlePress} />
    );
    fireEvent.press(getByTestIdNotStarted('lesson-card'));
    expect(handlePress).toHaveBeenCalledTimes(3);
  });
});
