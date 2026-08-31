import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `lumio:///${path}`,
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import ForgotPasswordScreen from '@/app/(auth)/forgot-password';

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email input and submit button', () => {
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByText('Send reset link')).toBeTruthy();
  });

  it('shows validation error when email is empty', async () => {
    const { getByText, findByText } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByText('Send reset link'));
    expect(await findByText('Please enter your email address.')).toBeTruthy();
    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('calls resetPasswordForEmail with email and deep-link redirect', async () => {
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(
      getByPlaceholderText('you@example.com'),
      'test@example.com',
    );
    fireEvent.press(getByText('Send reset link'));
    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('auth/reset-password'),
        }),
      );
    });
  });

  it('shows the neutral confirmation after a successful submit', async () => {
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });
    const { getByPlaceholderText, getByText, findByText } = render(
      <ForgotPasswordScreen />,
    );
    fireEvent.changeText(
      getByPlaceholderText('you@example.com'),
      'test@example.com',
    );
    fireEvent.press(getByText('Send reset link'));
    expect(
      await findByText(
        "If an account exists for this email, we've sent a reset link.",
      ),
    ).toBeTruthy();
  });

  it('shows a friendly error when Supabase fails', async () => {
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      data: {},
      error: { message: 'Email rate limit exceeded' },
    });
    const { getByPlaceholderText, getByText, findByText } = render(
      <ForgotPasswordScreen />,
    );
    fireEvent.changeText(
      getByPlaceholderText('you@example.com'),
      'test@example.com',
    );
    fireEvent.press(getByText('Send reset link'));
    expect(
      await findByText(
        'Too many requests. Please wait a moment and try again.',
      ),
    ).toBeTruthy();
  });
});
