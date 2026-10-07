import React from 'react';
import { render } from '@testing-library/react-native';
import { LessonCaptionsSlot } from '@/components/lesson/LessonCaptionsSlot';

describe('LessonCaptionsSlot', () => {
  it('renders default voice guidance hint when showCaptions is true and no captionText is provided', () => {
    const { getByText } = render(
      <LessonCaptionsSlot languageName="Spanish" showCaptions={true} />
    );
    expect(getByText('Speak naturally in Spanish to practice with Lumi.')).toBeTruthy();
  });

  it('renders fallback voice guidance hint when languageName is omitted', () => {
    const { getByText } = render(
      <LessonCaptionsSlot showCaptions={true} />
    );
    expect(getByText('Speak naturally in your language to practice with Lumi.')).toBeTruthy();
  });

  it('renders custom captionText when provided', () => {
    const { getByText, queryByText } = render(
      <LessonCaptionsSlot
        languageName="Spanish"
        showCaptions={true}
        captionText="Hola, ¿cómo estás?"
      />
    );
    expect(getByText('Hola, ¿cómo estás?')).toBeTruthy();
    expect(queryByText(/Speak naturally in Spanish to practice with Lumi\./i)).toBeNull();
  });

  it('preserves layout with minHeight 64 and hides caption text when showCaptions is false', () => {
    const { queryByText, getByTestId } = render(
      <LessonCaptionsSlot
        languageName="Spanish"
        showCaptions={false}
        captionText="Hola, ¿cómo estás?"
      />
    );
    expect(queryByText('Hola, ¿cómo estás?')).toBeNull();
    expect(queryByText(/Speak naturally/i)).toBeNull();
    const placeholder = getByTestId('captions-slot-placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder.props.style).toEqual(
      expect.objectContaining({ minHeight: 64 })
    );
  });

  it('clamps card container style with minHeight 64 and maxHeight 128', () => {
    const { getByTestId } = render(
      <LessonCaptionsSlot
        languageName="Spanish"
        showCaptions={true}
        captionText="Testing height clamping bounds."
      />
    );
    const card = getByTestId('captions-slot-card');
    expect(card.props.style).toEqual(
      expect.objectContaining({
        minHeight: 64,
        maxHeight: 128,
      })
    );
  });

  it('renders long text inside a scrollable view with stable font metrics', () => {
    const longText =
      'Great job on your pronunciation! In Spanish, remember to say Buenos días in the morning instead of Buenas tardes. Let us practice ordering breakfast together.';
    const { getByText, getByTestId } = render(
      <LessonCaptionsSlot
        languageName="Spanish"
        showCaptions={true}
        captionText={longText}
        isLive={true}
      />
    );
    expect(getByText(longText)).toBeTruthy();
    const scrollView = getByTestId('captions-scroll-view');
    expect(scrollView).toBeTruthy();
  });
});
