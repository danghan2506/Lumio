import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SegmentedToggle } from '@/components/learn/SegmentedToggle';

describe('SegmentedToggle', () => {
  it('renders Lessons and Practice tabs', () => {
    const handleTabChange = jest.fn();
    const { getByText } = render(
      <SegmentedToggle activeTab="lessons" onTabChange={handleTabChange} />
    );

    expect(getByText('Lessons')).toBeTruthy();
    expect(getByText('Practice')).toBeTruthy();
  });

  it('calls onTabChange with "practice" when Practice tab is pressed', () => {
    const handleTabChange = jest.fn();
    const { getByText } = render(
      <SegmentedToggle activeTab="lessons" onTabChange={handleTabChange} />
    );

    fireEvent(getByText('Practice'), 'press');
    expect(handleTabChange).toHaveBeenCalledWith('practice');
  });

  it('calls onTabChange with "lessons" when Lessons tab is pressed', () => {
    const handleTabChange = jest.fn();
    const { getByText } = render(
      <SegmentedToggle activeTab="practice" onTabChange={handleTabChange} />
    );

    fireEvent(getByText('Lessons'), 'press');
    expect(handleTabChange).toHaveBeenCalledWith('lessons');
  });
});
