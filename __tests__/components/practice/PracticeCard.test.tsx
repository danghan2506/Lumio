import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PracticeCard } from '../../../components/practice/PracticeCard';

describe('PracticeCard', () => {
  it('renders lesson number, title, question count, and xp reward', () => {
    const onPress = jest.fn();
    const { getByText, getByTestId } = render(
      <PracticeCard
        lessonNumber={1}
        title="Greetings & Introductions"
        activitiesCount={4}
        xpReward={15}
        estimatedMinutes={5}
        status="not_started"
        onPress={onPress}
      />
    );

    expect(getByText('Bài 1 • Trắc nghiệm')).toBeTruthy();
    expect(getByText('Greetings & Introductions')).toBeTruthy();
    expect(getByText('4 câu hỏi')).toBeTruthy();
    expect(getByText('+15 XP')).toBeTruthy();
    expect(getByText('~5 phút')).toBeTruthy();
    expect(getByText('Luyện tập')).toBeTruthy();

    fireEvent.press(getByTestId('practice-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders completed status badge and "Làm lại" button text when completed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PracticeCard
        lessonNumber={2}
        title="Numbers & Time"
        activitiesCount={5}
        xpReward={20}
        estimatedMinutes={0}
        status="completed"
        onPress={onPress}
      />
    );

    expect(getByText('Đã đạt')).toBeTruthy();
    expect(getByText('Làm lại')).toBeTruthy();
  });

  it('renders in-progress status badge when in_progress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PracticeCard
        lessonNumber={3}
        title="Food & Drinks"
        activitiesCount={3}
        xpReward={10}
        estimatedMinutes={4}
        status="in_progress"
        onPress={onPress}
      />
    );

    expect(getByText('Đang làm')).toBeTruthy();
    expect(getByText('Luyện tập')).toBeTruthy();
  });
});
