import type { Language, LanguageId } from '@/types/learning';

export const languages: Language[] = [
  {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    learnerLanguage: 'vi',
    badge: 'POPULAR',
    learnerCount: '1.2M Learners',
  },
  {
    id: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    learnerLanguage: 'vi',
    learnerCount: '850K Learners',
  },
  {
    id: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    learnerLanguage: 'vi',
    badge: 'POPULAR',
    learnerCount: '620K Learners',
  },
  {
    id: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    learnerLanguage: 'vi',
    learnerCount: '450K Learners',
  },
];

export const LANGUAGE_IDS: LanguageId[] = languages.map((l) => l.id);
