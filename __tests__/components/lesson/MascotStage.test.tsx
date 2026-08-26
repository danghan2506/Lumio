import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MascotStage } from '@/components/lesson/MascotStage';

describe('MascotStage', () => {
  it('renders connecting state when call is connecting or joining or teacher is connecting', () => {
    const { getByText: getByText1 } = render(
      <MascotStage callStatus="connecting" teacherStatus="idle" isMuted={false} />
    );
    expect(getByText1(/Connecting to Lumi…/i)).toBeTruthy();

    const { getByText: getByText2 } = render(
      <MascotStage callStatus="joining" teacherStatus="idle" isMuted={false} />
    );
    expect(getByText2(/Connecting to Lumi…/i)).toBeTruthy();

    const { getByText: getByText3 } = render(
      <MascotStage callStatus="joined" teacherStatus="connecting" isMuted={false} />
    );
    expect(getByText3(/Connecting to Lumi…/i)).toBeTruthy();
  });

  it('renders Lumi is listening when joined and teacher is connected and not muted', () => {
    const { getByText } = render(
      <MascotStage callStatus="joined" teacherStatus="connected" isMuted={false} />
    );
    expect(getByText(/Lumi is listening/i)).toBeTruthy();
  });

  it('renders muted state when isMuted is true', () => {
    const { getByText } = render(
      <MascotStage callStatus="joined" teacherStatus="connected" isMuted={true} />
    );
    expect(getByText(/Microphone muted/i)).toBeTruthy();
  });

  it('shows teacher unavailable and triggers retry button when teacher failed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <MascotStage
        callStatus="joined"
        teacherStatus="failed"
        isMuted={false}
        onRetryTeacher={onRetry}
      />
    );
    expect(getByText(/Teacher unavailable/i)).toBeTruthy();
    const retryBtn = getByText(/Retry teacher/i);
    expect(retryBtn).toBeTruthy();
    fireEvent.press(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders connection error when callStatus is error', () => {
    const { getByText } = render(
      <MascotStage callStatus="error" teacherStatus="idle" isMuted={false} />
    );
    expect(getByText(/Connection error/i)).toBeTruthy();
  });
});
