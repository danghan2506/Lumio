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

  it('triggers onPrevPress when previous button is tapped', () => {
    const handlePrevPress = jest.fn();
    const { getByTestId } = render(
      <UnitHeader
        unitTitle="Greetings & Introductions"
        unitNumber={2}
        completedCount={1}
        totalCount={4}
        canGoPrev={true}
        onPrevPress={handlePrevPress}
      />
    );

    const prevButton = getByTestId('unit-header-prev');
    fireEvent.press(prevButton);
    expect(handlePrevPress).toHaveBeenCalledTimes(1);
  });

  it('disables previous button when canGoPrev is false', () => {
    const handlePrevPress = jest.fn();
    const { getByTestId } = render(
      <UnitHeader
        unitTitle="Greetings & Introductions"
        unitNumber={1}
        completedCount={0}
        totalCount={4}
        canGoPrev={false}
        onPrevPress={handlePrevPress}
      />
    );

    const prevButton = getByTestId('unit-header-prev');
    expect(prevButton.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(prevButton);
    expect(handlePrevPress).not.toHaveBeenCalled();
  });

  it('triggers onNextPress when next button is tapped', () => {
    const handleNextPress = jest.fn();
    const { getByTestId } = render(
      <UnitHeader
        unitTitle="Greetings & Introductions"
        unitNumber={1}
        completedCount={2}
        totalCount={4}
        canGoNext={true}
        onNextPress={handleNextPress}
      />
    );

    const nextButton = getByTestId('unit-header-next');
    fireEvent.press(nextButton);
    expect(handleNextPress).toHaveBeenCalledTimes(1);
  });

  it('disables next button when canGoNext is false', () => {
    const handleNextPress = jest.fn();
    const { getByTestId } = render(
      <UnitHeader
        unitTitle="Greetings & Introductions"
        unitNumber={3}
        completedCount={4}
        totalCount={4}
        canGoNext={false}
        onNextPress={handleNextPress}
      />
    );

    const nextButton = getByTestId('unit-header-next');
    expect(nextButton.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(nextButton);
    expect(handleNextPress).not.toHaveBeenCalled();
  });

  it('triggers onTitlePress when center title pill is tapped', () => {
    const handleTitlePress = jest.fn();
    const { getByTestId } = render(
      <UnitHeader
        unitTitle="Greetings & Introductions"
        unitNumber={1}
        completedCount={2}
        totalCount={4}
        onTitlePress={handleTitlePress}
      />
    );

    const titleButton = getByTestId('unit-header-title');
    fireEvent.press(titleButton);
    expect(handleTitlePress).toHaveBeenCalledTimes(1);
  });

  it('has appropriate accessibility labels on interactive elements', () => {
    const { getByLabelText } = render(
      <UnitHeader
        unitTitle="Greetings & Introductions"
        unitNumber={2}
        completedCount={1}
        totalCount={4}
        canGoPrev={true}
        canGoNext={true}
        onPrevPress={() => {}}
        onNextPress={() => {}}
        onTitlePress={() => {}}
      />
    );

    expect(getByLabelText('Previous unit')).toBeTruthy();
    expect(getByLabelText('Next unit')).toBeTruthy();
    expect(getByLabelText('Select unit')).toBeTruthy();
  });

  it('maintains backward compatibility with onBackPress and legacy testID', () => {
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
    fireEvent.press(backButton);
    expect(handleBackPress).toHaveBeenCalledTimes(1);
  });

  it('maintains backward compatibility with onBookmarkPress and legacy testID', () => {
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
    fireEvent.press(bookmarkButton);
    expect(handleBookmarkPress).toHaveBeenCalledTimes(1);
  });
});
