import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PracticeCard } from '../../components/practice/PracticeCard';

describe('PracticeCard Component', () => {
  const defaultProps = {
    lessonNumber: 1,
    title: 'Greetings & Introduction',
    activitiesCount: 3,
    xpReward: 10,
    estimatedMinutes: 5,
    status: 'not_started' as const,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for multiple_choice activity by default', () => {
    const { getByText, getByTestId } = render(
      <PracticeCard {...defaultProps} />
    );

    expect(getByText('Bài 1 • Trắc nghiệm')).toBeTruthy();
    expect(getByText('Greetings & Introduction')).toBeTruthy();
    expect(getByText('3 câu hỏi')).toBeTruthy();
    expect(getByText('+10 XP')).toBeTruthy();
    expect(getByText('~5 phút')).toBeTruthy();
    expect(getByText('Luyện tập')).toBeTruthy();

    fireEvent.press(getByTestId('practice-card'));
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('renders correctly for translation activity type', () => {
    const { getByText } = render(
      <PracticeCard
        {...defaultProps}
        activityType="translation"
        activitiesCount={2}
      />
    );

    expect(getByText('Bài 1 • Ghép câu dịch')).toBeTruthy();
    expect(getByText('2 câu dịch')).toBeTruthy();
  });

  it('renders completed status and "Làm lại" button text', () => {
    const { getByText } = render(
      <PracticeCard {...defaultProps} status="completed" />
    );

    expect(getByText('Đã đạt')).toBeTruthy();
    expect(getByText('Làm lại')).toBeTruthy();
  });

  it('renders in_progress status badge', () => {
    const { getByText } = render(
      <PracticeCard {...defaultProps} status="in_progress" />
    );

    expect(getByText('Đang làm')).toBeTruthy();
  });
});
