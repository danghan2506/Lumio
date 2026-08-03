jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

import { useOnboardingStore } from '@/store/useOnboardingStore';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.setState({ hasSeenOnboarding: false });
  });

  it('defaults hasSeenOnboarding to false', () => {
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(false);
  });

  it('updates hasSeenOnboarding state when setHasSeenOnboarding is called', () => {
    useOnboardingStore.getState().setHasSeenOnboarding(true);
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
  });

  it('sets hasSeenOnboarding to true when finishOnboarding is called', () => {
    useOnboardingStore.getState().finishOnboarding();
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
  });
});
