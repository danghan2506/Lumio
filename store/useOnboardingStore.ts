import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (value: boolean) => void;
  finishOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (value: boolean) => set({ hasSeenOnboarding: value }),
      finishOnboarding: () => set({ hasSeenOnboarding: true }),
    }),
    {
      name: 'lumio-onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
