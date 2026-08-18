// ─── Language ──────────────────────────────────────────────────────────────

export type LanguageId = 'en' | 'ko' | 'fr' | 'es';

export interface Language {
  id: LanguageId;
  name: string;
  nativeName: string;
  flag: string;
  learnerLanguage: 'vi';
  badge?: string;
  learnerCount?: string;
}

// ─── Unit ──────────────────────────────────────────────────────────────────

export interface Unit {
  id: string;
  languageId: LanguageId;
  order: number;
  title: string;
  description: string;
  iconEmoji: string;
}

// ─── Vocabulary ────────────────────────────────────────────────────────────

export interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  pronunciation: string;
  exampleSentence: string;
  exampleTranslation: string;
}

// ─── Activities ────────────────────────────────────────────────────────────

export type ActivityType =
  | 'multiple_choice'
  | 'translation'
  | 'vocabulary_match'
  | 'ai_conversation';

interface BaseActivity {
  id: string;
  type: ActivityType;
  instruction: string;
}

export interface MultipleChoiceActivity extends BaseActivity {
  type: 'multiple_choice';
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

export interface TranslationActivity extends BaseActivity {
  type: 'translation';
  sourceText: string;
  targetText: string;
  acceptedVariants: string[];
}

export interface VocabularyMatchActivity extends BaseActivity {
  type: 'vocabulary_match';
  pairs: { word: string; match: string }[];
}

export interface AiConversationActivity extends BaseActivity {
  type: 'ai_conversation';
  scenario: string;
  suggestedPhrases: string[];
}

export type Activity =
  | MultipleChoiceActivity
  | TranslationActivity
  | VocabularyMatchActivity
  | AiConversationActivity;

// ─── Practice & Quiz Types ────────────────────────────────────────────────

export type PracticeActivityType = 'all' | 'multiple_choice' | 'translation';

export interface WordChip {
  id: string;
  text: string;
  isSelected?: boolean;
}

export interface TranslationActivityData {
  sourceText: string;
  targetText: string;
  acceptedVariants: string[];
  distractors?: string[];
}

export interface TranslationActivityItem {
  id: string;
  lesson_id: string;
  order: number;
  type: 'translation';
  instruction: string;
  data: TranslationActivityData;
}

export interface MultipleChoiceData {
  question: string;
  options: [string, string, string, string] | string[];
  correctIndex: number;
}

export interface MultipleChoiceActivityItem {
  id: string;
  lesson_id: string;
  order: number;
  type: 'multiple_choice';
  instruction: string;
  data: MultipleChoiceData;
}

export interface PracticeLessonItem {
  id: string;
  unit_id: string;
  order: number;
  title: string;
  xp_reward: number;
  estimated_minutes: number;
  activitiesCount: number;
  status: 'not_started' | 'in_progress' | 'completed';
  translationActivitiesCount?: number;
  multipleChoiceActivitiesCount?: number;
}

// ─── Lesson ────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  unitId: string;
  order: number;
  title: string;
  xpReward: number;
  estimatedMinutes: number;
  vocabulary: VocabularyItem[];
  activities: Activity[];
  aiTeacherPrompt: string;
}
