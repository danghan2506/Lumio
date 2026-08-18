import { LanguageId, TranslationActivityData, WordChip } from '@/types/learning';

/**
 * Splits sentence into word tokens, preserving attached trailing/leading punctuation.
 * Handles multiple spaces, trimming, and clean non-empty words.
 */
export function tokenizeTargetSentence(targetText: string): string[] {
  if (!targetText || typeof targetText !== 'string') {
    return [];
  }
  const trimmed = targetText.trim();
  if (!trimmed) {
    return [];
  }
  return trimmed.split(/\s+/).filter(Boolean);
}

/**
 * Standard vocabulary distractor words for supported languages.
 */
export const FALLBACK_DISTRACTORS: Record<LanguageId, string[]> = {
  en: ['is', 'are', 'am', 'hello', 'good', 'thanks', 'friend', 'happy', 'see', 'today', 'welcome', 'nice'],
  ko: ['네', '아니요', '사람', '친구', '감사', '선생님', '학생', '안녕하세요', '오늘'],
  fr: ['bonjour', 'oui', 'non', 'merci', 'ami', 'est', 'très', 'avec', 'demain', 'bien'],
  es: ['hola', 'gracias', 'amigo', 'es', 'muy', 'bueno', 'bien', 'por', 'favor', 'hoy'],
};

/**
 * Helper to trim whitespace, lowercase, remove punctuation, collapse spaces.
 */
export function normalizeSentence(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * In-place Fisher-Yates array shuffle.
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export interface GenerateWordBankChipsParams {
  targetText: string;
  lessonVocab?: string[];
  languageId?: LanguageId;
  distractors?: string[];
  maxDistractors?: number;
}

/**
 * Extracts target words, selects 2-3 distractors, shuffles them,
 * and returns array of WordChip with unique IDs.
 */
export function generateWordBankChips(params: {
  targetText: string;
  lessonVocab?: string[];
  languageId?: LanguageId;
  distractors?: string[];
  maxDistractors?: number;
}): WordChip[] {
  const targetTokens = tokenizeTargetSentence(params.targetText);
  const targetNormalizedWords = new Set(
    targetTokens.map((t) => normalizeSentence(t)).filter(Boolean)
  );

  let candidateDistractors: string[] = [];
  if (params.distractors && params.distractors.length > 0) {
    candidateDistractors = params.distractors;
  } else if (params.lessonVocab && params.lessonVocab.length > 0) {
    candidateDistractors = params.lessonVocab;
  } else {
    const langKey = params.languageId ?? 'en';
    candidateDistractors = FALLBACK_DISTRACTORS[langKey] ?? FALLBACK_DISTRACTORS.en;
  }

  // Filter out any distractors that already appear in targetText case-insensitively / normalized
  const availableDistractors = candidateDistractors.filter(
    (word) => !targetNormalizedWords.has(normalizeSentence(word))
  );

  const maxDistractors = params.maxDistractors ?? 3;
  const shuffledDistractors = shuffleArray(availableDistractors);
  const chosenDistractors = shuffledDistractors.slice(0, maxDistractors);

  const allWords = shuffleArray([...targetTokens, ...chosenDistractors]);

  return allWords.map((word, index) => ({
    id: `chip-${index}-${word}`,
    text: word,
    isSelected: false,
  }));
}

/**
 * Validates selected word chips or strings against the target sentence and accepted variants.
 */
export function validateTranslationAnswer(
  selectedChipsOrWords: (WordChip | string)[],
  targetText: string,
  acceptedVariants?: string[]
): boolean {
  if (!selectedChipsOrWords || selectedChipsOrWords.length === 0) {
    return false;
  }

  const words = selectedChipsOrWords.map((item) =>
    typeof item === 'string' ? item : item.text
  );
  const candidateSentence = words.join(' ');
  const normalizedCandidate = normalizeSentence(candidateSentence);

  if (!normalizedCandidate) {
    return false;
  }

  const normalizedTarget = normalizeSentence(targetText);
  if (normalizedCandidate === normalizedTarget) {
    return true;
  }

  if (acceptedVariants && Array.isArray(acceptedVariants)) {
    return acceptedVariants.some(
      (variant) => normalizeSentence(variant) === normalizedCandidate
    );
  }

  return false;
}

/**
 * Validates that raw is an object with valid TranslationActivityData fields.
 */
export function sanitizeTranslationData(raw: unknown): TranslationActivityData | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.targetText !== 'string' || obj.targetText.trim().length === 0) {
    return null;
  }

  if (typeof obj.sourceText !== 'string') {
    return null;
  }

  if (
    !Array.isArray(obj.acceptedVariants) ||
    !obj.acceptedVariants.every((v) => typeof v === 'string')
  ) {
    return null;
  }

  if (
    obj.distractors !== undefined &&
    (!Array.isArray(obj.distractors) || !obj.distractors.every((d) => typeof d === 'string'))
  ) {
    return null;
  }

  const result: TranslationActivityData = {
    sourceText: obj.sourceText,
    targetText: obj.targetText,
    acceptedVariants: obj.acceptedVariants as string[],
  };

  if (Array.isArray(obj.distractors)) {
    result.distractors = obj.distractors as string[];
  }

  return result;
}
