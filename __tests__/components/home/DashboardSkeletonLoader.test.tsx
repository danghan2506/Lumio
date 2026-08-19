import React from 'react';
import { render } from '@testing-library/react-native';
import { DashboardSkeletonLoader } from '@/components/home/DashboardSkeletonLoader';

describe('DashboardSkeletonLoader', () => {
  it('renders skeleton placeholders with testID', () => {
    const { getByTestId } = render(<DashboardSkeletonLoader />);
    expect(getByTestId('dashboard-skeleton-loader')).toBeTruthy();
  });
});
