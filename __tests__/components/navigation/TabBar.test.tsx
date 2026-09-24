import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TabBar } from '@/components/navigation/TabBar';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 10, top: 0, left: 0, right: 0 }),
}));

describe('TabBar', () => {
  const mockNavigate = jest.fn();
  const mockEmit = jest.fn().mockReturnValue({ defaultPrevented: false });

  const mockProps: any = {
    state: {
      index: 0,
      routes: [
        { key: 'index-1', name: 'index' },
        { key: 'learn-2', name: 'learn' },
        { key: 'vocabulary-3', name: 'vocabulary' },
        { key: 'profile-4', name: 'profile' },
      ],
    },
    descriptors: {
      'index-1': { options: {} },
      'learn-2': { options: {} },
      'vocabulary-3': { options: {} },
      'profile-4': { options: {} },
    },
    navigation: {
      navigate: mockNavigate,
      emit: mockEmit,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 4 tabs including Vocab and navigates on tap', () => {
    const { getByText, getByTestId } = render(<TabBar {...mockProps} />);

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Learn')).toBeTruthy();
    expect(getByText('Vocab')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();

    const vocabTab = getByTestId('tab-vocabulary');
    fireEvent.press(vocabTab);

    expect(mockNavigate).toHaveBeenCalledWith('vocabulary');
  });

  it('applies light cream background and subtle border on container', () => {
    const { getByTestId } = render(<TabBar {...mockProps} />);
    const container = getByTestId('tab-bar-container');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: 'rgba(255, 251, 244, 0.95)',
          borderTopColor: 'rgba(36, 27, 74, 0.06)',
        }),
      ])
    );
  });
});
