# Learning Content System — Design Spec

**Date:** 2026-08-07
**Status:** Approved
**Scope:** Hardcoded TypeScript data layer cho lesson content (types + data files)

---

## 1. Goal

Tạo data layer tĩnh cho nội dung bài học. Đây là nguồn dữ liệu duy nhất cho lesson screens và future AI teacher sessions. Không dùng CMS, không fetch từ API — chỉ là typed TypeScript files trong `data/`.

---

## 2. File Structure

```
types/
  learning.ts          ← tất cả shared types

data/
  languages.ts         ← 4 ngôn ngữ: English, Korean, French, Spanish
  units.ts             ← units nhóm theo languageId
  lessons.ts           ← lessons với vocabulary + activities + AI prompts
```

Không có `data/vocabulary.ts` riêng — vocabulary được nhúng trong `Lesson` để giữ cohesion và tránh cross-file lookup khi render lesson screen.

---

## 3. Type Definitions (`types/learning.ts`)

### Language

```ts
type LanguageId = 'en' | 'ko' | 'fr' | 'es';

interface Language {
  id: LanguageId;
  name: string;          // "English"
  nativeName: string;    // "English" / "한국어" / "Français" / "Español"
  flag: string;          // emoji "🇺🇸"
  learnerLanguage: 'vi'; // app is Vietnamese-first
}
```

### Unit

```ts
interface Unit {
  id: string;           // "en-unit-1"
  languageId: LanguageId;
  order: number;        // 1, 2, 3...
  title: string;        // "Greetings"
  description: string;
  iconEmoji: string;    // "👋"
}
```

### VocabularyItem

```ts
interface VocabularyItem {
  word: string;          // "Hello"
  translation: string;   // "Xin chào"
  pronunciation: string; // "/həˈloʊ/" hoặc romanization
  exampleSentence: string;
  exampleTranslation: string;
}
```

### Activity — Discriminated Union

```ts
type ActivityType = 'multiple_choice' | 'translation' | 'vocabulary_match' | 'ai_conversation';

interface BaseActivity {
  id: string;
  type: ActivityType;
  instruction: string; // Vietnamese instruction shown to user
}

interface MultipleChoiceActivity extends BaseActivity {
  type: 'multiple_choice';
  question: string;
  options: string[];      // 4 items
  correctIndex: number;   // 0-3
}

interface TranslationActivity extends BaseActivity {
  type: 'translation';
  sourceText: string;    // tiếng Việt
  targetText: string;    // đáp án đúng ở ngôn ngữ đích
  acceptedVariants: string[]; // các cách viết chấp nhận được
}

interface VocabularyMatchActivity extends BaseActivity {
  type: 'vocabulary_match';
  pairs: Array<{ word: string; match: string }>; // 4-6 pairs
}

interface AiConversationActivity extends BaseActivity {
  type: 'ai_conversation';
  scenario: string;       // "Hãy chào AI teacher và giới thiệu tên bạn"
  suggestedPhrases: string[]; // gợi ý câu cho người học
}

type Activity =
  | MultipleChoiceActivity
  | TranslationActivity
  | VocabularyMatchActivity
  | AiConversationActivity;
```

### Lesson

```ts
interface Lesson {
  id: string;               // "en-unit-1-lesson-1"
  unitId: string;           // "en-unit-1"
  order: number;
  title: string;
  xpReward: number;         // 10, 20, 30...
  estimatedMinutes: number; // 5, 10...
  vocabulary: VocabularyItem[];
  activities: Activity[];
  aiTeacherPrompt: string;  // system prompt for Stream Vision Agent
}
```

---

## 4. Sample Dataset

### Languages (4)
| id | name | nativeName | flag |
|----|------|-----------|------|
| en | English | English | 🇬🇧 |
| ko | Korean | 한국어 | 🇰🇷 |
| fr | French | Français | 🇫🇷 |
| es | Spanish | Español | 🇪🇸 |

### Units per language (2 each = 8 total)
- Unit 1: Greetings & Introductions
- Unit 2: Numbers & Colors

### Lessons per unit (2 each = 16 total)
- Lesson 1: basic vocab + multiple_choice + vocabulary_match
- Lesson 2: sentence building + translation + ai_conversation

### Vocabulary per lesson: 4–5 items
### Activities per lesson: 2–3 items
### AI teacher prompt: 1 per lesson (Vietnamese + target language context)

---

## 5. AI Teacher Prompt Format

```
You are Lumi, a friendly {language} teacher speaking to a Vietnamese learner.
The student has just completed the vocabulary for "{lesson title}".
Your goal: {lesson goal in 1 sentence}.
Speak mostly in {language}, use simple sentences. 
Switch to Vietnamese only to clarify meaning.
Start by greeting the student warmly.
```

---

## 6. Design Decisions

| Decision | Rationale |
|----------|-----------|
| Vocabulary embedded in Lesson | Cohesion — lesson screen needs both; avoids cross-file joins |
| Discriminated union for Activity | TypeScript narrows type automatically on `switch (activity.type)` |
| `learnerLanguage: 'vi'` on Language | App is Vietnamese-first; future: make this configurable |
| `acceptedVariants` on TranslationActivity | Flexible grading — "Hello" and "hello" both correct |
| 2 units × 2 lessons per language | Enough to demo all activity types without bloating |

---

## 7. Out of Scope

- Audio file references (added later when assets are ready)
- Spaced repetition scheduling (handled by Supabase user_progress table)
- Dynamic content from Supabase (this spec is static data only)
- Vietnamese as a target language
