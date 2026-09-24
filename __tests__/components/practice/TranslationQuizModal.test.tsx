import React from 'react';
import { render } from '@testing-library/react-native';
import { TranslationQuizModal } from '../../../components/practice/TranslationQuizModal';
import type { TranslationActivityItem } from '../../../types/learning';

describe('TranslationQuizModal', () => {
  const mockQuestions: TranslationActivityItem[] = [
    {
      id: 'trans-1',
      lesson_id: 'les-1',
      order: 1,
      type: 'translation',
      instruction: 'Dịch câu sau sang tiếng Anh:',
      data: {
        sourceText: 'Xin chào, bạn khỏe không?',
        targetText: 'Hello, how are you?',
        acceptedVariants: ['Hello, how are you?'],
      },
    },
  ];

  it('renders with warm cream canvas and warm ivory source sentence card', () => {
    const { getByTestId, getByText } = render(
      <TranslationQuizModal
        visible={true}
        lessonTitle="Greetings"
        questions={mockQuestions}
        onClose={jest.fn()}
      />
    );

    const root = getByTestId('translation-modal-container');
    expect(root.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#FFFBF4' })
    );

    const sourceCard = getByTestId('translation-source-card');
    expect(sourceCard.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#FAF7F0' })
    );

    expect(getByText('Xin chào, bạn khỏe không?')).toBeTruthy();
  });
});
