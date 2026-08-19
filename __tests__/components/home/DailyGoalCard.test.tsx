import React from 'react';
import { render } from '@testing-library/react-native';
import { DailyGoalCard } from '@/components/home/DailyGoalCard';

describe('DailyGoalCard', () => {
  it('renders current and target XP and Daily goal header', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={15} targetXp={20} />
    );
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
    expect(getByText('/ 20 XP')).toBeTruthy();
  });

  it('renders celebration banner when isCompleted is true', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={20} targetXp={20} isCompleted={true} />
    );
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('20')).toBeTruthy();
    expect(getByText('Goal completed! 🎉')).toBeTruthy();
  });

  it('renders correctly when progress is 0 XP', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={0} targetXp={50} />
    );
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('0')).toBeTruthy();
    expect(getByText('/ 50 XP')).toBeTruthy();
  });
});
