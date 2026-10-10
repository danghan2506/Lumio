import React from 'react';
import { render } from '@testing-library/react-native';
import { DailyGoalCard } from '@/components/home/DailyGoalCard';

describe('DailyGoalCard', () => {
  it('renders current and target XP and Daily goal header', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={25} targetXp={40} />
    );
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('25')).toBeTruthy();
    expect(getByText('/ 40 XP')).toBeTruthy();
  });

  it('renders celebration banner when isCompleted is true with target 40 XP', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={40} targetXp={40} isCompleted={true} />
    );
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('40')).toBeTruthy();
    expect(getByText('Goal completed! 🎉')).toBeTruthy();
  });

  it('renders correctly when progress is 0 XP', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={0} targetXp={40} />
    );
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('0')).toBeTruthy();
    expect(getByText('/ 40 XP')).toBeTruthy();
  });

  it('uses default targetXp = 40 when targetXp is omitted', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={10} />
    );
    expect(getByText('/ 40 XP')).toBeTruthy();
  });
});
