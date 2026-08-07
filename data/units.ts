import type { Unit, LanguageId } from '@/types/learning';

export const units: Unit[] = [
  // ─── English ───────────────────────────────────────────────────────────
  {
    id: 'en-unit-1',
    languageId: 'en',
    order: 1,
    title: 'Greetings & Introductions',
    description: 'Học cách chào hỏi và tự giới thiệu bằng tiếng Anh',
    iconEmoji: '👋',
  },
  {
    id: 'en-unit-2',
    languageId: 'en',
    order: 2,
    title: 'Numbers & Colors',
    description: 'Học đếm số và gọi tên màu sắc bằng tiếng Anh',
    iconEmoji: '🔢',
  },

  // ─── Korean ────────────────────────────────────────────────────────────
  {
    id: 'ko-unit-1',
    languageId: 'ko',
    order: 1,
    title: '인사 & 소개',
    description: 'Học cách chào hỏi và tự giới thiệu bằng tiếng Hàn',
    iconEmoji: '🙇',
  },
  {
    id: 'ko-unit-2',
    languageId: 'ko',
    order: 2,
    title: '숫자 & 색깔',
    description: 'Học đếm số và gọi tên màu sắc bằng tiếng Hàn',
    iconEmoji: '🔢',
  },

  // ─── French ────────────────────────────────────────────────────────────
  {
    id: 'fr-unit-1',
    languageId: 'fr',
    order: 1,
    title: 'Salutations & Présentations',
    description: 'Học cách chào hỏi và tự giới thiệu bằng tiếng Pháp',
    iconEmoji: '👋',
  },
  {
    id: 'fr-unit-2',
    languageId: 'fr',
    order: 2,
    title: 'Nombres & Couleurs',
    description: 'Học đếm số và gọi tên màu sắc bằng tiếng Pháp',
    iconEmoji: '🔢',
  },

  // ─── Spanish ───────────────────────────────────────────────────────────
  {
    id: 'es-unit-1',
    languageId: 'es',
    order: 1,
    title: 'Saludos & Presentaciones',
    description: 'Học cách chào hỏi và tự giới thiệu bằng tiếng Tây Ban Nha',
    iconEmoji: '👋',
  },
  {
    id: 'es-unit-2',
    languageId: 'es',
    order: 2,
    title: 'Números & Colores',
    description: 'Học đếm số và gọi tên màu sắc bằng tiếng Tây Ban Nha',
    iconEmoji: '🔢',
  },
];

export function getUnitsByLanguage(languageId: LanguageId): Unit[] {
  return units
    .filter((u) => u.languageId === languageId)
    .sort((a, b) => a.order - b.order);
}
