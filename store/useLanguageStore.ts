import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LanguageId } from '@/types/learning';

interface LanguageState {
  selectedLanguage: LanguageId | null;
  hasSelectedLanguage: boolean;
  setSelectedLanguage: (id: LanguageId) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      selectedLanguage: null,
      hasSelectedLanguage: false,
      setSelectedLanguage: (id: LanguageId) =>
        set({ selectedLanguage: id, hasSelectedLanguage: true }),
    }),
    {
      name: 'lumio-language-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
