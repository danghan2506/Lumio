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

  it('preserves layout and hides caption text when showCaptions is false', () => {
    const { queryByText, getByTestId } = render(
      <LessonCaptionsSlot
        languageName="Spanish"
        showCaptions={false}
        captionText="Hola, ¿cómo estás?"
      />
    );
    expect(queryByText('Hola, ¿cómo estás?')).toBeNull();
    expect(queryByText(/Speak naturally/i)).toBeNull();
    expect(getByTestId('captions-slot-placeholder')).toBeTruthy();
  });
});
