import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Toast, useToast, type ToastApi } from '@/components/ui/Toast';

// Host that wires the ref-based API after mount, mirroring real screen usage
function ToastHost({ action }: { action?: (api: ToastApi) => void }) {
  const toast = useToast();
  React.useEffect(() => {
    action?.({ show: (opts) => toast.ref.current?.show(opts) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <Toast ref={toast.ref} />;
}

describe('components/ui/Toast', () => {
  it('renders nothing when no toast is shown', () => {
    const { queryByTestId } = render(<Toast ref={React.createRef<ToastApi>()} />);
    expect(queryByTestId('toast-container')).toBeNull();
  });

  it('shows a success message and auto-hides after the timeout', async () => {
    jest.useFakeTimers();
    const { queryByTestId, getByTestId } = render(
      <ToastHost
        action={(api) => api.show({ message: 'Display name updated ✓', type: 'success' })}
      />
    );

    await act(async () => {});
    expect(getByTestId('toast-message').props.children).toBe('Display name updated ✓');

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() => {
      expect(queryByTestId('toast-container')).toBeNull();
    });
    jest.useRealTimers();
  });

  it('shows an error variant when type is error', async () => {
    const { getByTestId } = render(
      <ToastHost
        action={(api) => api.show({ message: 'Failed to update display name', type: 'error' })}
      />
    );
    await act(async () => {});
    expect(getByTestId('toast-container').props.accessibilityLiveRegion).toBe('assertive');
    expect(getByTestId('toast-message').props.children).toBe('Failed to update display name');
  });

  it('replaces an active toast with a new one', async () => {
    const { getByTestId } = render(
      <ToastHost
        action={(api) => {
          api.show({ message: 'First', type: 'success' });
          api.show({ message: 'Second', type: 'error' });
        }}
      />
    );
    await act(async () => {});
    expect(getByTestId('toast-message').props.children).toBe('Second');
  });
});
