import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PracticeCard } from '../../../components/practice/PracticeCard';

describe('PracticeCard', () => {
  it('renders lesson number, typeLabel, title, question count, and xp reward', () => {
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
    expect(getByText('5 phút')).toBeTruthy();
    expect(getByTestId('icon-play-outline')).toBeTruthy();

    fireEvent.press(getByTestId('practice-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders correctly for translation activityType', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PracticeCard
        lessonNumber={1}
        title="Translate sentences"
        activitiesCount={3}
        xpReward={15}
        estimatedMinutes={5}
        status="not_started"
        activityType="translation"
        onPress={onPress}
      />
    );

    expect(getByText('Bài 1 • Ghép câu dịch')).toBeTruthy();
    expect(getByText('Translate sentences')).toBeTruthy();
  });

  it('renders completed status badge with checkmark when completed', () => {
    const onPress = jest.fn();
    const { getByText, getByTestId } = render(
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

    expect(getByText('Đã xong')).toBeTruthy();
    expect(getByTestId('icon-checkmark')).toBeTruthy();
  });

  it('renders in-progress status badge and play icon when in_progress', () => {
    const onPress = jest.fn();
    const { getByText, getByTestId } = render(
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

    expect(getByText('Đang học')).toBeTruthy();
    expect(getByTestId('icon-play-solid')).toBeTruthy();
  });
});
