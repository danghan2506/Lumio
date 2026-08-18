import {
  tokenizeTargetSentence,
  FALLBACK_DISTRACTORS,
  generateWordBankChips,
  normalizeSentence,
  validateTranslationAnswer,
  sanitizeTranslationData,
} from '@/lib/wordBankHelper';
import { WordChip } from '@/types/learning';

describe('wordBankHelper', () => {
  describe('tokenizeTargetSentence', () => {
    it('splits sentence into word tokens preserving attached trailing punctuation', () => {
      expect(tokenizeTargetSentence('Nice to meet you!')).toEqual(['Nice', 'to', 'meet', 'you!']);
    });

    it('handles multiple spaces and leading/trailing whitespace', () => {
      expect(tokenizeTargetSentence('   Hello    world!   ')).toEqual(['Hello', 'world!']);
    });

    it('returns empty array for empty or whitespace-only string', () => {
      expect(tokenizeTargetSentence('')).toEqual([]);
      expect(tokenizeTargetSentence('   ')).toEqual([]);
    });

    it('handles punctuation across multiple languages', () => {
      expect(tokenizeTargetSentence('안녕하세요 만나서 반갑습니다.')).toEqual([
        '안녕하세요',
        '만나서',
        '반갑습니다.',
      ]);
      expect(tokenizeTargetSentence('¡Hola! ¿Cómo estás?')).toEqual(['¡Hola!', '¿Cómo', 'estás?']);
      expect(tokenizeTargetSentence('Je suis étudiant.')).toEqual(['Je', 'suis', 'étudiant.']);
    });
  });

  describe('FALLBACK_DISTRACTORS', () => {
    it('provides default distractors for supported languages', () => {
      expect(FALLBACK_DISTRACTORS.en).toContain('hello');
      expect(FALLBACK_DISTRACTORS.ko).toContain('안녕하세요');
      expect(FALLBACK_DISTRACTORS.fr).toContain('bonjour');
      expect(FALLBACK_DISTRACTORS.es).toContain('hola');
    });
  });

  describe('generateWordBankChips', () => {
    it('generates chips containing all target words', () => {
      const chips = generateWordBankChips({
        targetText: 'Hello world',
        distractors: ['friend'],
      });

      const chipTexts = chips.map((c) => c.text);
      expect(chipTexts).toContain('Hello');
      expect(chipTexts).toContain('world');
      expect(chipTexts).toContain('friend');
      expect(chips.length).toBe(3);
    });

    it('creates unique IDs for every chip', () => {
      const chips = generateWordBankChips({
        targetText: 'hello hello world',
        distractors: ['test'],
      });

      const ids = chips.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(chips.length);
    });

    it('uses distractors parameter when provided', () => {
      const chips = generateWordBankChips({
        targetText: 'Thank you',
        distractors: ['welcome', 'please'],
        maxDistractors: 2,
      });

      const chipTexts = chips.map((c) => c.text);
      expect(chipTexts).toContain('Thank');
      expect(chipTexts).toContain('you');
      expect(chipTexts).toContain('welcome');
      expect(chipTexts).toContain('please');
    });

    it('falls back to lessonVocab when distractors is not provided', () => {
      const chips = generateWordBankChips({
        targetText: 'Good morning',
        lessonVocab: ['night', 'evening', 'day'],
        maxDistractors: 2,
      });

      const chipTexts = chips.map((c) => c.text);
      expect(chipTexts).toContain('Good');
      expect(chipTexts).toContain('morning');
      const distractorCount = chipTexts.filter((t) => ['night', 'evening', 'day'].includes(t)).length;
      expect(distractorCount).toBe(2);
    });

    it('falls back to FALLBACK_DISTRACTORS when neither distractors nor lessonVocab is provided', () => {
      const chips = generateWordBankChips({
        targetText: 'See you',
        languageId: 'en',
        maxDistractors: 3,
      });

      const chipTexts = chips.map((c) => c.text);
      expect(chipTexts).toContain('See');
      expect(chipTexts).toContain('you');
      expect(chips.length).toBe(5); // 2 target + 3 distractors
    });

    it('excludes distractor words that already appear in targetText case-insensitively', () => {
      const chips = generateWordBankChips({
        targetText: 'Hello friend',
        distractors: ['hello', 'FRIEND', 'goodbye', 'thanks'],
        maxDistractors: 2,
      });

      const chipTexts = chips.map((c) => c.text.toLowerCase());
      const goodbyePresent = chipTexts.includes('goodbye');
      const thanksPresent = chipTexts.includes('thanks');
      expect(goodbyePresent || thanksPresent).toBe(true);

      // 'hello' and 'FRIEND' should not be added as extra duplicate distractors
      const helloCount = chips.filter((c) => c.text.toLowerCase() === 'hello').length;
      const friendCount = chips.filter((c) => c.text.toLowerCase() === 'friend').length;
      expect(helloCount).toBe(1);
      expect(friendCount).toBe(1);
    });

    it('respects maxDistractors limit', () => {
      const chips = generateWordBankChips({
        targetText: 'Hello',
        distractors: ['a', 'b', 'c', 'd', 'e'],
        maxDistractors: 2,
      });

      expect(chips.length).toBe(3); // 1 target + 2 distractors
    });
  });

  describe('normalizeSentence', () => {
    it('lowercases text and trims spaces', () => {
      expect(normalizeSentence('  Hello World  ')).toBe('hello world');
    });

    it('collapses multiple whitespace characters into single spaces', () => {
      expect(normalizeSentence('Hello    world   again')).toBe('hello world again');
    });

    it('removes punctuation marks', () => {
      expect(normalizeSentence('Hello, world! How are you?')).toBe('hello world how are you');
      expect(normalizeSentence('¡Hola! ¿Cómo estás?')).toBe('hola cómo estás');
    });

    it('handles empty string', () => {
      expect(normalizeSentence('')).toBe('');
    });
  });

  describe('validateTranslationAnswer', () => {
    const targetText = 'Nice to meet you!';
    const acceptedVariants = ['Pleased to meet you', 'Glad to meet you!'];

    it('returns true for exact target sentence match with string array', () => {
      expect(validateTranslationAnswer(['Nice', 'to', 'meet', 'you!'], targetText)).toBe(true);
    });

    it('returns true for match ignoring punctuation and casing', () => {
      expect(validateTranslationAnswer(['nice', 'to', 'meet', 'you'], targetText)).toBe(true);
    });

    it('returns true when candidate matches WordChip array', () => {
      const chips: WordChip[] = [
        { id: '1', text: 'Nice' },
        { id: '2', text: 'to' },
        { id: '3', text: 'meet' },
        { id: '4', text: 'you!' },
      ];
      expect(validateTranslationAnswer(chips, targetText)).toBe(true);
    });

    it('returns true when candidate matches an accepted variant', () => {
      expect(
        validateTranslationAnswer(['Pleased', 'to', 'meet', 'you'], targetText, acceptedVariants)
      ).toBe(true);
      expect(
        validateTranslationAnswer(['Glad', 'to', 'meet', 'you!'], targetText, acceptedVariants)
      ).toBe(true);
    });

    it('returns false when words are in incorrect order', () => {
      expect(validateTranslationAnswer(['meet', 'to', 'Nice', 'you'], targetText)).toBe(false);
    });

    it('returns false when words are missing', () => {
      expect(validateTranslationAnswer(['Nice', 'to', 'meet'], targetText)).toBe(false);
    });

    it('returns false for empty word array', () => {
      expect(validateTranslationAnswer([], targetText)).toBe(false);
    });
  });

  describe('sanitizeTranslationData', () => {
    it('returns valid TranslationActivityData for complete valid object', () => {
      const raw = {
        sourceText: 'Rất vui được gặp bạn!',
        targetText: 'Nice to meet you!',
        acceptedVariants: ['Pleased to meet you', 'Glad to meet you'],
        distractors: ['hello', 'friend'],
      };

      const result = sanitizeTranslationData(raw);
      expect(result).toEqual({
        sourceText: 'Rất vui được gặp bạn!',
        targetText: 'Nice to meet you!',
        acceptedVariants: ['Pleased to meet you', 'Glad to meet you'],
        distractors: ['hello', 'friend'],
      });
    });

    it('returns valid data when optional distractors is omitted', () => {
      const raw = {
        sourceText: 'Xin chào',
        targetText: 'Hello',
        acceptedVariants: ['Hi'],
      };

      const result = sanitizeTranslationData(raw);
      expect(result).toEqual({
        sourceText: 'Xin chào',
        targetText: 'Hello',
        acceptedVariants: ['Hi'],
      });
    });

    it('returns null for non-object inputs', () => {
      expect(sanitizeTranslationData(null)).toBeNull();
      expect(sanitizeTranslationData(undefined)).toBeNull();
      expect(sanitizeTranslationData('string')).toBeNull();
      expect(sanitizeTranslationData(123)).toBeNull();
      expect(sanitizeTranslationData([])).toBeNull();
    });

    it('returns null when targetText is missing or empty', () => {
      expect(
        sanitizeTranslationData({
          sourceText: 'Xin chào',
          targetText: '',
          acceptedVariants: [],
        })
      ).toBeNull();
      expect(
        sanitizeTranslationData({
          sourceText: 'Xin chào',
          targetText: '   ',
          acceptedVariants: [],
        })
      ).toBeNull();
      expect(
        sanitizeTranslationData({
          sourceText: 'Xin chào',
          acceptedVariants: [],
        })
      ).toBeNull();
    });

    it('returns null when sourceText is not a string', () => {
      expect(
        sanitizeTranslationData({
          sourceText: 123,
          targetText: 'Hello',
          acceptedVariants: [],
        })
      ).toBeNull();
    });

    it('returns null when acceptedVariants is not an array of strings', () => {
      expect(
        sanitizeTranslationData({
          sourceText: 'Xin chào',
          targetText: 'Hello',
          acceptedVariants: 'invalid',
        })
      ).toBeNull();
      expect(
        sanitizeTranslationData({
          sourceText: 'Xin chào',
          targetText: 'Hello',
          acceptedVariants: [123, 'Hi'],
        })
      ).toBeNull();
    });

    it('returns null when distractors is present but not an array of strings', () => {
      expect(
        sanitizeTranslationData({
          sourceText: 'Xin chào',
          targetText: 'Hello',
          acceptedVariants: [],
          distractors: 'invalid',
        })
      ).toBeNull();
      expect(
        sanitizeTranslationData({
          sourceText: 'Xin chào',
          targetText: 'Hello',
          acceptedVariants: [],
          distractors: [123],
        })
      ).toBeNull();
    });
  });
});
