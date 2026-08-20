import React from 'react';

const mockInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const mockFrame = { x: 0, y: 0, width: 390, height: 844 };

export const useSafeAreaInsets = jest.fn(() => mockInsets);
export const useSafeAreaFrame = jest.fn(() => mockFrame);
export const SafeAreaProvider = ({ children }: { children?: React.ReactNode }) => children;
export const SafeAreaConsumer = ({ children }: { children: (insets: typeof mockInsets) => React.ReactNode }) => children(mockInsets);
export const SafeAreaView = ({ children, style }: any) => React.createElement('View', { style }, children);
export const initialWindowMetrics = { insets: mockInsets, frame: mockFrame };

export default {
  useSafeAreaInsets,
  useSafeAreaFrame,
  SafeAreaProvider,
  SafeAreaConsumer,
  SafeAreaView,
  initialWindowMetrics,
};
