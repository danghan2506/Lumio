import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AiVideoHighlightCard } from '@/components/home/AiVideoHighlightCard';

describe('AiVideoHighlightCard', () => {
  it('renders default subtitle when no topicTitle is passed', () => {
    const { getByText } = render(<AiVideoHighlightCard />);
    expect(getByText('NEXT UP')).toBeTruthy();
    expect(getByText('AI Video Call')).toBeTruthy();
    expect(getByText('Practice speaking with Lumio')).toBeTruthy();
  });

  it('renders dynamic topic title when topicTitle is provided', () => {
    const { getByText } = render(
      <AiVideoHighlightCard topicTitle="Ordering Tapas in Madrid" />
    );
    expect(getByText('NEXT UP')).toBeTruthy();
    expect(getByText('AI Video Call')).toBeTruthy();
    expect(getByText('Topic: Ordering Tapas in Madrid')).toBeTruthy();
  });

  it('calls onStartCall when card or button is pressed', () => {
    const handleStartCall = jest.fn();
    const { getByTestId } = render(
      <AiVideoHighlightCard onStartCall={handleStartCall} />
    );

    fireEvent.press(getByTestId('start-call-card'));
    expect(handleStartCall).toHaveBeenCalledTimes(1);
  });
});
