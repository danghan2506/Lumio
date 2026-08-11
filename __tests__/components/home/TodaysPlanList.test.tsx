import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TodaysPlanList } from '@/components/home/TodaysPlanList';
import { AiVideoHighlightCard } from '@/components/home/AiVideoHighlightCard';
import { DailyPlanItem } from '@/types/home';

const mockItems: DailyPlanItem[] = [
  {
    id: 'plan-1',
    type: 'lesson',
    title: 'Lesson: At the café',
    subtitle: 'Order coffee and pastries',
    completed: true,
    active: false,
    lessonId: 'cafe-1',
  },
  {
    id: 'plan-2',
    type: 'ai_conversation',
    title: 'AI Conversation: Talk about your day',
    subtitle: '3-min voice chat with Lumio',
    completed: false,
    active: true,
  },
  {
    id: 'plan-3',
    type: 'vocabulary',
    title: 'New words: 10 words review',
    subtitle: 'Flashcard practice',
    completed: false,
    active: false,
  },
];

describe('TodaysPlanList', () => {
  it('renders header "Today\'s plan", "View all" link, and item cards', () => {
    const handleViewAll = jest.fn();
    const handleItemPress = jest.fn();

    const { getByText } = render(
      <TodaysPlanList
        items={mockItems}
        onItemPress={handleItemPress}
        onViewAll={handleViewAll}
      />
    );

    expect(getByText("Today's plan")).toBeTruthy();
    expect(getByText('View all')).toBeTruthy();
    expect(getByText('Lesson: At the café')).toBeTruthy();
    expect(getByText('Order coffee and pastries')).toBeTruthy();
    expect(getByText('AI Conversation: Talk about your day')).toBeTruthy();
    expect(getByText('New words: 10 words review')).toBeTruthy();

    const viewAllBtn = getByText('View all');
    fireEvent(viewAllBtn, 'press');
    expect(handleViewAll).toHaveBeenCalledTimes(1);

    const firstItem = getByText('Lesson: At the café');
    fireEvent(firstItem, 'press');
    expect(handleItemPress).toHaveBeenCalledWith(mockItems[0]);
  });
});

describe('AiVideoHighlightCard', () => {
  it('renders "NEXT UP", "AI Video Call", subtext and handles onStartCall press', () => {
    const handleStartCall = jest.fn();

    const { getByText, getByTestId } = render(
      <AiVideoHighlightCard onStartCall={handleStartCall} />
    );

    expect(getByText('NEXT UP')).toBeTruthy();
    expect(getByText('AI Video Call')).toBeTruthy();
    expect(getByText('Practice speaking with Lumio')).toBeTruthy();

    const callButton = getByTestId('start-call-button');
    fireEvent(callButton, 'press');
    expect(handleStartCall).toHaveBeenCalledTimes(1);
  });
});
