import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AudioControls } from '@/components/lesson/AudioControls';
import { colors } from '@/theme/colors';

describe('AudioControls', () => {
  it('calls onToggleMute when mic button is pressed and call is joined', () => {
    const onToggleMute = jest.fn();
    const onToggleCaptions = jest.fn();
    const { getByTestId } = render(
      <AudioControls
        isMuted={false}
        showCaptions={true}
        isCallJoined={true}
        onToggleMute={onToggleMute}
        onToggleCaptions={onToggleCaptions}
      />
    );

    const micButton = getByTestId('mic-toggle');
    fireEvent.press(micButton);
    expect(onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('does not call onToggleMute when mic button is pressed and call is not joined', () => {
    const onToggleMute = jest.fn();
    const onToggleCaptions = jest.fn();
    const { getByTestId } = render(
      <AudioControls
        isMuted={false}
        showCaptions={true}
        isCallJoined={false}
        onToggleMute={onToggleMute}
        onToggleCaptions={onToggleCaptions}
      />
    );

    const micButton = getByTestId('mic-toggle');
    fireEvent.press(micButton);
    expect(onToggleMute).not.toHaveBeenCalled();
  });

  it('calls onToggleCaptions when captions button is pressed', () => {
    const onToggleMute = jest.fn();
    const onToggleCaptions = jest.fn();
    const { getByTestId } = render(
      <AudioControls
        isMuted={false}
        showCaptions={true}
        isCallJoined={true}
        onToggleMute={onToggleMute}
        onToggleCaptions={onToggleCaptions}
      />
    );

    const captionsButton = getByTestId('captions-toggle');
    fireEvent.press(captionsButton);
    expect(onToggleCaptions).toHaveBeenCalledTimes(1);
  });

  it('reflects unmuted visual state on mic button', () => {
    const { getByTestId } = render(
      <AudioControls
        isMuted={false}
        showCaptions={true}
        isCallJoined={true}
        onToggleMute={jest.fn()}
        onToggleCaptions={jest.fn()}
      />
    );

    const micButton = getByTestId('mic-toggle');
    expect(micButton.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: colors.lumioCoral,
      })
    );
  });

  it('reflects muted visual state on mic button', () => {
    const { getByTestId } = render(
      <AudioControls
        isMuted={true}
        showCaptions={true}
        isCallJoined={true}
        onToggleMute={jest.fn()}
        onToggleCaptions={jest.fn()}
      />
    );

    const micButton = getByTestId('mic-toggle');
    expect(micButton.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: colors.deepIndigo,
        borderColor: colors.lumioCoral,
      })
    );
  });

  it('reflects showCaptions active vs inactive visual state and renders speaker indicator', () => {
    const { getByTestId, rerender } = render(
      <AudioControls
        isMuted={false}
        showCaptions={true}
        isCallJoined={true}
        onToggleMute={jest.fn()}
        onToggleCaptions={jest.fn()}
      />
    );

    const activeCaptionsButton = getByTestId('captions-toggle');
    expect(activeCaptionsButton.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: colors.lavenderMist,
      })
    );
    expect(getByTestId('audio-indicator')).toBeTruthy();

    rerender(
      <AudioControls
        isMuted={false}
        showCaptions={false}
        isCallJoined={true}
        onToggleMute={jest.fn()}
        onToggleCaptions={jest.fn()}
      />
    );

    const inactiveCaptionsButton = getByTestId('captions-toggle');
    expect(inactiveCaptionsButton.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: 'rgba(94,90,128,0.15)',
      })
    );
  });
});
