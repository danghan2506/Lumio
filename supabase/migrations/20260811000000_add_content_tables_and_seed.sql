-- Migration: 20260811000000_add_content_tables_and_seed.sql
-- Description: Create content tables (languages, units, lessons, vocabularies, activities), seed data, add progress table foreign keys, update RPC integrity validation, enable RLS policies and grants.

-- ─── 1. Content Tables DDL & Indexes ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.languages (
  id text PRIMARY KEY,
  name text NOT NULL,
  native_name text NOT NULL,
  flag text NOT NULL,
  learner_language text NOT NULL DEFAULT 'en',
  badge text NULL,
  learner_count text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.units (
  id text PRIMARY KEY,
  language_id text NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  "order" integer NOT NULL CHECK ("order" > 0),
  title text NOT NULL,
  description text NOT NULL,
  icon_emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_units_language_order
  ON public.units (language_id, "order");

CREATE TABLE IF NOT EXISTS public.lessons (
  id text PRIMARY KEY,
  unit_id text NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  "order" integer NOT NULL CHECK ("order" > 0),
  title text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 10 CHECK (xp_reward >= 0),
  estimated_minutes integer NOT NULL DEFAULT 5 CHECK (estimated_minutes > 0),
  ai_teacher_prompt text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_unit_order
  ON public.lessons (unit_id, "order");

CREATE TABLE IF NOT EXISTS public.vocabularies (
  id text PRIMARY KEY,
  lesson_id text NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  word text NOT NULL,
  translation text NOT NULL,
  pronunciation text NOT NULL,
  example_sentence text NOT NULL,
  example_translation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT idx_vocabularies_id_lesson UNIQUE (id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_vocabularies_lesson
  ON public.vocabularies (lesson_id);

CREATE TABLE IF NOT EXISTS public.activities (
  id text PRIMARY KEY,
  lesson_id text NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  "order" integer NOT NULL CHECK ("order" > 0),
  type text NOT NULL CHECK (type IN ('multiple_choice', 'translation', 'vocabulary_match', 'ai_conversation')),
  instruction text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_lesson_order
  ON public.activities (lesson_id, "order");

-- ─── 2. Seed Data ─────────────────────────────────────────────────────────────

-- Languages (4)
INSERT INTO public.languages (id, name, native_name, flag, learner_language, badge, learner_count)
VALUES
  ('en', 'English', 'English', '🇬🇧', 'en', 'POPULAR', '1.2M Learners'),
  ('es', 'Spanish', 'Español', '🇪🇸', 'en', NULL, '850K Learners'),
  ('ko', 'Korean', '한국어', '🇰🇷', 'en', 'POPULAR', '620K Learners'),
  ('fr', 'French', 'Français', '🇫🇷', 'en', NULL, '450K Learners')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  native_name = EXCLUDED.native_name,
  flag = EXCLUDED.flag,
  learner_language = EXCLUDED.learner_language,
  badge = EXCLUDED.badge,
  learner_count = EXCLUDED.learner_count;

-- Units (8)
INSERT INTO public.units (id, language_id, "order", title, description, icon_emoji)
VALUES
  ('en-unit-1', 'en', 1, 'Greetings & Introductions', 'Learn how to greet people and introduce yourself in English', '👋'),
  ('en-unit-2', 'en', 2, 'Numbers & Colors', 'Learn to count numbers and name colors in English', '🔢'),
  ('ko-unit-1', 'ko', 1, '인사 & 소개', 'Learn how to greet people and introduce yourself in Korean', '🙇'),
  ('ko-unit-2', 'ko', 2, '숫자 & 색깔', 'Learn to count numbers and name colors in Korean', '🔢'),
  ('fr-unit-1', 'fr', 1, 'Salutations & Présentations', 'Learn how to greet people and introduce yourself in French', '👋'),
  ('fr-unit-2', 'fr', 2, 'Nombres & Couleurs', 'Learn to count numbers and name colors in French', '🔢'),
  ('es-unit-1', 'es', 1, 'Saludos & Presentaciones', 'Learn how to greet people and introduce yourself in Spanish', '👋'),
  ('es-unit-2', 'es', 2, 'Números & Colores', 'Learn to count numbers and name colors in Spanish', '🔢')
ON CONFLICT (id) DO UPDATE SET
  language_id = EXCLUDED.language_id,
  "order" = EXCLUDED."order",
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon_emoji = EXCLUDED.icon_emoji;

-- Lessons (16)
INSERT INTO public.lessons (id, unit_id, "order", title, xp_reward, estimated_minutes, ai_teacher_prompt)
VALUES
  ('en-unit-1-lesson-1', 'en-unit-1', 1, 'Hello & Goodbye', 10, 5, 'You''re Lumi, a warm and energetic English teacher! Your mission is to help the learner master basic English greetings: Hello, Goodbye, Good morning, and Good night. Stay strictly focused on these greetings and self-introductions in this lesson. Speak naturally in short, upbeat English sentences with friendly contractions like let''s and I''m. Listen to the student, give gentle encouragement, and ask them to repeat each greeting with you. Keep each reply to one or two conversational sentences.'),
  ('en-unit-1-lesson-2', 'en-unit-1', 2, 'Introducing Yourself', 20, 10, 'You''re Lumi, an upbeat and friendly English teacher! Your mission is to help the learner introduce themselves using: My name is, I am from, Nice to meet you, How are you?, and I am fine. Stay strictly focused on practicing self-introductions in English. Speak in lively, natural English with contractions. Ask for their name and where they''re from, celebrate their answers, and invite them to try each phrase aloud. Keep each reply to one or two conversational sentences.'),
  ('en-unit-2-lesson-1', 'en-unit-2', 1, 'Numbers 1–10', 10, 5, 'You''re Lumi, an enthusiastic and supportive English teacher! Your mission is to help the learner count from 1 to 10 in English, focusing on: One, Two, Three, Five, and Ten. Stay strictly focused on numbers and counting in this lesson. Speak in warm, energetic English with natural contractions. Count together with the learner, praise their progress, and ask them to repeat the numbers aloud. Keep each reply to one or two conversational sentences.'),
  ('en-unit-2-lesson-2', 'en-unit-2', 2, 'Colors', 20, 10, 'You''re Lumi, a bright and encouraging English teacher! Your mission is to help the learner name and describe colors in English: Red, Blue, Green, and Yellow. Stay strictly focused on these colors and simple everyday objects. Speak in lively, natural English with friendly contractions. Ask what colors they see around them, cheer their efforts, and ask them to repeat the words. Keep each reply to one or two conversational sentences.'),
  ('ko-unit-1-lesson-1', 'ko-unit-1', 1, '안녕하세요 (Hello)', 10, 5, 'You''re Lumi, a warm and energetic Korean teacher! Your mission is to teach essential Korean greetings: 안녕하세요 (hello), 안녕 (hi), 감사합니다 (thank you), and 죄송합니다 (sorry). Stay strictly focused on these Korean greetings for this lesson—don''t teach unrelated topics or other languages. Speak mostly English, introduce each Korean word slowly with its English meaning, encourage the learner warmly, and ask them to repeat after you. Keep each reply to one or two conversational sentences.'),
  ('ko-unit-1-lesson-2', 'ko-unit-1', 2, '자기소개 (Self-introduction)', 20, 10, 'You''re Lumi, an enthusiastic and friendly Korean teacher! Your mission is to teach self-introductions in Korean using: 저는 ~입니다 (I am ~), 이름이 뭐예요? (what''s your name?), 반갑습니다 (nice to meet you), and 어디서 왔어요? (where are you from?). Stay strictly focused on introducing oneself in Korean for this lesson. Speak mostly English, introduce each phrase slowly with clear English translations, adapt to the learner''s replies, and ask them to practice saying it aloud. Keep each reply to one or two conversational sentences.'),
  ('ko-unit-2-lesson-1', 'ko-unit-2', 1, '숫자 (Numbers)', 10, 5, 'You''re Lumi, a lively and patient Korean teacher! Your mission is to teach Sino-Korean numbers: 일 (one), 이 (two), 삼 (three), 오 (five), and 십 (ten) to count from 1 to 10. Stay strictly focused on Korean numbers for this lesson—don''t teach other topics. Speak mostly English, break down each Korean number slowly with its English translation, cheer on the learner, and ask them to count and repeat after you. Keep each reply to one or two conversational sentences.'),
  ('ko-unit-2-lesson-2', 'ko-unit-2', 2, '색깔 (Colors)', 20, 10, 'You''re Lumi, a cheerful and encouraging Korean teacher! Your mission is to teach Korean colors: 빨간색 (red), 파란색 (blue), 초록색 (green), and 노란색 (yellow). Stay strictly focused on these Korean colors and describing items for this lesson. Speak mostly English, pronounce each Korean color slowly with its English translation, adapt to their answers, and invite them to repeat. Keep each reply to one or two conversational sentences.'),
  ('fr-unit-1-lesson-1', 'fr-unit-1', 1, 'Bonjour & Au revoir', 10, 5, 'You''re Lumi, a warm and energetic French teacher! Your mission is to teach core French greetings: Bonjour (hello), Bonsoir (good evening), Au revoir (goodbye), and Merci (thank you). Stay strictly focused on these French greetings for this lesson—don''t teach unrelated topics or switch languages. Speak mostly English, introduce each French word slowly with its English translation, praise their effort warmly, and ask them to repeat after you. Keep each reply to one or two conversational sentences.'),
  ('fr-unit-1-lesson-2', 'fr-unit-1', 2, 'Se présenter', 20, 10, 'You''re Lumi, an upbeat and charming French teacher! Your mission is to teach self-introductions in French using: Je m''appelle (my name is), Je viens de (I come from), Enchanté (nice to meet you), and Comment allez-vous? (how are you?). Stay strictly focused on introducing oneself in French for this lesson. Speak mostly English, introduce each phrase slowly with clear English translations, listen closely, and invite the student to say each phrase. Keep each reply to one or two conversational sentences.'),
  ('fr-unit-2-lesson-1', 'fr-unit-2', 1, 'Les nombres 1–10', 10, 5, 'You''re Lumi, an enthusiastic and supportive French teacher! Your mission is to teach French numbers: Un (one), Deux (two), Trois (three), Cinq (five), and Dix (ten) to count from 1 to 10. Stay strictly focused on French numbers for this lesson. Speak mostly English, pronounce each French number slowly with its English translation, celebrate their progress, and ask them to count and repeat after you. Keep each reply to one or two conversational sentences.'),
  ('fr-unit-2-lesson-2', 'fr-unit-2', 2, 'Les couleurs', 20, 10, 'You''re Lumi, a vibrant and friendly French teacher! Your mission is to teach French colors: Rouge (red), Bleu (blue), Vert (green), and Jaune (yellow). Stay strictly focused on these French colors and describing objects for this lesson. Speak mostly English, introduce each French color slowly with its English translation, adapt to what the student says, and encourage them to repeat. Keep each reply to one or two conversational sentences.'),
  ('es-unit-1-lesson-1', 'es-unit-1', 1, 'Hola & Adiós', 10, 5, 'You''re Lumi, a warm and energetic Spanish teacher! Your mission is to teach essential Spanish greetings: Hola (hello), Buenos días (good morning), Adiós (goodbye), and Gracias (thank you). Stay strictly focused on these Spanish greetings for this lesson—don''t teach unrelated topics or other languages. Speak mostly English, introduce each Spanish word slowly with its English translation, give gentle encouragement, and ask the student to repeat after you. Keep each reply to one or two conversational sentences.'),
  ('es-unit-1-lesson-2', 'es-unit-1', 2, 'Presentarse', 20, 10, 'You''re Lumi, a friendly and lively Spanish teacher! Your mission is to teach self-introductions in Spanish using: Me llamo (my name is), Soy de (I''m from), Mucho gusto (nice to meet you), and ¿Cómo estás? (how are you?). Stay strictly focused on introducing oneself in Spanish for this lesson. Speak mostly English, explain each phrase slowly with clear English translations, listen to their answers, and ask them to practice speaking. Keep each reply to one or two conversational sentences.'),
  ('es-unit-2-lesson-1', 'es-unit-2', 1, 'Los números 1–10', 10, 5, 'You''re Lumi, an upbeat and supportive Spanish teacher! Your mission is to teach Spanish numbers: Uno (one), Dos (two), Tres (three), Cinco (five), and Diez (ten) to count from 1 to 10. Stay strictly focused on Spanish numbers for this lesson. Speak mostly English, say each Spanish number slowly with its English translation, praise their effort, and ask them to count along with you. Keep each reply to one or two conversational sentences.'),
  ('es-unit-2-lesson-2', 'es-unit-2', 2, 'Los colores', 20, 10, 'You''re Lumi, a cheerful and engaging Spanish teacher! Your mission is to teach Spanish colors: Rojo (red), Azul (blue), Verde (green), and Amarillo (yellow). Stay strictly focused on these Spanish colors and describing items for this lesson. Speak mostly English, pronounce each Spanish color slowly with its English translation, adapt to their answers, and invite them to repeat. Keep each reply to one or two conversational sentences.')
ON CONFLICT (id) DO UPDATE SET
  unit_id = EXCLUDED.unit_id,
  "order" = EXCLUDED."order",
  title = EXCLUDED.title,
  xp_reward = EXCLUDED.xp_reward,
  estimated_minutes = EXCLUDED.estimated_minutes,
  ai_teacher_prompt = EXCLUDED.ai_teacher_prompt;

-- Vocabularies (69)
INSERT INTO public.vocabularies (id, lesson_id, word, translation, pronunciation, example_sentence, example_translation)
VALUES
  ('en-vocab-hello', 'en-unit-1-lesson-1', 'Hello', 'A friendly greeting used when meeting someone', '/həˈloʊ/', 'Hello, my name is Lumi.', 'Hello, my name is Lumi.'),
  ('en-vocab-goodbye', 'en-unit-1-lesson-1', 'Goodbye', 'A word said when leaving or ending a conversation', '/ˌɡʊdˈbaɪ/', 'Goodbye, see you tomorrow!', 'Goodbye, see you tomorrow!'),
  ('en-vocab-good-morning', 'en-unit-1-lesson-1', 'Good morning', 'A greeting used in the morning', '/ɡʊd ˈmɔːrnɪŋ/', 'Good morning! How are you?', 'Good morning! How are you?'),
  ('en-vocab-good-night', 'en-unit-1-lesson-1', 'Good night', 'A phrase said before going to sleep', '/ɡʊd naɪt/', 'Good night, sweet dreams.', 'Good night, sweet dreams.'),
  ('en-vocab-my-name-is', 'en-unit-1-lesson-2', 'My name is', 'A phrase used to introduce yourself', '/maɪ neɪm ɪz/', 'My name is Anna.', 'My name is Anna.'),
  ('en-vocab-i-am-from', 'en-unit-1-lesson-2', 'I am from', 'A phrase used to say where you come from', '/aɪ æm frɒm/', 'I am from Vietnam.', 'I am from Vietnam.'),
  ('en-vocab-nice-to-meet-you', 'en-unit-1-lesson-2', 'Nice to meet you', 'A polite phrase said when meeting someone for the first time', '/naɪs tə miːt juː/', 'Nice to meet you, Tom!', 'Nice to meet you, Tom!'),
  ('en-vocab-how-are-you', 'en-unit-1-lesson-2', 'How are you?', 'A question asking about someone''s well-being', '/haʊ ɑːr juː/', 'Hello! How are you?', 'Hello! How are you?'),
  ('en-vocab-i-am-fine', 'en-unit-1-lesson-2', 'I am fine', 'A reply meaning you are doing well', '/aɪ æm faɪn/', 'I am fine, thank you!', 'I am fine, thank you!'),
  ('en-vocab-one', 'en-unit-2-lesson-1', 'One', 'The number 1', '/wʌn/', 'I have one cat.', 'I have one cat.'),
  ('en-vocab-two', 'en-unit-2-lesson-1', 'Two', 'The number 2', '/tuː/', 'She has two sisters.', 'She has two sisters.'),
  ('en-vocab-three', 'en-unit-2-lesson-1', 'Three', 'The number 3', '/θriː/', 'There are three books.', 'There are three books.'),
  ('en-vocab-five', 'en-unit-2-lesson-1', 'Five', 'The number 5', '/faɪv/', 'I am five years old.', 'I am five years old.'),
  ('en-vocab-ten', 'en-unit-2-lesson-1', 'Ten', 'The number 10', '/ten/', 'Count to ten.', 'Count to ten.'),
  ('en-vocab-red', 'en-unit-2-lesson-2', 'Red', 'The color of a ripe apple', '/red/', 'The apple is red.', 'The apple is red.'),
  ('en-vocab-blue', 'en-unit-2-lesson-2', 'Blue', 'The color of the clear sky', '/bluː/', 'The sky is blue.', 'The sky is blue.'),
  ('en-vocab-green', 'en-unit-2-lesson-2', 'Green', 'The color of grass and leaves', '/ɡriːn/', 'The tree is green.', 'The tree is green.'),
  ('en-vocab-yellow', 'en-unit-2-lesson-2', 'Yellow', 'The color of the sun', '/ˈjeloʊ/', 'The sun is yellow.', 'The sun is yellow.'),
  ('ko-vocab-hello', 'ko-unit-1-lesson-1', '안녕하세요', 'Hello (formal)', 'an-nyeong-ha-se-yo', '안녕하세요! 처음 뵙겠습니다.', 'Hello! Nice to meet you.'),
  ('ko-vocab-hello-casual', 'ko-unit-1-lesson-1', '안녕', 'Hi (informal)', 'an-nyeong', '안녕! 잘 지냈어?', 'Hi! How are you?'),
  ('ko-vocab-thank-you', 'ko-unit-1-lesson-1', '감사합니다', 'Thank you', 'gam-sa-ham-ni-da', '도와주셔서 감사합니다.', 'Thank you for your help.'),
  ('ko-vocab-sorry', 'ko-unit-1-lesson-1', '죄송합니다', 'Sorry', 'joe-song-ham-ni-da', '늦어서 죄송합니다.', 'Sorry for being late.'),
  ('ko-vocab-my-name-is', 'ko-unit-1-lesson-2', '저는 ~입니다', 'I am ~', 'jeo-neun ~im-ni-da', '저는 학생입니다.', 'I am a student.'),
  ('ko-vocab-what-is-your-name', 'ko-unit-1-lesson-2', '이름이 뭐예요?', 'What''s your name?', 'i-reum-i mwo-ye-yo', '이름이 뭐예요? 저는 Lumi예요.', 'What''s your name? I am Lumi.'),
  ('ko-vocab-nice-to-meet-you', 'ko-unit-1-lesson-2', '반갑습니다', 'Nice to meet you', 'ban-gap-seum-ni-da', '처음 뵙겠습니다. 반갑습니다!', 'Nice to meet you for the first time!'),
  ('ko-vocab-where-are-you-from', 'ko-unit-1-lesson-2', '어디서 왔어요?', 'Where are you from?', 'eo-di-seo wa-sseo-yo', '어디서 왔어요? 베트남에서 왔어요.', 'Where are you from? I''m from Vietnam.'),
  ('ko-vocab-one', 'ko-unit-2-lesson-1', '일 (一)', 'One', 'il', '일 더하기 일은 이입니다.', 'One plus one equals two.'),
  ('ko-vocab-two', 'ko-unit-2-lesson-1', '이 (二)', 'Two', 'i', '이 개의 사과가 있습니다.', 'There are two apples.'),
  ('ko-vocab-three', 'ko-unit-2-lesson-1', '삼 (三)', 'Three', 'sam', '삼 일 동안 공부했습니다.', 'I studied for three days.'),
  ('ko-vocab-five', 'ko-unit-2-lesson-1', '오 (五)', 'Five', 'o', '오 분만 기다려 주세요.', 'Please wait five minutes.'),
  ('ko-vocab-ten', 'ko-unit-2-lesson-1', '십 (十)', 'Ten', 'sip', '십 명이 왔습니다.', 'Ten people came.'),
  ('ko-vocab-red', 'ko-unit-2-lesson-2', '빨간색', 'Red', 'ppal-gan-saek', '사과는 빨간색입니다.', 'The apple is red.'),
  ('ko-vocab-blue', 'ko-unit-2-lesson-2', '파란색', 'Blue', 'pa-ran-saek', '하늘은 파란색입니다.', 'The sky is blue.'),
  ('ko-vocab-green', 'ko-unit-2-lesson-2', '초록색', 'Green', 'cho-rok-saek', '나뭇잎은 초록색입니다.', 'The leaves are green.'),
  ('ko-vocab-yellow', 'ko-unit-2-lesson-2', '노란색', 'Yellow', 'no-ran-saek', '바나나는 노란색입니다.', 'The banana is yellow.'),
  ('fr-vocab-bonjour', 'fr-unit-1-lesson-1', 'Bonjour', 'Hello / Good morning', '/bɔ̃.ʒuʁ/', 'Bonjour, comment vous appelez-vous?', 'Hello, what''s your name?'),
  ('fr-vocab-bonsoir', 'fr-unit-1-lesson-1', 'Bonsoir', 'Good evening', '/bɔ̃.swaʁ/', 'Bonsoir! Vous avez passé une bonne journée?', 'Good evening! Did you have a good day?'),
  ('fr-vocab-au-revoir', 'fr-unit-1-lesson-1', 'Au revoir', 'Goodbye', '/o ʁə.vwaʁ/', 'Au revoir, à demain!', 'Goodbye, see you tomorrow!'),
  ('fr-vocab-merci', 'fr-unit-1-lesson-1', 'Merci', 'Thank you', '/mɛʁ.si/', 'Merci beaucoup!', 'Thank you very much!'),
  ('fr-vocab-je-mappelle', 'fr-unit-1-lesson-2', 'Je m''appelle', 'My name is', '/ʒə ma.pɛl/', 'Je m''appelle Marie.', 'My name is Marie.'),
  ('fr-vocab-je-viens-de', 'fr-unit-1-lesson-2', 'Je viens de', 'I come from', '/ʒə vjɛ̃ də/', 'Je viens du Vietnam.', 'I come from Vietnam.'),
  ('fr-vocab-enchante', 'fr-unit-1-lesson-2', 'Enchanté(e)', 'Nice to meet you', '/ɑ̃.ʃɑ̃.te/', 'Bonjour! Enchanté!', 'Hello! Nice to meet you!'),
  ('fr-vocab-comment-allez-vous', 'fr-unit-1-lesson-2', 'Comment allez-vous?', 'How are you?', '/kɔ.mɑ̃ ta.le vu/', 'Bonjour! Comment allez-vous?', 'Hello! How are you?'),
  ('fr-vocab-un', 'fr-unit-2-lesson-1', 'Un / Une', 'One', '/œ̃/ /yn/', 'J''ai un chat.', 'I have a cat.'),
  ('fr-vocab-deux', 'fr-unit-2-lesson-1', 'Deux', 'Two', '/dø/', 'Il a deux frères.', 'He has two brothers.'),
  ('fr-vocab-trois', 'fr-unit-2-lesson-1', 'Trois', 'Three', '/tʁwa/', 'Il y a trois livres.', 'There are three books.'),
  ('fr-vocab-cinq', 'fr-unit-2-lesson-1', 'Cinq', 'Five', '/sɛ̃k/', 'J''ai cinq ans.', 'I am five years old.'),
  ('fr-vocab-dix', 'fr-unit-2-lesson-1', 'Dix', 'Ten', '/dis/', 'Comptez jusqu''à dix.', 'Count to ten.'),
  ('fr-vocab-rouge', 'fr-unit-2-lesson-2', 'Rouge', 'Red', '/ʁuʒ/', 'La pomme est rouge.', 'The apple is red.'),
  ('fr-vocab-bleu', 'fr-unit-2-lesson-2', 'Bleu / Bleue', 'Blue', '/blø/', 'Le ciel est bleu.', 'The sky is blue.'),
  ('fr-vocab-vert', 'fr-unit-2-lesson-2', 'Vert / Verte', 'Green', '/vɛʁ/', 'L''arbre est vert.', 'The tree is green.'),
  ('fr-vocab-jaune', 'fr-unit-2-lesson-2', 'Jaune', 'Yellow', '/ʒon/', 'Le soleil est jaune.', 'The sun is yellow.'),
  ('es-vocab-hola', 'es-unit-1-lesson-1', 'Hola', 'Hello', '/ˈo.la/', '¡Hola! ¿Cómo te llamas?', 'Hello! What''s your name?'),
  ('es-vocab-buenos-dias', 'es-unit-1-lesson-1', 'Buenos días', 'Good morning', '/ˈbwe.nos ˈdi.as/', '¡Buenos días! ¿Cómo estás?', 'Good morning! How are you?'),
  ('es-vocab-adios', 'es-unit-1-lesson-1', 'Adiós', 'Goodbye', '/a.ˈðjos/', '¡Adiós! ¡Hasta mañana!', 'Goodbye! See you tomorrow!'),
  ('es-vocab-gracias', 'es-unit-1-lesson-1', 'Gracias', 'Thank you', '/ˈɡɾa.θjas/', '¡Muchas gracias!', 'Thank you very much!'),
  ('es-vocab-me-llamo', 'es-unit-1-lesson-2', 'Me llamo', 'My name is', '/me ˈʎa.mo/', 'Me llamo Carlos.', 'My name is Carlos.'),
  ('es-vocab-soy-de', 'es-unit-1-lesson-2', 'Soy de', 'I am from', '/soi ðe/', 'Soy de Vietnam.', 'I am from Vietnam.'),
  ('es-vocab-mucho-gusto', 'es-unit-1-lesson-2', 'Mucho gusto', 'Nice to meet you', '/ˈmu.tʃo ˈɡus.to/', '¡Hola! ¡Mucho gusto!', 'Hello! Nice to meet you!'),
  ('es-vocab-como-estas', 'es-unit-1-lesson-2', '¿Cómo estás?', 'How are you?', '/ˈko.mo esˈtas/', '¡Hola! ¿Cómo estás?', 'Hello! How are you?'),
  ('es-vocab-uno', 'es-unit-2-lesson-1', 'Uno', 'One', '/ˈu.no/', 'Tengo un gato.', 'I have a cat.'),
  ('es-vocab-dos', 'es-unit-2-lesson-1', 'Dos', 'Two', '/dos/', 'Ella tiene dos hermanas.', 'She has two sisters.'),
  ('es-vocab-tres', 'es-unit-2-lesson-1', 'Tres', 'Three', '/tɾes/', 'Hay tres libros.', 'There are three books.'),
  ('es-vocab-cinco', 'es-unit-2-lesson-1', 'Cinco', 'Five', '/ˈθin.ko/', 'Tengo cinco años.', 'I am five years old.'),
  ('es-vocab-diez', 'es-unit-2-lesson-1', 'Diez', 'Ten', '/ˈdjeθ/', 'Cuenta hasta diez.', 'Count to ten.'),
  ('es-vocab-rojo', 'es-unit-2-lesson-2', 'Rojo', 'Red', '/ˈro.xo/', 'La manzana es roja.', 'The apple is red.'),
  ('es-vocab-azul', 'es-unit-2-lesson-2', 'Azul', 'Blue', '/aˈθul/', 'El cielo es azul.', 'The sky is blue.'),
  ('es-vocab-verde', 'es-unit-2-lesson-2', 'Verde', 'Green', '/ˈbeɾ.ðe/', 'El árbol es verde.', 'The tree is green.'),
  ('es-vocab-amarillo', 'es-unit-2-lesson-2', 'Amarillo', 'Yellow', '/a.maˈɾi.ʎo/', 'El sol es amarillo.', 'The sun is yellow.')
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  word = EXCLUDED.word,
  translation = EXCLUDED.translation,
  pronunciation = EXCLUDED.pronunciation,
  example_sentence = EXCLUDED.example_sentence,
  example_translation = EXCLUDED.example_translation;

-- Activities (48)
INSERT INTO public.activities (id, lesson_id, "order", type, instruction, data)
VALUES
  ('en-unit-1-lesson-1-act-1', 'en-unit-1-lesson-1', 1, 'multiple_choice', 'Choose the correct meaning of the following word:', '{"question":"What does \"Hello\" mean?","options":["Goodbye","Hello","Thank you","Sorry"],"correctIndex":1}'::jsonb),
  ('en-unit-1-lesson-1-act-2', 'en-unit-1-lesson-1', 2, 'vocabulary_match', 'Match the English word with its meaning:', '{"pairs":[{"word":"Hello","match":"A greeting used when meeting someone"},{"word":"Goodbye","match":"A word said when leaving"},{"word":"Good morning","match":"A greeting used in the morning"},{"word":"Good night","match":"A phrase said before sleeping"}]}'::jsonb),
  ('en-unit-1-lesson-1-act-3', 'en-unit-1-lesson-1', 3, 'ai_conversation', 'Practice greetings with AI teacher Lumi:', '{"scenario":"Greet the AI teacher and introduce your name in English.","suggestedPhrases":["Hello!","My name is...","Nice to meet you!"]}'::jsonb),
  ('en-unit-1-lesson-2-act-1', 'en-unit-1-lesson-2', 1, 'multiple_choice', 'Choose the correct sentence to introduce yourself:', '{"question":"How do you say \"My name is Nam\" in English?","options":["I am from Nam.","My name is Nam.","Nice to meet Nam.","How are you Nam?"],"correctIndex":1}'::jsonb),
  ('en-unit-1-lesson-2-act-2', 'en-unit-1-lesson-2', 2, 'translation', 'Translate the following sentence into English:', '{"sourceText":"Nice to meet you!","targetText":"Nice to meet you!","acceptedVariants":["Nice to meet you!","Nice to meet you","nice to meet you"]}'::jsonb),
  ('en-unit-1-lesson-2-act-3', 'en-unit-1-lesson-2', 3, 'ai_conversation', 'Introduce yourself to the AI teacher in English:', '{"scenario":"Introduce your name, where you''re from, and ask how the AI teacher is doing.","suggestedPhrases":["My name is...","I am from...","Nice to meet you!","How are you?"]}'::jsonb),
  ('en-unit-2-lesson-1-act-1', 'en-unit-2-lesson-1', 1, 'multiple_choice', 'Choose the correct number:', '{"question":"What number does \"Three\" mean?","options":["1","2","3","5"],"correctIndex":2}'::jsonb),
  ('en-unit-2-lesson-1-act-2', 'en-unit-2-lesson-1', 2, 'vocabulary_match', 'Match the English number with the corresponding number:', '{"pairs":[{"word":"One","match":"1"},{"word":"Two","match":"2"},{"word":"Five","match":"5"},{"word":"Ten","match":"10"}]}'::jsonb),
  ('en-unit-2-lesson-1-act-3', 'en-unit-2-lesson-1', 3, 'ai_conversation', 'Count numbers with the AI teacher:', '{"scenario":"Count from 1 to 10 in English with the AI teacher.","suggestedPhrases":["One, two, three...","How do you say 7?","Can you count with me?"]}'::jsonb),
  ('en-unit-2-lesson-2-act-1', 'en-unit-2-lesson-2', 1, 'multiple_choice', 'Choose the correct meaning:', '{"question":"What does \"Blue\" mean?","options":["Red","Yellow","Blue","Green"],"correctIndex":2}'::jsonb),
  ('en-unit-2-lesson-2-act-2', 'en-unit-2-lesson-2', 2, 'translation', 'Translate into English:', '{"sourceText":"The sky is blue.","targetText":"The sky is blue.","acceptedVariants":["The sky is blue.","The sky is blue","the sky is blue"]}'::jsonb),
  ('en-unit-2-lesson-2-act-3', 'en-unit-2-lesson-2', 3, 'ai_conversation', 'Describe colors with the AI teacher:', '{"scenario":"Describe the colors of the objects around you in English.","suggestedPhrases":["The ... is red.","What color is ...?","My favorite color is ..."]}'::jsonb),
  ('ko-unit-1-lesson-1-act-1', 'ko-unit-1-lesson-1', 1, 'multiple_choice', 'Choose the correct meaning:', '{"question":"What does \"감사합니다\" mean?","options":["Hello","Goodbye","Thank you","Sorry"],"correctIndex":2}'::jsonb),
  ('ko-unit-1-lesson-1-act-2', 'ko-unit-1-lesson-1', 2, 'vocabulary_match', 'Match the Korean word with its meaning:', '{"pairs":[{"word":"안녕하세요","match":"Hello"},{"word":"감사합니다","match":"Thank you"},{"word":"죄송합니다","match":"Sorry"},{"word":"안녕","match":"Hi (informal)"}]}'::jsonb),
  ('ko-unit-1-lesson-1-act-3', 'ko-unit-1-lesson-1', 3, 'ai_conversation', 'Greet the AI teacher in Korean:', '{"scenario":"Greet the AI teacher and say thank you in Korean.","suggestedPhrases":["안녕하세요!","감사합니다!","죄송합니다."]}'::jsonb),
  ('ko-unit-1-lesson-2-act-1', 'ko-unit-1-lesson-2', 1, 'multiple_choice', 'Choose the correct sentence:', '{"question":"How do you say \"I am a student\" in Korean?","options":["저는 선생님입니다.","저는 학생입니다.","이름이 뭐예요?","반갑습니다."],"correctIndex":1}'::jsonb),
  ('ko-unit-1-lesson-2-act-2', 'ko-unit-1-lesson-2', 2, 'translation', 'Translate the following sentence into Korean:', '{"sourceText":"Nice to meet you!","targetText":"반갑습니다!","acceptedVariants":["반갑습니다!","반갑습니다","반가워요!","반가워요"]}'::jsonb),
  ('ko-unit-1-lesson-2-act-3', 'ko-unit-1-lesson-2', 3, 'ai_conversation', 'Introduce yourself to the AI teacher in Korean:', '{"scenario":"Introduce your name and where you''re from in Korean.","suggestedPhrases":["저는 ~입니다.","어디서 왔어요?","반갑습니다!"]}'::jsonb),
  ('ko-unit-2-lesson-1-act-1', 'ko-unit-2-lesson-1', 1, 'multiple_choice', 'Choose the correct answer:', '{"question":"What number does \"삼\" mean?","options":["1","2","3","5"],"correctIndex":2}'::jsonb),
  ('ko-unit-2-lesson-1-act-2', 'ko-unit-2-lesson-1', 2, 'vocabulary_match', 'Match the Korean number with the corresponding number:', '{"pairs":[{"word":"일","match":"1"},{"word":"이","match":"2"},{"word":"오","match":"5"},{"word":"십","match":"10"}]}'::jsonb),
  ('ko-unit-2-lesson-1-act-3', 'ko-unit-2-lesson-1', 3, 'ai_conversation', 'Count numbers with the AI teacher in Korean:', '{"scenario":"Count from 1 to 10 in Korean with the AI teacher.","suggestedPhrases":["일, 이, 삼...","몇 번이에요?","같이 세어 볼까요?"]}'::jsonb),
  ('ko-unit-2-lesson-2-act-1', 'ko-unit-2-lesson-2', 1, 'multiple_choice', 'Choose the correct meaning:', '{"question":"What does \"파란색\" mean?","options":["Red","Yellow","Blue","Green"],"correctIndex":2}'::jsonb),
  ('ko-unit-2-lesson-2-act-2', 'ko-unit-2-lesson-2', 2, 'translation', 'Translate into Korean:', '{"sourceText":"The sky is blue.","targetText":"하늘은 파란색입니다.","acceptedVariants":["하늘은 파란색입니다.","하늘은 파란색입니다","하늘이 파란색이에요."]}'::jsonb),
  ('ko-unit-2-lesson-2-act-3', 'ko-unit-2-lesson-2', 3, 'ai_conversation', 'Describe colors with the AI teacher in Korean:', '{"scenario":"Describe the colors of the objects around you in Korean.","suggestedPhrases":["이것은 ~색입니다.","무슨 색이에요?","제가 좋아하는 색은 ~입니다."]}'::jsonb),
  ('fr-unit-1-lesson-1-act-1', 'fr-unit-1-lesson-1', 1, 'multiple_choice', 'Choose the correct meaning:', '{"question":"What does \"Au revoir\" mean?","options":["Hello","Thank you","Goodbye","Sorry"],"correctIndex":2}'::jsonb),
  ('fr-unit-1-lesson-1-act-2', 'fr-unit-1-lesson-1', 2, 'vocabulary_match', 'Match the French word with its meaning:', '{"pairs":[{"word":"Bonjour","match":"Hello"},{"word":"Bonsoir","match":"Good evening"},{"word":"Au revoir","match":"Goodbye"},{"word":"Merci","match":"Thank you"}]}'::jsonb),
  ('fr-unit-1-lesson-1-act-3', 'fr-unit-1-lesson-1', 3, 'ai_conversation', 'Greet the AI teacher in French:', '{"scenario":"Greet the AI teacher in French and say thank you.","suggestedPhrases":["Bonjour!","Merci beaucoup!","Au revoir!"]}'::jsonb),
  ('fr-unit-1-lesson-2-act-1', 'fr-unit-1-lesson-2', 1, 'multiple_choice', 'Choose the correct sentence:', '{"question":"How do you say \"My name is Nam\" in French?","options":["Je viens de Nam.","Enchanté, Nam.","Je m''appelle Nam.","Comment allez-vous, Nam?"],"correctIndex":2}'::jsonb),
  ('fr-unit-1-lesson-2-act-2', 'fr-unit-1-lesson-2', 2, 'translation', 'Translate into French:', '{"sourceText":"Nice to meet you!","targetText":"Enchanté!","acceptedVariants":["Enchanté!","Enchanté","Enchantée!","Enchantée"]}'::jsonb),
  ('fr-unit-1-lesson-2-act-3', 'fr-unit-1-lesson-2', 3, 'ai_conversation', 'Introduce yourself to the AI teacher in French:', '{"scenario":"Introduce your name and where you''re from in French.","suggestedPhrases":["Je m''appelle...","Je viens de...","Enchanté!"]}'::jsonb),
  ('fr-unit-2-lesson-1-act-1', 'fr-unit-2-lesson-1', 1, 'multiple_choice', 'Choose the correct answer:', '{"question":"What number does \"Trois\" mean?","options":["1","2","3","5"],"correctIndex":2}'::jsonb),
  ('fr-unit-2-lesson-1-act-2', 'fr-unit-2-lesson-1', 2, 'vocabulary_match', 'Match the French number with the corresponding number:', '{"pairs":[{"word":"Un","match":"1"},{"word":"Deux","match":"2"},{"word":"Cinq","match":"5"},{"word":"Dix","match":"10"}]}'::jsonb),
  ('fr-unit-2-lesson-1-act-3', 'fr-unit-2-lesson-1', 3, 'ai_conversation', 'Count numbers with the AI teacher in French:', '{"scenario":"Count from 1 to 10 in French with the AI teacher.","suggestedPhrases":["Un, deux, trois...","Comment dit-on 7?","Comptons ensemble!"]}'::jsonb),
  ('fr-unit-2-lesson-2-act-1', 'fr-unit-2-lesson-2', 1, 'multiple_choice', 'Choose the correct meaning:', '{"question":"What does \"Bleu\" mean?","options":["Red","Yellow","Blue","Green"],"correctIndex":2}'::jsonb),
  ('fr-unit-2-lesson-2-act-2', 'fr-unit-2-lesson-2', 2, 'translation', 'Translate into French:', '{"sourceText":"The sky is blue.","targetText":"Le ciel est bleu.","acceptedVariants":["Le ciel est bleu.","Le ciel est bleu","le ciel est bleu"]}'::jsonb),
  ('fr-unit-2-lesson-2-act-3', 'fr-unit-2-lesson-2', 3, 'ai_conversation', 'Describe colors with the AI teacher in French:', '{"scenario":"Describe the colors of the objects around you in French.","suggestedPhrases":["C''est... rouge.","De quelle couleur est...?","Ma couleur préférée est..."]}'::jsonb),
  ('es-unit-1-lesson-1-act-1', 'es-unit-1-lesson-1', 1, 'multiple_choice', 'Choose the correct meaning:', '{"question":"What does \"Adiós\" mean?","options":["Hello","Thank you","Goodbye","Sorry"],"correctIndex":2}'::jsonb),
  ('es-unit-1-lesson-1-act-2', 'es-unit-1-lesson-1', 2, 'vocabulary_match', 'Match the Spanish word with its meaning:', '{"pairs":[{"word":"Hola","match":"Hello"},{"word":"Buenos días","match":"Good morning"},{"word":"Adiós","match":"Goodbye"},{"word":"Gracias","match":"Thank you"}]}'::jsonb),
  ('es-unit-1-lesson-1-act-3', 'es-unit-1-lesson-1', 3, 'ai_conversation', 'Greet the AI teacher in Spanish:', '{"scenario":"Greet the AI teacher and say thank you in Spanish.","suggestedPhrases":["¡Hola!","¡Gracias!","¡Adiós!"]}'::jsonb),
  ('es-unit-1-lesson-2-act-1', 'es-unit-1-lesson-2', 1, 'multiple_choice', 'Choose the correct sentence:', '{"question":"How do you say \"My name is Nam\" in Spanish?","options":["Soy de Nam.","Me llamo Nam.","Mucho gusto, Nam.","¿Cómo estás, Nam?"],"correctIndex":1}'::jsonb),
  ('es-unit-1-lesson-2-act-2', 'es-unit-1-lesson-2', 2, 'translation', 'Translate into Spanish:', '{"sourceText":"Nice to meet you!","targetText":"¡Mucho gusto!","acceptedVariants":["¡Mucho gusto!","Mucho gusto!","Mucho gusto","¡Mucho gusto"]}'::jsonb),
  ('es-unit-1-lesson-2-act-3', 'es-unit-1-lesson-2', 3, 'ai_conversation', 'Introduce yourself to the AI teacher in Spanish:', '{"scenario":"Introduce your name and where you''re from in Spanish.","suggestedPhrases":["Me llamo...","Soy de...","¡Mucho gusto!"]}'::jsonb),
  ('es-unit-2-lesson-1-act-1', 'es-unit-2-lesson-1', 1, 'multiple_choice', 'Choose the correct answer:', '{"question":"What number does \"Tres\" mean?","options":["1","2","3","5"],"correctIndex":2}'::jsonb),
  ('es-unit-2-lesson-1-act-2', 'es-unit-2-lesson-1', 2, 'vocabulary_match', 'Match the Spanish number with the corresponding number:', '{"pairs":[{"word":"Uno","match":"1"},{"word":"Dos","match":"2"},{"word":"Cinco","match":"5"},{"word":"Diez","match":"10"}]}'::jsonb),
  ('es-unit-2-lesson-1-act-3', 'es-unit-2-lesson-1', 3, 'ai_conversation', 'Count numbers with the AI teacher in Spanish:', '{"scenario":"Count from 1 to 10 in Spanish with the AI teacher.","suggestedPhrases":["Uno, dos, tres...","¿Cómo se dice 7?","¡Contemos juntos!"]}'::jsonb),
  ('es-unit-2-lesson-2-act-1', 'es-unit-2-lesson-2', 1, 'multiple_choice', 'Choose the correct meaning:', '{"question":"What does \"Azul\" mean?","options":["Red","Yellow","Blue","Green"],"correctIndex":2}'::jsonb),
  ('es-unit-2-lesson-2-act-2', 'es-unit-2-lesson-2', 2, 'translation', 'Translate into Spanish:', '{"sourceText":"The sky is blue.","targetText":"El cielo es azul.","acceptedVariants":["El cielo es azul.","El cielo es azul","el cielo es azul"]}'::jsonb),
  ('es-unit-2-lesson-2-act-3', 'es-unit-2-lesson-2', 3, 'ai_conversation', 'Describe colors with the AI teacher in Spanish:', '{"scenario":"Describe the colors of the objects around you in Spanish.","suggestedPhrases":["Es... rojo.","¿De qué color es...?","Mi color favorito es..."]}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  "order" = EXCLUDED."order",
  type = EXCLUDED.type,
  instruction = EXCLUDED.instruction,
  data = EXCLUDED.data;

-- ─── 3. Progress Tables Foreign Keys ────────────────────────────────────────

ALTER TABLE public.user_languages
  DROP CONSTRAINT IF EXISTS user_languages_language_id_check,
  DROP CONSTRAINT IF EXISTS fk_user_languages_language;

ALTER TABLE public.user_languages
  ADD CONSTRAINT fk_user_languages_language
  FOREIGN KEY (language_id) REFERENCES public.languages(id)
  ON DELETE RESTRICT;

ALTER TABLE public.lesson_progress
  DROP CONSTRAINT IF EXISTS fk_lesson_progress_lesson;

ALTER TABLE public.lesson_progress
  ADD CONSTRAINT fk_lesson_progress_lesson
  FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
  ON DELETE RESTRICT;

ALTER TABLE public.vocabulary_progress
  DROP CONSTRAINT IF EXISTS fk_vocab_progress_vocab_lesson;

ALTER TABLE public.vocabulary_progress
  ADD CONSTRAINT fk_vocab_progress_vocab_lesson
  FOREIGN KEY (vocabulary_id, lesson_id) REFERENCES public.vocabularies(id, lesson_id)
  ON DELETE RESTRICT;

-- ─── 4. RPC Integrity Updates ───────────────────────────────────────────────

-- RPC: set_active_language
CREATE OR REPLACE FUNCTION public.set_active_language(p_language_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (select auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.languages WHERE id = p_language_id) THEN
    RAISE EXCEPTION 'Invalid language_id: %', p_language_id;
  END IF;

  -- Deactivate previous active language
  UPDATE public.user_languages
  SET is_active = false, updated_at = now()
  WHERE user_id = v_user_id AND is_active = true;

  -- Upsert chosen language as active
  INSERT INTO public.user_languages (user_id, language_id, is_active, started_at, updated_at)
  VALUES (v_user_id, p_language_id, true, now(), now())
  ON CONFLICT (user_id, language_id)
  DO UPDATE SET is_active = true, updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.set_active_language(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_active_language(text) TO authenticated;

-- RPC: record_lesson_progress
CREATE OR REPLACE FUNCTION public.record_lesson_progress(
  p_lesson_id text,
  p_status text,
  p_current_activity integer,
  p_xp_earned integer,
  p_minutes_practiced integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (select auth.uid());
  v_today date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_old_status text;
  v_old_xp integer;
  v_xp_delta integer;
  v_completed_delta integer;
  v_started_at timestamptz;
  v_completed_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE id = p_lesson_id) THEN
    RAISE EXCEPTION 'Invalid lesson_id: %', p_lesson_id;
  END IF;

  IF p_status NOT IN ('not_started', 'in_progress', 'completed') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  SELECT status, xp_earned INTO v_old_status, v_old_xp
  FROM public.lesson_progress
  WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

  v_xp_delta := GREATEST(0, p_xp_earned - COALESCE(v_old_xp, 0));
  v_completed_delta := CASE WHEN p_status = 'completed' AND COALESCE(v_old_status, 'not_started') != 'completed' THEN 1 ELSE 0 END;
  v_started_at := CASE WHEN p_status != 'not_started' THEN now() ELSE NULL END;
  v_completed_at := CASE WHEN p_status = 'completed' THEN now() ELSE NULL END;

  -- Upsert lesson progress
  INSERT INTO public.lesson_progress (
    user_id, lesson_id, status, current_activity, attempts, xp_earned, started_at, completed_at, updated_at
  )
  VALUES (
    v_user_id, p_lesson_id, p_status, GREATEST(0, p_current_activity), 1, GREATEST(0, p_xp_earned), v_started_at, v_completed_at, now()
  )
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    current_activity = EXCLUDED.current_activity,
    attempts = public.lesson_progress.attempts + 1,
    xp_earned = GREATEST(public.lesson_progress.xp_earned, EXCLUDED.xp_earned),
    started_at = COALESCE(public.lesson_progress.started_at, EXCLUDED.started_at),
    completed_at = COALESCE(public.lesson_progress.completed_at, EXCLUDED.completed_at),
    updated_at = now();

  -- Upsert daily activity atomically
  INSERT INTO public.daily_activity (
    user_id, activity_date, xp_earned, lessons_completed, vocabulary_reviews, minutes_practiced, created_at, updated_at
  )
  VALUES (
    v_user_id, v_today, v_xp_delta, v_completed_delta, 0, GREATEST(0, p_minutes_practiced), now(), now()
  )
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    xp_earned = public.daily_activity.xp_earned + EXCLUDED.xp_earned,
    lessons_completed = public.daily_activity.lessons_completed + EXCLUDED.lessons_completed,
    minutes_practiced = public.daily_activity.minutes_practiced + EXCLUDED.minutes_practiced,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_lesson_progress(text, text, integer, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_lesson_progress(text, text, integer, integer, integer) TO authenticated;

-- RPC: record_vocabulary_review
CREATE OR REPLACE FUNCTION public.record_vocabulary_review(
  p_vocabulary_id text,
  p_lesson_id text,
  p_status text,
  p_is_correct boolean,
  p_ease_factor numeric,
  p_interval_days integer,
  p_due_at timestamptz,
  p_minutes_practiced integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (select auth.uid());
  v_today date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.vocabularies WHERE id = p_vocabulary_id AND lesson_id = p_lesson_id) THEN
    RAISE EXCEPTION 'Invalid vocabulary_id (%) for lesson_id (%)', p_vocabulary_id, p_lesson_id;
  END IF;

  IF p_status NOT IN ('learning', 'mastered') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- Upsert vocabulary progress
  INSERT INTO public.vocabulary_progress (
    user_id, vocabulary_id, lesson_id, status, correct_count, incorrect_count, repetitions, ease_factor, interval_days, due_at, last_reviewed_at, updated_at
  )
  VALUES (
    v_user_id, p_vocabulary_id, p_lesson_id, p_status,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    CASE WHEN p_is_correct THEN 0 ELSE 1 END,
    1, GREATEST(1.30, p_ease_factor), GREATEST(0, p_interval_days), p_due_at, now(), now()
  )
  ON CONFLICT (user_id, vocabulary_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    correct_count = public.vocabulary_progress.correct_count + (CASE WHEN p_is_correct THEN 1 ELSE 0 END),
    incorrect_count = public.vocabulary_progress.incorrect_count + (CASE WHEN p_is_correct THEN 0 ELSE 1 END),
    repetitions = public.vocabulary_progress.repetitions + 1,
    ease_factor = EXCLUDED.ease_factor,
    interval_days = EXCLUDED.interval_days,
    due_at = EXCLUDED.due_at,
    last_reviewed_at = now(),
    updated_at = now();

  -- Upsert daily activity atomically
  INSERT INTO public.daily_activity (
    user_id, activity_date, xp_earned, lessons_completed, vocabulary_reviews, minutes_practiced, created_at, updated_at
  )
  VALUES (
    v_user_id, v_today, 0, 0, 1, GREATEST(0, p_minutes_practiced), now(), now()
  )
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    vocabulary_reviews = public.daily_activity.vocabulary_reviews + 1,
    minutes_practiced = public.daily_activity.minutes_practiced + EXCLUDED.minutes_practiced,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_vocabulary_review(text, text, text, boolean, numeric, integer, timestamptz, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_vocabulary_review(text, text, text, boolean, numeric, integer, timestamptz, integer) TO authenticated;

-- ─── 5. RLS Policies & Grants ───────────────────────────────────────────────

GRANT SELECT ON public.languages, public.units, public.lessons, public.vocabularies, public.activities TO authenticated;

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "languages_select" ON public.languages;
CREATE POLICY "languages_select" ON public.languages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "units_select" ON public.units;
CREATE POLICY "units_select" ON public.units FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lessons_select" ON public.lessons;
CREATE POLICY "lessons_select" ON public.lessons FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "vocabularies_select" ON public.vocabularies;
CREATE POLICY "vocabularies_select" ON public.vocabularies FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "activities_select" ON public.activities;
CREATE POLICY "activities_select" ON public.activities FOR SELECT TO authenticated USING (true);
