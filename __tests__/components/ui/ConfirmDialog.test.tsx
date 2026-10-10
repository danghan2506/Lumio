import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders nothing when visible=false', () => {
    const { queryByTestId } = render(
      <ConfirmDialog
        visible={false}
        title="T"
        message="M"
        confirmLabel="OK"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(queryByTestId('confirm-dialog')).toBeNull();
  });

  it('renders title/message, defaults cancel to Cancel, and calls callbacks', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByTestId, getByText } = render(
      <ConfirmDialog
        visible
        title="Switch language?"
        message="Progress is saved."
        confirmLabel="Switch"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    expect(getByTestId('confirm-dialog')).toBeTruthy();
    expect(getByText('Switch language?')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
    fireEvent.press(getByTestId('confirm-dialog-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId('confirm-dialog-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while isConfirming', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <ConfirmDialog
        visible
        title="T"
        message="M"
        confirmLabel="Switch"
        onConfirm={onConfirm}
        onCancel={onCancel}
        isConfirming
        testID="sw"
      />
    );
    fireEvent.press(getByTestId('sw-confirm'));
    fireEvent.press(getByTestId('sw-cancel'));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
