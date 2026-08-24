import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LessonHeader } from '@/components/lesson/LessonHeader';

describe('LessonHeader', () => {
  it('renders language flag, lesson order, lesson title, and xp reward badge', () => {
    const onBack = jest.fn();
    const { getByText, getByTestId } = render(
      <LessonHeader
        languageFlag="🇬🇧"
        languageName="English"
        lessonOrder={1}
        lessonTitle="Basic Greetings"
        xpReward={10}
        onBack={onBack}
      />
    );

    expect(getByText('🇬🇧')).toBeTruthy();
    expect(getByText(/Lesson 1: Basic Greetings/i)).toBeTruthy();
    expect(getByText('+10 XP')).toBeTruthy();

    const backButton = getByTestId('lesson-back-btn');
    expect(backButton).toBeTruthy();
    fireEvent.press(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders fallback flag if languageFlag is omitted', () => {
    const onBack = jest.fn();
    const { getByText } = render(
      <LessonHeader
        lessonOrder={2}
        lessonTitle="Ordering Food"
        xpReward={20}
        onBack={onBack}
      />
    );

    expect(getByText('🌐')).toBeTruthy();
    expect(getByText(/Lesson 2: Ordering Food/i)).toBeTruthy();
    expect(getByText('+20 XP')).toBeTruthy();
  });
});
