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

    expect(getByText('Thoát bài luyện tập?')).toBeTruthy();
    expect(
      getByText('Tiến trình làm bài hiện tại sẽ không được lưu và bạn sẽ chưa nhận được XP. Bạn có chắc muốn thoát?')
    ).toBeTruthy();

    fireEvent.press(getByTestId('resume-quiz-btn'));
    expect(onResume).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('confirm-exit-btn'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
