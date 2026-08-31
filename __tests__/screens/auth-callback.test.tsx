import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockSetSession = jest.fn();
const mockGetInitialURL = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('expo-linking', () => ({
  getInitialURL: (...args: unknown[]) => mockGetInitialURL(...args),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      setSession: (...args: unknown[]) => mockSetSession(...args),
    },
  },
}));

import AuthCallbackScreen from '@/app/(auth)/callback';

describe('AuthCallbackScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets the session and navigates home when tokens are present', async () => {
    mockSetSession.mockResolvedValue({ data: {}, error: null });
    mockGetInitialURL.mockResolvedValue(
      'lumio://auth/callback#access_token=abc&refresh_token=def',
    );
    render(<AuthCallbackScreen />);
    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: 'abc',
        refresh_token: 'def',
      });
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('navigates to login when the URL has no tokens', async () => {
    mockGetInitialURL.mockResolvedValue('lumio://auth/callback');
    render(<AuthCallbackScreen />);
    await waitFor(() => {
      expect(mockSetSession).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
  });
});
