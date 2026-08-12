import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UnitHeader } from '@/components/learn/UnitHeader';

describe('UnitHeader', () => {
  it('renders unit title and progress subtitle correctly', () => {
    const { getByText } = render(
      <UnitHeader
        unitTitle="Greetings & Introductions"
        unitNumber={1}
        completedCount={2}
        totalCount={4}
      />
    );

    expect(getByText('Greetings & Introductions')).toBeTruthy();
    expect(getByText('Unit 1 • 2 / 4 lessons')).toBeTruthy();
  });

  it('triggers onBackPress callback when back button is pressed', () => {
    const handleBackPress = jest.fn();
    const { getByTestId } = render(
      <UnitHeader
        unitTitle="Greetings & Introductions"
        unitNumber={1}
        completedCount={2}
        totalCount={4}
        onBackPress={handleBackPress}
      />
    );

    const backButton = getByTestId('unit-header-back-button');
    fireEvent(backButton, 'press');
    expect(handleBackPress).toHaveBeenCalledTimes(1);
  });

  it('triggers onBookmarkPress callback when bookmark button is pressed', () => {
    const handleBookmarkPress = jest.fn();
    const { getByTestId } = render(
      <UnitHeader
        unitTitle="Greetings & Introductions"
        unitNumber={1}
        completedCount={2}
        totalCount={4}
        onBookmarkPress={handleBookmarkPress}
      />
    );

    const bookmarkButton = getByTestId('unit-header-bookmark-button');
    fireEvent(bookmarkButton, 'press');
    expect(handleBookmarkPress).toHaveBeenCalledTimes(1);
  });
});
