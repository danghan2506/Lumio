import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';

const mockReplace = jest.fn();
let authStateCallback: ((event: string, session: unknown) => void) | null = null;
const mockUnsubscribe = jest.fn();

jest.mock('expo-router', () => {
  const MockStack = ({ children }: { children: React.ReactNode }) => children;
  MockStack.Screen = () => null;
  return {
    __esModule: true,
    Stack: MockStack,
    useRouter: () => ({ replace: mockReplace }),
    useSegments: () => mockSegments,
  };
});

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('@expo-google-fonts/fredoka', () => ({
  useFonts: () => [true, null],
  Fredoka_500Medium: 'Fredoka_500Medium',
  Fredoka_600SemiBold: 'Fredoka_600SemiBold',
  Fredoka_700Bold: 'Fredoka_700Bold',
}));

jest.mock('@expo-google-fonts/plus-jakarta-sans', () => ({
  useFonts: () => [true, null],
  PlusJakartaSans_400Regular: 'x',
  PlusJakartaSans_500Medium: 'x',
  PlusJakartaSans_600SemiBold: 'u',
  PlusJakartaSans_700Bold: 'x',
}));

jest.mock('@expo-google-fonts/jetbrains-mono', () => ({
  JetBrainsMono_500Medium: 'x',
}));

jest.mock('react-native-safe-area-context', () => {
  const ActualView = jest.requireActual('react-native').View;
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    __esModule: true,
  };
});

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
    },
  },
}));

jest.mock('@/store/useLanguageStore', () => ({
  useLanguageStore: {
    getState: () => ({ hasSelectedLanguage: true }),
  },
}));

import RootLayout from '@/app/_layout';

jest.mock('../../global.css', () => ({}));

// Mutable holder for useSegments' return value, set per-test.
let mockSegments: string[] = ['(auth)', 'reset-password'];

describe('RootLayout auth redirect guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStateCallback = null;
    mockSegments = ['(auth)', 'reset-password'];
  });

  it('does NOT redirect away from reset-password when a session is established during recovery', async () => {
    render(<RootLayout />);
    await waitFor(() => {
      expect(authStateCallback).not.toBeNull();
    });
    act(() => {
      authStateCallback!('SIGNED_IN', { user: { id: 'u1' } });
    });
    // The layout must leave the user on the reset screen to enter a new password.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('still redirects from other (auth) screens to (tabs) on SIGNED_IN (OAuth behavior preserved)', async () => {
    mockSegments = ['(auth)', 'callback'];
    render(<RootLayout />);
    await waitFor(() => {
      expect(authStateCallback).not.toBeNull();
    });
    act(() => {
      authStateCallback!('SIGNED_IN', { user: { id: 'u1' } });
    });
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
