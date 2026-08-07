import type { Language, LanguageId } from '@/types/learning';

export const languages: Language[] = [
  {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    learnerLanguage: 'vi',
  },
  {
    id: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    learnerLanguage: 'vi',
  },
  {
    id: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    learnerLanguage: 'vi',
  },
  {
    id: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    learnerLanguage: 'vi',
  },
];

export const LANGUAGE_IDS: LanguageId[] = languages.map((l) => l.id);
