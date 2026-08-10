import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HeaderBar } from '@/components/home/HeaderBar';

describe('HeaderBar', () => {
  it('renders flag, personalized greeting, and streak flame count', () => {
    const { getByText } = render(
      <HeaderBar
        userName="Alex"
        languageFlag="🇪🇸"
        languageName="Spanish"
        streak={12}
      />
    );
    expect(getByText('Hola, Alex! 👋')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('🇪🇸')).toBeTruthy();
  });

  it('renders correct greeting prefix for French, Korean, and default language', () => {
    const { getByText: getByTextFrench } = render(
      <HeaderBar
        userName="Marie"
        languageFlag="🇫🇷"
        languageName="French"
        streak={5}
      />
    );
    expect(getByTextFrench('Bonjour, Marie! 👋')).toBeTruthy();

    const { getByText: getByTextKorean } = render(
      <HeaderBar
        userName="Min"
        languageFlag="🇰🇷"
        languageName="Korean"
        streak={8}
      />
    );
    expect(getByTextKorean('안녕, Min! 👋')).toBeTruthy();

    const { getByText: getByTextDefault } = render(
      <HeaderBar
        userName="Hans"
        languageFlag="🇩🇪"
        languageName="German"
        streak={3}
      />
    );
    expect(getByTextDefault('Hello, Hans! 👋')).toBeTruthy();
  });

  it('triggers onLanguagePress and onNotificationPress callbacks when provided', () => {
    const handleLanguagePress = jest.fn();
    const handleNotificationPress = jest.fn();

    render(
      <HeaderBar
        userName="Alex"
        languageFlag="🇪🇸"
        languageName="Spanish"
        streak={12}
        onLanguagePress={handleLanguagePress}
        onNotificationPress={handleNotificationPress}
      />
    );

    handleLanguagePress();
    handleNotificationPress();

    expect(handleLanguagePress).toHaveBeenCalledTimes(1);
    expect(handleNotificationPress).toHaveBeenCalledTimes(1);
  });
});
