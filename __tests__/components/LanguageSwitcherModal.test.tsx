import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LanguageSwitcherModal } from '@/components/profile/LanguageSwitcherModal';

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

describe('LanguageSwitcherModal', () => {
  it('renders nothing when visible=false', () => {
    const { queryByTestId } = render(
      <LanguageSwitcherModal
        visible={false}
        activeLanguageId="es"
        onSelect={() => {}}
        onClose={() => {}}
      />
    );
    expect(queryByTestId('language-switcher-modal')).toBeNull();
  });

  it('lists all languages and marks the active one', () => {
    const { getByTestId, getByText } = render(
      <LanguageSwitcherModal
        visible
        activeLanguageId="es"
        onSelect={() => {}}
        onClose={() => {}}
      />
    );
    expect(getByTestId('language-switcher-modal')).toBeTruthy();
    expect(getByText('Spanish')).toBeTruthy();
    expect(getByText('Korean')).toBeTruthy();
    expect(getByTestId('language-option-es')).toBeTruthy();
  });

  it('emits the chosen language and closes via backdrop/close button', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const { getByTestId } = render(
      <LanguageSwitcherModal
        visible
        activeLanguageId="es"
        onSelect={onSelect}
        onClose={onClose}
      />
    );
    fireEvent.press(getByTestId('language-option-ko'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].id).toBe('ko');
    fireEvent.press(getByTestId('language-switcher-backdrop'));
    fireEvent.press(getByTestId('language-switcher-close-button'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
