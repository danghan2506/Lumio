import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuizExitConfirmDialog } from '../../../components/practice/QuizExitConfirmDialog';

describe('QuizExitConfirmDialog', () => {
  it('renders exit warning and handles resume and confirm buttons', () => {
    const onResume = jest.fn();
    const onExit = jest.fn();

    const { getByText, getByTestId } = render(
      <QuizExitConfirmDialog
        visible={true}
        onResume={onResume}
        onExit={onExit}
      />
    );

    expect(getByText('Quit Practice Session?')).toBeTruthy();
    expect(
      getByText('Your current progress will not be saved and you will not earn XP. Are you sure you want to quit?')
    ).toBeTruthy();

    fireEvent.press(getByTestId('resume-quiz-btn'));
    expect(onResume).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('confirm-exit-btn'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
