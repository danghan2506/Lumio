import React from 'react';
import { render } from '@testing-library/react-native';
import { LoginForm } from '@/components/auth/LoginForm';

describe('LoginForm Component', () => {
  it('renders email and password inputs with labels', () => {
    const { getByText, getByPlaceholderText } = render(<LoginForm onSuccess={jest.fn()} />);
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Password')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
  });
});
