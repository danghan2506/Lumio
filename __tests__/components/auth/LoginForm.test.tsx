import React from 'react';
import { render } from '@testing-library/react-native';
import { LoginForm } from '@/components/auth/LoginForm';

describe('LoginForm Component', () => {
  it('renders email and password inputs with Vietnamese labels', () => {
    const { getByText, getByPlaceholderText } = render(<LoginForm onSuccess={jest.fn()} />);
    expect(getByText('Địa chỉ Email')).toBeTruthy();
    expect(getByText('Mật khẩu')).toBeTruthy();
    expect(getByPlaceholderText('bạn@example.com')).toBeTruthy();
  });
});
