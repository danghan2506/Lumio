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

  it('renders correctly when goal is met or exceeded', () => {
    const { getByText } = render(
      <DailyGoalCard currentXp={25} targetXp={20} />
    );
    expect(getByText('Daily goal')).toBeTruthy();
    expect(getByText('25')).toBeTruthy();
    expect(getByText('/ 20 XP')).toBeTruthy();
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
