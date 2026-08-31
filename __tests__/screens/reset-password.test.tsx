import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockSetSession = jest.fn();
const mockUpdateUser = jest.fn();
const mockGetInitialURL = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemove = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('expo-linking', () => ({
  getInitialURL: (...args: unknown[]) => mockGetInitialURL(...args),
  addEventListener: (...args: unknown[]) => mockAddEventListener(...args),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      setSession: (...args: unknown[]) => mockSetSession(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  },
}));

import ResetPasswordScreen from '@/app/(auth)/reset-password';

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddEventListener.mockReturnValue({ remove: mockRemove });
  });

  it('establishes a session from the deep link on mount', async () => {
    mockSetSession.mockResolvedValue({ data: {}, error: null });
    mockGetInitialURL.mockResolvedValue(
      'lumio://auth/reset-password#access_token=abc&refresh_token=def&type=recovery',
    );
    render(<ResetPasswordScreen />);
    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: 'abc',
        refresh_token: 'def',
      });
    });
  });

  it('shows an error state when the link carries no tokens', async () => {
    mockGetInitialURL.mockResolvedValue('lumio://auth/reset-password#type=recovery');
    const { findByText } = render(<ResetPasswordScreen />);
    expect(
      await findByText('This reset link is invalid or has expired.'),
    ).toBeTruthy();
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it('establishes a session from a warm-start deep link event', async () => {
    mockSetSession.mockResolvedValue({ data: {}, error: null });
    mockGetInitialURL.mockResolvedValue(null);
    render(<ResetPasswordScreen />);

    // Warm start: no launch URL, so the screen waits for the link event.
    expect(mockAddEventListener).toHaveBeenCalledWith('url', expect.any(Function));
    const urlListener = mockAddEventListener.mock.calls[0][1] as (e: {
      url: string;
    }) => void;
    act(() => {
      urlListener({
        url: 'lumio://auth/reset-password#access_token=warm1&refresh_token=warm2&type=recovery',
      });
    });
    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: 'warm1',
        refresh_token: 'warm2',
      });
    });
  });

  it('shows the invalid state when a warm-start link carries no tokens', async () => {
    mockGetInitialURL.mockResolvedValue(null);
    const { findByText } = render(<ResetPasswordScreen />);

    expect(mockAddEventListener).toHaveBeenCalledWith('url', expect.any(Function));
    const urlListener = mockAddEventListener.mock.calls[0][1] as (e: {
      url: string;
    }) => void;
    act(() => {
      urlListener({ url: 'lumio://auth/reset-password#type=recovery' });
    });
    expect(
      await findByText('This reset link is invalid or has expired.'),
    ).toBeTruthy();
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it('unsubscribes the URL listener on unmount', async () => {
    mockSetSession.mockResolvedValue({ data: {}, error: null });
    mockGetInitialURL.mockResolvedValue(
      'lumio://auth/reset-password#access_token=abc&refresh_token=def',
    );
    const { findByPlaceholderText, unmount } = render(<ResetPasswordScreen />);
    await findByPlaceholderText('New password');
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('validates password length and match before submitting', async () => {
    mockSetSession.mockResolvedValue({ data: {}, error: null });
    mockGetInitialURL.mockResolvedValue(
      'lumio://auth/reset-password#access_token=abc&refresh_token=def',
    );
    const { findByPlaceholderText, getByPlaceholderText, getByText, findByText } =
      render(<ResetPasswordScreen />);
    await findByPlaceholderText('New password');
    fireEvent.changeText(getByPlaceholderText('New password'), 'short');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'short');
    fireEvent.press(getByText('Update password'));
    expect(
      await findByText('Password must be at least 8 characters.'),
    ).toBeTruthy();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('calls updateUser and navigates to login on success', async () => {
    mockSetSession.mockResolvedValue({ data: {}, error: null });
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });
    mockGetInitialURL.mockResolvedValue(
      'lumio://auth/reset-password#access_token=abc&refresh_token=def',
    );
    const { findByPlaceholderText, getByPlaceholderText, getByText, findByText } =
      render(<ResetPasswordScreen />);
    await findByPlaceholderText('New password');
    fireEvent.changeText(getByPlaceholderText('New password'), 'newpassword1');
    fireEvent.changeText(
      getByPlaceholderText('Confirm new password'),
      'newpassword1',
    );
    fireEvent.press(getByText('Update password'));
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'newpassword1',
      });
    });
    expect(await findByText('Password updated! 🎉')).toBeTruthy();
    await waitFor(
      () => {
        expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
      },
      { timeout: 3000 },
    );
  });
});
