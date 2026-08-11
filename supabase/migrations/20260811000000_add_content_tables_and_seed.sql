-- Migration: 20260811000000_add_content_tables_and_seed.sql
-- Description: Create content tables (languages, units, lessons, vocabularies, activities), seed data, add progress table foreign keys, update RPC integrity validation, enable RLS policies and grants.

-- ─── 1. Content Tables DDL & Indexes ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.languages (
  id text PRIMARY KEY,
  name text NOT NULL,
  native_name text NOT NULL,
  flag text NOT NULL,
  learner_language text NOT NULL DEFAULT 'vi',
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
  ('en', 'English', 'English', '🇬🇧', 'vi', 'POPULAR', '1.2M Learners'),
  ('es', 'Spanish', 'Español', '🇪🇸', 'vi', NULL, '850K Learners'),
  ('ko', 'Korean', '한국어', '🇰🇷', 'vi', 'POPULAR', '620K Learners'),
  ('fr', 'French', 'Français', '🇫🇷', 'vi', NULL, '450K Learners')
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
  ('en-unit-1', 'en', 1, 'Greetings & Introductions', 'Học cách chào hỏi và tự giới thiệu bằng tiếng Anh', '👋'),
  ('en-unit-2', 'en', 2, 'Numbers & Colors', 'Học đếm số và gọi tên màu sắc bằng tiếng Anh', '🔢'),
  ('ko-unit-1', 'ko', 1, '인사 & 소개', 'Học cách chào hỏi và tự giới thiệu bằng tiếng Hàn', '🙇'),
  ('ko-unit-2', 'ko', 2, '숫자 & 색깔', 'Học đếm số và gọi tên màu sắc bằng tiếng Hàn', '🔢'),
  ('fr-unit-1', 'fr', 1, 'Salutations & Présentations', 'Học cách chào hỏi và tự giới thiệu bằng tiếng Pháp', '👋'),
  ('fr-unit-2', 'fr', 2, 'Nombres & Couleurs', 'Học đếm số và gọi tên màu sắc bằng tiếng Pháp', '🔢'),
  ('es-unit-1', 'es', 1, 'Saludos & Presentaciones', 'Học cách chào hỏi và tự giới thiệu bằng tiếng Tây Ban Nha', '👋'),
  ('es-unit-2', 'es', 2, 'Números & Colores', 'Học đếm số và gọi tên màu sắc bằng tiếng Tây Ban Nha', '🔢')
ON CONFLICT (id) DO UPDATE SET
  language_id = EXCLUDED.language_id,
  "order" = EXCLUDED."order",
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon_emoji = EXCLUDED.icon_emoji;

-- Lessons (16)
INSERT INTO public.lessons (id, unit_id, "order", title, xp_reward, estimated_minutes, ai_teacher_prompt)
VALUES
  ('en-unit-1-lesson-1', 'en-unit-1', 1, 'Hello & Goodbye', 10, 5, 'You are Lumi, a friendly English teacher speaking to a Vietnamese learner. The student just learned basic greetings: Hello, Goodbye, Good morning, Good night. Your goal: help them practice greeting naturally in English. Speak mostly in English using simple sentences. Switch to Vietnamese only to clarify meaning when necessary. Start by greeting the student warmly in English.'),
  ('en-unit-1-lesson-2', 'en-unit-1', 2, 'Introducing Yourself', 20, 10, 'You are Lumi, a friendly English teacher speaking to a Vietnamese learner. The student just learned self-introduction phrases: My name is, I am from, Nice to meet you, How are you, I am fine. Your goal: help them introduce themselves confidently in English. Speak mostly in English. Switch to Vietnamese only to clarify meaning. Ask the student their name and where they are from to start the conversation.'),
  ('en-unit-2-lesson-1', 'en-unit-2', 1, 'Numbers 1–10', 10, 5, 'You are Lumi, a friendly English teacher speaking to a Vietnamese learner. The student just learned numbers: one, two, three, five, ten. Your goal: help them count confidently from 1 to 10 in English. Speak in English. Switch to Vietnamese only to clarify. Start by asking the student to count together with you.'),
  ('en-unit-2-lesson-2', 'en-unit-2', 2, 'Colors', 20, 10, 'You are Lumi, a friendly English teacher speaking to a Vietnamese learner. The student just learned colors: red, blue, green, yellow. Your goal: help them describe colors of everyday objects in English. Ask about colors of things around them. Speak in English. Switch to Vietnamese only to clarify.'),
  ('ko-unit-1-lesson-1', 'ko-unit-1', 1, '안녕하세요 (Xin chào)', 10, 5, 'You are Lumi, a friendly Korean teacher speaking to a Vietnamese learner. The student just learned basic Korean greetings: 안녕하세요, 안녕, 감사합니다, 죄송합니다. Your goal: help them greet and thank naturally in Korean. Speak mostly in Korean with simple sentences. Switch to Vietnamese to clarify meaning. Start with 안녕하세요 and encourage the student to respond.'),
  ('ko-unit-1-lesson-2', 'ko-unit-1', 2, '자기소개 (Tự giới thiệu)', 20, 10, 'You are Lumi, a friendly Korean teacher speaking to a Vietnamese learner. The student just learned self-introduction in Korean: 저는 ~입니다, 이름이 뭐예요, 반갑습니다, 어디서 왔어요. Your goal: help them introduce themselves naturally in Korean. Ask the student their name and where they are from. Speak in Korean. Switch to Vietnamese to clarify.'),
  ('ko-unit-2-lesson-1', 'ko-unit-2', 1, '숫자 (Số đếm)', 10, 5, 'You are Lumi, a friendly Korean teacher speaking to a Vietnamese learner. The student just learned Sino-Korean numbers: 일, 이, 삼, 오, 십. Your goal: help them count from 1 to 10 in Korean. Count together with the student. Speak in Korean. Switch to Vietnamese to clarify.'),
  ('ko-unit-2-lesson-2', 'ko-unit-2', 2, '색깔 (Màu sắc)', 20, 10, 'You are Lumi, a friendly Korean teacher speaking to a Vietnamese learner. The student just learned Korean colors: 빨간색, 파란색, 초록색, 노란색. Your goal: help them describe colors of everyday objects in Korean. Ask about colors of things around them. Speak in Korean. Switch to Vietnamese to clarify.'),
  ('fr-unit-1-lesson-1', 'fr-unit-1', 1, 'Bonjour & Au revoir', 10, 5, 'You are Lumi, a friendly French teacher speaking to a Vietnamese learner. The student just learned basic French greetings: Bonjour, Bonsoir, Au revoir, Merci. Your goal: help them greet naturally in French. Speak mostly in French using simple sentences. Switch to Vietnamese to clarify. Start with Bonjour and encourage the student to respond.'),
  ('fr-unit-1-lesson-2', 'fr-unit-1', 2, 'Se présenter', 20, 10, 'You are Lumi, a friendly French teacher speaking to a Vietnamese learner. The student just learned self-introduction in French: Je m''appelle, Je viens de, Enchanté, Comment allez-vous. Your goal: help them introduce themselves naturally in French. Ask their name and where they are from. Speak in French. Switch to Vietnamese to clarify.'),
  ('fr-unit-2-lesson-1', 'fr-unit-2', 1, 'Les nombres 1–10', 10, 5, 'You are Lumi, a friendly French teacher speaking to a Vietnamese learner. The student just learned French numbers: un, deux, trois, cinq, dix. Your goal: help them count from 1 to 10 in French. Count together with the student. Speak in French. Switch to Vietnamese to clarify.'),
  ('fr-unit-2-lesson-2', 'fr-unit-2', 2, 'Les couleurs', 20, 10, 'You are Lumi, a friendly French teacher speaking to a Vietnamese learner. The student just learned French colors: rouge, bleu, vert, jaune. Your goal: help them describe colors of everyday objects in French. Ask about colors of things around them. Speak in French. Switch to Vietnamese to clarify.'),
  ('es-unit-1-lesson-1', 'es-unit-1', 1, 'Hola & Adiós', 10, 5, 'You are Lumi, a friendly Spanish teacher speaking to a Vietnamese learner. The student just learned basic Spanish greetings: Hola, Buenos días, Adiós, Gracias. Your goal: help them greet naturally in Spanish. Speak mostly in Spanish using simple sentences. Switch to Vietnamese to clarify. Start with ¡Hola! and encourage the student to respond.'),
  ('es-unit-1-lesson-2', 'es-unit-1', 2, 'Presentarse', 20, 10, 'You are Lumi, a friendly Spanish teacher speaking to a Vietnamese learner. The student just learned self-introduction in Spanish: Me llamo, Soy de, Mucho gusto, ¿Cómo estás?. Your goal: help them introduce themselves naturally in Spanish. Ask their name and where they are from. Speak in Spanish. Switch to Vietnamese to clarify.'),
  ('es-unit-2-lesson-1', 'es-unit-2', 1, 'Los números 1–10', 10, 5, 'You are Lumi, a friendly Spanish teacher speaking to a Vietnamese learner. The student just learned Spanish numbers: uno, dos, tres, cinco, diez. Your goal: help them count from 1 to 10 in Spanish. Count together with the student. Speak in Spanish. Switch to Vietnamese to clarify.'),
  ('es-unit-2-lesson-2', 'es-unit-2', 2, 'Los colores', 20, 10, 'You are Lumi, a friendly Spanish teacher speaking to a Vietnamese learner. The student just learned Spanish colors: rojo, azul, verde, amarillo. Your goal: help them describe colors of everyday objects in Spanish. Ask about colors of things around them. Speak in Spanish. Switch to Vietnamese to clarify.')
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
  ('en-vocab-hello', 'en-unit-1-lesson-1', 'Hello', 'Xin chào', '/həˈloʊ/', 'Hello, my name is Lumi.', 'Xin chào, tôi tên là Lumi.'),
  ('en-vocab-goodbye', 'en-unit-1-lesson-1', 'Goodbye', 'Tạm biệt', '/ˌɡʊdˈbaɪ/', 'Goodbye, see you tomorrow!', 'Tạm biệt, hẹn gặp lại ngày mai!'),
  ('en-vocab-good-morning', 'en-unit-1-lesson-1', 'Good morning', 'Chào buổi sáng', '/ɡʊd ˈmɔːrnɪŋ/', 'Good morning! How are you?', 'Chào buổi sáng! Bạn có khoẻ không?'),
  ('en-vocab-good-night', 'en-unit-1-lesson-1', 'Good night', 'Chúc ngủ ngon', '/ɡʊd naɪt/', 'Good night, sweet dreams.', 'Chúc ngủ ngon, mơ đẹp nhé.'),
  ('en-vocab-my-name-is', 'en-unit-1-lesson-2', 'My name is', 'Tên tôi là', '/maɪ neɪm ɪz/', 'My name is Anna.', 'Tên tôi là Anna.'),
  ('en-vocab-i-am-from', 'en-unit-1-lesson-2', 'I am from', 'Tôi đến từ', '/aɪ æm frɒm/', 'I am from Vietnam.', 'Tôi đến từ Việt Nam.'),
  ('en-vocab-nice-to-meet-you', 'en-unit-1-lesson-2', 'Nice to meet you', 'Rất vui được gặp bạn', '/naɪs tə miːt juː/', 'Nice to meet you, Tom!', 'Rất vui được gặp bạn, Tom!'),
  ('en-vocab-how-are-you', 'en-unit-1-lesson-2', 'How are you?', 'Bạn có khoẻ không?', '/haʊ ɑːr juː/', 'Hello! How are you?', 'Xin chào! Bạn có khoẻ không?'),
  ('en-vocab-i-am-fine', 'en-unit-1-lesson-2', 'I am fine', 'Tôi khoẻ', '/aɪ æm faɪn/', 'I am fine, thank you!', 'Tôi khoẻ, cảm ơn!'),
  ('en-vocab-one', 'en-unit-2-lesson-1', 'One', 'Một', '/wʌn/', 'I have one cat.', 'Tôi có một con mèo.'),
  ('en-vocab-two', 'en-unit-2-lesson-1', 'Two', 'Hai', '/tuː/', 'She has two sisters.', 'Cô ấy có hai người chị.'),
  ('en-vocab-three', 'en-unit-2-lesson-1', 'Three', 'Ba', '/θriː/', 'There are three books.', 'Có ba quyển sách.'),
  ('en-vocab-five', 'en-unit-2-lesson-1', 'Five', 'Năm', '/faɪv/', 'I am five years old.', 'Tôi năm tuổi.'),
  ('en-vocab-ten', 'en-unit-2-lesson-1', 'Ten', 'Mười', '/ten/', 'Count to ten.', 'Đếm đến mười.'),
  ('en-vocab-red', 'en-unit-2-lesson-2', 'Red', 'Đỏ', '/red/', 'The apple is red.', 'Quả táo màu đỏ.'),
  ('en-vocab-blue', 'en-unit-2-lesson-2', 'Blue', 'Xanh dương', '/bluː/', 'The sky is blue.', 'Bầu trời màu xanh dương.'),
  ('en-vocab-green', 'en-unit-2-lesson-2', 'Green', 'Xanh lá', '/ɡriːn/', 'The tree is green.', 'Cái cây màu xanh lá.'),
  ('en-vocab-yellow', 'en-unit-2-lesson-2', 'Yellow', 'Vàng', '/ˈjeloʊ/', 'The sun is yellow.', 'Mặt trời màu vàng.'),
  ('ko-vocab-hello', 'ko-unit-1-lesson-1', '안녕하세요', 'Xin chào (trang trọng)', 'an-nyeong-ha-se-yo', '안녕하세요! 처음 뵙겠습니다.', 'Xin chào! Rất vui được gặp bạn.'),
  ('ko-vocab-hello-casual', 'ko-unit-1-lesson-1', '안녕', 'Chào (thân mật)', 'an-nyeong', '안녕! 잘 지냈어?', 'Chào! Bạn có khoẻ không?'),
  ('ko-vocab-thank-you', 'ko-unit-1-lesson-1', '감사합니다', 'Cảm ơn', 'gam-sa-ham-ni-da', '도와주셔서 감사합니다.', 'Cảm ơn bạn đã giúp đỡ.'),
  ('ko-vocab-sorry', 'ko-unit-1-lesson-1', '죄송합니다', 'Xin lỗi', 'joe-song-ham-ni-da', '늦어서 죄송합니다.', 'Xin lỗi vì đã trễ.'),
  ('ko-vocab-my-name-is', 'ko-unit-1-lesson-2', '저는 ~입니다', 'Tôi là ~', 'jeo-neun ~im-ni-da', '저는 학생입니다.', 'Tôi là học sinh.'),
  ('ko-vocab-what-is-your-name', 'ko-unit-1-lesson-2', '이름이 뭐예요?', 'Tên bạn là gì?', 'i-reum-i mwo-ye-yo', '이름이 뭐예요? 저는 Lumi예요.', 'Tên bạn là gì? Tôi là Lumi.'),
  ('ko-vocab-nice-to-meet-you', 'ko-unit-1-lesson-2', '반갑습니다', 'Rất vui được gặp bạn', 'ban-gap-seum-ni-da', '처음 뵙겠습니다. 반갑습니다!', 'Lần đầu gặp. Rất vui được gặp bạn!'),
  ('ko-vocab-where-are-you-from', 'ko-unit-1-lesson-2', '어디서 왔어요?', 'Bạn đến từ đâu?', 'eo-di-seo wa-sseo-yo', '어디서 왔어요? 베트남에서 왔어요.', 'Bạn đến từ đâu? Tôi đến từ Việt Nam.'),
  ('ko-vocab-one', 'ko-unit-2-lesson-1', '일 (一)', 'Một', 'il', '일 더하기 일은 이입니다.', 'Một cộng một bằng hai.'),
  ('ko-vocab-two', 'ko-unit-2-lesson-1', '이 (二)', 'Hai', 'i', '이 개의 사과가 있습니다.', 'Có hai quả táo.'),
  ('ko-vocab-three', 'ko-unit-2-lesson-1', '삼 (三)', 'Ba', 'sam', '삼 일 동안 공부했습니다.', 'Tôi đã học ba ngày.'),
  ('ko-vocab-five', 'ko-unit-2-lesson-1', '오 (五)', 'Năm', 'o', '오 분만 기다려 주세요.', 'Xin đợi năm phút.'),
  ('ko-vocab-ten', 'ko-unit-2-lesson-1', '십 (十)', 'Mười', 'sip', '십 명이 왔습니다.', 'Có mười người đến.'),
  ('ko-vocab-red', 'ko-unit-2-lesson-2', '빨간색', 'Màu đỏ', 'ppal-gan-saek', '사과는 빨간색입니다.', 'Quả táo màu đỏ.'),
  ('ko-vocab-blue', 'ko-unit-2-lesson-2', '파란색', 'Màu xanh dương', 'pa-ran-saek', '하늘은 파란색입니다.', 'Bầu trời màu xanh dương.'),
  ('ko-vocab-green', 'ko-unit-2-lesson-2', '초록색', 'Màu xanh lá', 'cho-rok-saek', '나뭇잎은 초록색입니다.', 'Lá cây màu xanh lá.'),
  ('ko-vocab-yellow', 'ko-unit-2-lesson-2', '노란색', 'Màu vàng', 'no-ran-saek', '바나나는 노란색입니다.', 'Quả chuối màu vàng.'),
  ('fr-vocab-bonjour', 'fr-unit-1-lesson-1', 'Bonjour', 'Xin chào / Chào buổi sáng', '/bɔ̃.ʒuʁ/', 'Bonjour, comment vous appelez-vous?', 'Xin chào, bạn tên là gì?'),
  ('fr-vocab-bonsoir', 'fr-unit-1-lesson-1', 'Bonsoir', 'Chào buổi tối', '/bɔ̃.swaʁ/', 'Bonsoir! Vous avez passé une bonne journée?', 'Chào buổi tối! Bạn có một ngày tốt không?'),
  ('fr-vocab-au-revoir', 'fr-unit-1-lesson-1', 'Au revoir', 'Tạm biệt', '/o ʁə.vwaʁ/', 'Au revoir, à demain!', 'Tạm biệt, hẹn gặp lại ngày mai!'),
  ('fr-vocab-merci', 'fr-unit-1-lesson-1', 'Merci', 'Cảm ơn', '/mɛʁ.si/', 'Merci beaucoup!', 'Cảm ơn rất nhiều!'),
  ('fr-vocab-je-mappelle', 'fr-unit-1-lesson-2', 'Je m''appelle', 'Tôi tên là', '/ʒə ma.pɛl/', 'Je m''appelle Marie.', 'Tôi tên là Marie.'),
  ('fr-vocab-je-viens-de', 'fr-unit-1-lesson-2', 'Je viens de', 'Tôi đến từ', '/ʒə vjɛ̃ də/', 'Je viens du Vietnam.', 'Tôi đến từ Việt Nam.'),
  ('fr-vocab-enchante', 'fr-unit-1-lesson-2', 'Enchanté(e)', 'Rất vui được gặp bạn', '/ɑ̃.ʃɑ̃.te/', 'Bonjour! Enchanté!', 'Xin chào! Rất vui được gặp bạn!'),
  ('fr-vocab-comment-allez-vous', 'fr-unit-1-lesson-2', 'Comment allez-vous?', 'Bạn có khoẻ không?', '/kɔ.mɑ̃ ta.le vu/', 'Bonjour! Comment allez-vous?', 'Xin chào! Bạn có khoẻ không?'),
  ('fr-vocab-un', 'fr-unit-2-lesson-1', 'Un / Une', 'Một', '/œ̃/ /yn/', 'J''ai un chat.', 'Tôi có một con mèo.'),
  ('fr-vocab-deux', 'fr-unit-2-lesson-1', 'Deux', 'Hai', '/dø/', 'Il a deux frères.', 'Anh ấy có hai người anh.'),
  ('fr-vocab-trois', 'fr-unit-2-lesson-1', 'Trois', 'Ba', '/tʁwa/', 'Il y a trois livres.', 'Có ba quyển sách.'),
  ('fr-vocab-cinq', 'fr-unit-2-lesson-1', 'Cinq', 'Năm', '/sɛ̃k/', 'J''ai cinq ans.', 'Tôi năm tuổi.'),
  ('fr-vocab-dix', 'fr-unit-2-lesson-1', 'Dix', 'Mười', '/dis/', 'Comptez jusqu''à dix.', 'Hãy đếm đến mười.'),
  ('fr-vocab-rouge', 'fr-unit-2-lesson-2', 'Rouge', 'Màu đỏ', '/ʁuʒ/', 'La pomme est rouge.', 'Quả táo màu đỏ.'),
  ('fr-vocab-bleu', 'fr-unit-2-lesson-2', 'Bleu / Bleue', 'Màu xanh dương', '/blø/', 'Le ciel est bleu.', 'Bầu trời màu xanh dương.'),
  ('fr-vocab-vert', 'fr-unit-2-lesson-2', 'Vert / Verte', 'Màu xanh lá', '/vɛʁ/', 'L''arbre est vert.', 'Cái cây màu xanh lá.'),
  ('fr-vocab-jaune', 'fr-unit-2-lesson-2', 'Jaune', 'Màu vàng', '/ʒon/', 'Le soleil est jaune.', 'Mặt trời màu vàng.'),
  ('es-vocab-hola', 'es-unit-1-lesson-1', 'Hola', 'Xin chào', '/ˈo.la/', '¡Hola! ¿Cómo te llamas?', 'Xin chào! Bạn tên là gì?'),
  ('es-vocab-buenos-dias', 'es-unit-1-lesson-1', 'Buenos días', 'Chào buổi sáng', '/ˈbwe.nos ˈdi.as/', '¡Buenos días! ¿Cómo estás?', 'Chào buổi sáng! Bạn có khoẻ không?'),
  ('es-vocab-adios', 'es-unit-1-lesson-1', 'Adiós', 'Tạm biệt', '/a.ˈðjos/', '¡Adiós! ¡Hasta mañana!', 'Tạm biệt! Hẹn gặp lại ngày mai!'),
  ('es-vocab-gracias', 'es-unit-1-lesson-1', 'Gracias', 'Cảm ơn', '/ˈɡɾa.θjas/', '¡Muchas gracias!', 'Cảm ơn rất nhiều!'),
  ('es-vocab-me-llamo', 'es-unit-1-lesson-2', 'Me llamo', 'Tôi tên là', '/me ˈʎa.mo/', 'Me llamo Carlos.', 'Tôi tên là Carlos.'),
  ('es-vocab-soy-de', 'es-unit-1-lesson-2', 'Soy de', 'Tôi đến từ', '/soi ðe/', 'Soy de Vietnam.', 'Tôi đến từ Việt Nam.'),
  ('es-vocab-mucho-gusto', 'es-unit-1-lesson-2', 'Mucho gusto', 'Rất vui được gặp bạn', '/ˈmu.tʃo ˈɡus.to/', '¡Hola! ¡Mucho gusto!', 'Xin chào! Rất vui được gặp bạn!'),
  ('es-vocab-como-estas', 'es-unit-1-lesson-2', '¿Cómo estás?', 'Bạn có khoẻ không?', '/ˈko.mo esˈtas/', '¡Hola! ¿Cómo estás?', 'Xin chào! Bạn có khoẻ không?'),
  ('es-vocab-uno', 'es-unit-2-lesson-1', 'Uno', 'Một', '/ˈu.no/', 'Tengo un gato.', 'Tôi có một con mèo.'),
  ('es-vocab-dos', 'es-unit-2-lesson-1', 'Dos', 'Hai', '/dos/', 'Ella tiene dos hermanas.', 'Cô ấy có hai người chị.'),
  ('es-vocab-tres', 'es-unit-2-lesson-1', 'Tres', 'Ba', '/tɾes/', 'Hay tres libros.', 'Có ba quyển sách.'),
  ('es-vocab-cinco', 'es-unit-2-lesson-1', 'Cinco', 'Năm', '/ˈθin.ko/', 'Tengo cinco años.', 'Tôi năm tuổi.'),
  ('es-vocab-diez', 'es-unit-2-lesson-1', 'Diez', 'Mười', '/ˈdjeθ/', 'Cuenta hasta diez.', 'Hãy đếm đến mười.'),
  ('es-vocab-rojo', 'es-unit-2-lesson-2', 'Rojo', 'Màu đỏ', '/ˈro.xo/', 'La manzana es roja.', 'Quả táo màu đỏ.'),
  ('es-vocab-azul', 'es-unit-2-lesson-2', 'Azul', 'Màu xanh dương', '/aˈθul/', 'El cielo es azul.', 'Bầu trời màu xanh dương.'),
  ('es-vocab-verde', 'es-unit-2-lesson-2', 'Verde', 'Màu xanh lá', '/ˈbeɾ.ðe/', 'El árbol es verde.', 'Cái cây màu xanh lá.'),
  ('es-vocab-amarillo', 'es-unit-2-lesson-2', 'Amarillo', 'Màu vàng', '/a.maˈɾi.ʎo/', 'El sol es amarillo.', 'Mặt trời màu vàng.')
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
  ('en-unit-1-lesson-1-act-1', 'en-unit-1-lesson-1', 1, 'multiple_choice', 'Chọn nghĩa đúng của từ sau:', '{"question":"\"Hello\" có nghĩa là gì?","options":["Tạm biệt","Xin chào","Cảm ơn","Xin lỗi"],"correctIndex":1}'::jsonb),
  ('en-unit-1-lesson-1-act-2', 'en-unit-1-lesson-1', 2, 'vocabulary_match', 'Nối từ tiếng Anh với nghĩa tiếng Việt:', '{"pairs":[{"word":"Hello","match":"Xin chào"},{"word":"Goodbye","match":"Tạm biệt"},{"word":"Good morning","match":"Chào buổi sáng"},{"word":"Good night","match":"Chúc ngủ ngon"}]}'::jsonb),
  ('en-unit-1-lesson-1-act-3', 'en-unit-1-lesson-1', 3, 'ai_conversation', 'Luyện tập chào hỏi với AI teacher Lumi:', '{"scenario":"Hãy chào AI teacher và giới thiệu tên bạn bằng tiếng Anh.","suggestedPhrases":["Hello!","My name is...","Nice to meet you!"]}'::jsonb),
  ('en-unit-1-lesson-2-act-1', 'en-unit-1-lesson-2', 1, 'multiple_choice', 'Chọn câu đúng để tự giới thiệu:', '{"question":"Làm thế nào để nói \"Tên tôi là Nam\" bằng tiếng Anh?","options":["I am from Nam.","My name is Nam.","Nice to meet Nam.","How are you Nam?"],"correctIndex":1}'::jsonb),
  ('en-unit-1-lesson-2-act-2', 'en-unit-1-lesson-2', 2, 'translation', 'Dịch câu sau sang tiếng Anh:', '{"sourceText":"Rất vui được gặp bạn!","targetText":"Nice to meet you!","acceptedVariants":["Nice to meet you!","Nice to meet you","nice to meet you"]}'::jsonb),
  ('en-unit-1-lesson-2-act-3', 'en-unit-1-lesson-2', 3, 'ai_conversation', 'Tự giới thiệu với AI teacher bằng tiếng Anh:', '{"scenario":"Hãy tự giới thiệu tên, quê quán và hỏi thăm AI teacher.","suggestedPhrases":["My name is...","I am from...","Nice to meet you!","How are you?"]}'::jsonb),
  ('en-unit-2-lesson-1-act-1', 'en-unit-2-lesson-1', 1, 'multiple_choice', 'Chọn số đúng:', '{"question":"\"Three\" có nghĩa là số mấy?","options":["1","2","3","5"],"correctIndex":2}'::jsonb),
  ('en-unit-2-lesson-1-act-2', 'en-unit-2-lesson-1', 2, 'vocabulary_match', 'Nối số tiếng Anh với số tương ứng:', '{"pairs":[{"word":"One","match":"1"},{"word":"Two","match":"2"},{"word":"Five","match":"5"},{"word":"Ten","match":"10"}]}'::jsonb),
  ('en-unit-2-lesson-1-act-3', 'en-unit-2-lesson-1', 3, 'ai_conversation', 'Đếm số với AI teacher:', '{"scenario":"Hãy đếm từ 1 đến 10 bằng tiếng Anh cùng AI teacher.","suggestedPhrases":["One, two, three...","How do you say 7?","Can you count with me?"]}'::jsonb),
  ('en-unit-2-lesson-2-act-1', 'en-unit-2-lesson-2', 1, 'multiple_choice', 'Chọn nghĩa đúng:', '{"question":"\"Blue\" có nghĩa là màu gì?","options":["Đỏ","Vàng","Xanh dương","Xanh lá"],"correctIndex":2}'::jsonb),
  ('en-unit-2-lesson-2-act-2', 'en-unit-2-lesson-2', 2, 'translation', 'Dịch sang tiếng Anh:', '{"sourceText":"Bầu trời màu xanh dương.","targetText":"The sky is blue.","acceptedVariants":["The sky is blue.","The sky is blue","the sky is blue"]}'::jsonb),
  ('en-unit-2-lesson-2-act-3', 'en-unit-2-lesson-2', 3, 'ai_conversation', 'Mô tả màu sắc với AI teacher:', '{"scenario":"Hãy mô tả màu sắc của các đồ vật xung quanh bạn bằng tiếng Anh.","suggestedPhrases":["The ... is red.","What color is ...?","My favorite color is ..."]}'::jsonb),
  ('ko-unit-1-lesson-1-act-1', 'ko-unit-1-lesson-1', 1, 'multiple_choice', 'Chọn nghĩa đúng:', '{"question":"\"감사합니다\" có nghĩa là gì?","options":["Xin chào","Tạm biệt","Cảm ơn","Xin lỗi"],"correctIndex":2}'::jsonb),
  ('ko-unit-1-lesson-1-act-2', 'ko-unit-1-lesson-1', 2, 'vocabulary_match', 'Nối từ tiếng Hàn với nghĩa tiếng Việt:', '{"pairs":[{"word":"안녕하세요","match":"Xin chào"},{"word":"감사합니다","match":"Cảm ơn"},{"word":"죄송합니다","match":"Xin lỗi"},{"word":"안녕","match":"Chào (thân mật)"}]}'::jsonb),
  ('ko-unit-1-lesson-1-act-3', 'ko-unit-1-lesson-1', 3, 'ai_conversation', 'Chào hỏi AI teacher bằng tiếng Hàn:', '{"scenario":"Hãy chào AI teacher và nói cảm ơn bằng tiếng Hàn.","suggestedPhrases":["안녕하세요!","감사합니다!","죄송합니다."]}'::jsonb),
  ('ko-unit-1-lesson-2-act-1', 'ko-unit-1-lesson-2', 1, 'multiple_choice', 'Chọn câu đúng:', '{"question":"Làm thế nào để nói \"Tôi là học sinh\" bằng tiếng Hàn?","options":["저는 선생님입니다.","저는 학생입니다.","이름이 뭐예요?","반갑습니다."],"correctIndex":1}'::jsonb),
  ('ko-unit-1-lesson-2-act-2', 'ko-unit-1-lesson-2', 2, 'translation', 'Dịch câu sau sang tiếng Hàn:', '{"sourceText":"Rất vui được gặp bạn!","targetText":"반갑습니다!","acceptedVariants":["반갑습니다!","반갑습니다","반가워요!","반가워요"]}'::jsonb),
  ('ko-unit-1-lesson-2-act-3', 'ko-unit-1-lesson-2', 3, 'ai_conversation', 'Tự giới thiệu với AI teacher bằng tiếng Hàn:', '{"scenario":"Hãy tự giới thiệu tên và quê quán của bạn bằng tiếng Hàn.","suggestedPhrases":["저는 ~입니다.","어디서 왔어요?","반갑습니다!"]}'::jsonb),
  ('ko-unit-2-lesson-1-act-1', 'ko-unit-2-lesson-1', 1, 'multiple_choice', 'Chọn đáp án đúng:', '{"question":"\"삼\" có nghĩa là số mấy?","options":["1","2","3","5"],"correctIndex":2}'::jsonb),
  ('ko-unit-2-lesson-1-act-2', 'ko-unit-2-lesson-1', 2, 'vocabulary_match', 'Nối số Hàn với số tương ứng:', '{"pairs":[{"word":"일","match":"1"},{"word":"이","match":"2"},{"word":"오","match":"5"},{"word":"십","match":"10"}]}'::jsonb),
  ('ko-unit-2-lesson-1-act-3', 'ko-unit-2-lesson-1', 3, 'ai_conversation', 'Đếm số với AI teacher bằng tiếng Hàn:', '{"scenario":"Hãy đếm từ 1 đến 10 bằng tiếng Hàn cùng AI teacher.","suggestedPhrases":["일, 이, 삼...","몇 번이에요?","같이 세어 볼까요?"]}'::jsonb),
  ('ko-unit-2-lesson-2-act-1', 'ko-unit-2-lesson-2', 1, 'multiple_choice', 'Chọn nghĩa đúng:', '{"question":"\"파란색\" có nghĩa là màu gì?","options":["Đỏ","Vàng","Xanh dương","Xanh lá"],"correctIndex":2}'::jsonb),
  ('ko-unit-2-lesson-2-act-2', 'ko-unit-2-lesson-2', 2, 'translation', 'Dịch sang tiếng Hàn:', '{"sourceText":"Bầu trời màu xanh dương.","targetText":"하늘은 파란색입니다.","acceptedVariants":["하늘은 파란색입니다.","하늘은 파란색입니다","하늘이 파란색이에요."]}'::jsonb),
  ('ko-unit-2-lesson-2-act-3', 'ko-unit-2-lesson-2', 3, 'ai_conversation', 'Mô tả màu sắc với AI teacher bằng tiếng Hàn:', '{"scenario":"Hãy mô tả màu sắc của các đồ vật xung quanh bạn bằng tiếng Hàn.","suggestedPhrases":["이것은 ~색입니다.","무슨 색이에요?","제가 좋아하는 색은 ~입니다."]}'::jsonb),
  ('fr-unit-1-lesson-1-act-1', 'fr-unit-1-lesson-1', 1, 'multiple_choice', 'Chọn nghĩa đúng:', '{"question":"\"Au revoir\" có nghĩa là gì?","options":["Xin chào","Cảm ơn","Tạm biệt","Xin lỗi"],"correctIndex":2}'::jsonb),
  ('fr-unit-1-lesson-1-act-2', 'fr-unit-1-lesson-1', 2, 'vocabulary_match', 'Nối từ tiếng Pháp với nghĩa tiếng Việt:', '{"pairs":[{"word":"Bonjour","match":"Xin chào"},{"word":"Bonsoir","match":"Chào buổi tối"},{"word":"Au revoir","match":"Tạm biệt"},{"word":"Merci","match":"Cảm ơn"}]}'::jsonb),
  ('fr-unit-1-lesson-1-act-3', 'fr-unit-1-lesson-1', 3, 'ai_conversation', 'Chào hỏi AI teacher bằng tiếng Pháp:', '{"scenario":"Hãy chào AI teacher bằng tiếng Pháp và nói cảm ơn.","suggestedPhrases":["Bonjour!","Merci beaucoup!","Au revoir!"]}'::jsonb),
  ('fr-unit-1-lesson-2-act-1', 'fr-unit-1-lesson-2', 1, 'multiple_choice', 'Chọn câu đúng:', '{"question":"Làm thế nào để nói \"Tôi tên là Nam\" bằng tiếng Pháp?","options":["Je viens de Nam.","Enchanté, Nam.","Je m''appelle Nam.","Comment allez-vous, Nam?"],"correctIndex":2}'::jsonb),
  ('fr-unit-1-lesson-2-act-2', 'fr-unit-1-lesson-2', 2, 'translation', 'Dịch sang tiếng Pháp:', '{"sourceText":"Rất vui được gặp bạn!","targetText":"Enchanté!","acceptedVariants":["Enchanté!","Enchanté","Enchantée!","Enchantée"]}'::jsonb),
  ('fr-unit-1-lesson-2-act-3', 'fr-unit-1-lesson-2', 3, 'ai_conversation', 'Tự giới thiệu với AI teacher bằng tiếng Pháp:', '{"scenario":"Hãy tự giới thiệu tên và quê quán của bạn bằng tiếng Pháp.","suggestedPhrases":["Je m''appelle...","Je viens de...","Enchanté!"]}'::jsonb),
  ('fr-unit-2-lesson-1-act-1', 'fr-unit-2-lesson-1', 1, 'multiple_choice', 'Chọn đáp án đúng:', '{"question":"\"Trois\" có nghĩa là số mấy?","options":["1","2","3","5"],"correctIndex":2}'::jsonb),
  ('fr-unit-2-lesson-1-act-2', 'fr-unit-2-lesson-1', 2, 'vocabulary_match', 'Nối số tiếng Pháp với số tương ứng:', '{"pairs":[{"word":"Un","match":"1"},{"word":"Deux","match":"2"},{"word":"Cinq","match":"5"},{"word":"Dix","match":"10"}]}'::jsonb),
  ('fr-unit-2-lesson-1-act-3', 'fr-unit-2-lesson-1', 3, 'ai_conversation', 'Đếm số với AI teacher bằng tiếng Pháp:', '{"scenario":"Hãy đếm từ 1 đến 10 bằng tiếng Pháp cùng AI teacher.","suggestedPhrases":["Un, deux, trois...","Comment dit-on 7?","Comptons ensemble!"]}'::jsonb),
  ('fr-unit-2-lesson-2-act-1', 'fr-unit-2-lesson-2', 1, 'multiple_choice', 'Chọn nghĩa đúng:', '{"question":"\"Bleu\" có nghĩa là màu gì?","options":["Đỏ","Vàng","Xanh dương","Xanh lá"],"correctIndex":2}'::jsonb),
  ('fr-unit-2-lesson-2-act-2', 'fr-unit-2-lesson-2', 2, 'translation', 'Dịch sang tiếng Pháp:', '{"sourceText":"Bầu trời màu xanh dương.","targetText":"Le ciel est bleu.","acceptedVariants":["Le ciel est bleu.","Le ciel est bleu","le ciel est bleu"]}'::jsonb),
  ('fr-unit-2-lesson-2-act-3', 'fr-unit-2-lesson-2', 3, 'ai_conversation', 'Mô tả màu sắc với AI teacher bằng tiếng Pháp:', '{"scenario":"Hãy mô tả màu sắc của các đồ vật xung quanh bạn bằng tiếng Pháp.","suggestedPhrases":["C''est... rouge.","De quelle couleur est...?","Ma couleur préférée est..."]}'::jsonb),
  ('es-unit-1-lesson-1-act-1', 'es-unit-1-lesson-1', 1, 'multiple_choice', 'Chọn nghĩa đúng:', '{"question":"\"Adiós\" có nghĩa là gì?","options":["Xin chào","Cảm ơn","Tạm biệt","Xin lỗi"],"correctIndex":2}'::jsonb),
  ('es-unit-1-lesson-1-act-2', 'es-unit-1-lesson-1', 2, 'vocabulary_match', 'Nối từ tiếng Tây Ban Nha với nghĩa tiếng Việt:', '{"pairs":[{"word":"Hola","match":"Xin chào"},{"word":"Buenos días","match":"Chào buổi sáng"},{"word":"Adiós","match":"Tạm biệt"},{"word":"Gracias","match":"Cảm ơn"}]}'::jsonb),
  ('es-unit-1-lesson-1-act-3', 'es-unit-1-lesson-1', 3, 'ai_conversation', 'Chào hỏi AI teacher bằng tiếng Tây Ban Nha:', '{"scenario":"Hãy chào AI teacher và nói cảm ơn bằng tiếng Tây Ban Nha.","suggestedPhrases":["¡Hola!","¡Gracias!","¡Adiós!"]}'::jsonb),
  ('es-unit-1-lesson-2-act-1', 'es-unit-1-lesson-2', 1, 'multiple_choice', 'Chọn câu đúng:', '{"question":"Làm thế nào để nói \"Tôi tên là Nam\" bằng tiếng Tây Ban Nha?","options":["Soy de Nam.","Me llamo Nam.","Mucho gusto, Nam.","¿Cómo estás, Nam?"],"correctIndex":1}'::jsonb),
  ('es-unit-1-lesson-2-act-2', 'es-unit-1-lesson-2', 2, 'translation', 'Dịch sang tiếng Tây Ban Nha:', '{"sourceText":"Rất vui được gặp bạn!","targetText":"¡Mucho gusto!","acceptedVariants":["¡Mucho gusto!","Mucho gusto!","Mucho gusto","¡Mucho gusto"]}'::jsonb),
  ('es-unit-1-lesson-2-act-3', 'es-unit-1-lesson-2', 3, 'ai_conversation', 'Tự giới thiệu với AI teacher bằng tiếng Tây Ban Nha:', '{"scenario":"Hãy tự giới thiệu tên và quê quán của bạn bằng tiếng Tây Ban Nha.","suggestedPhrases":["Me llamo...","Soy de...","¡Mucho gusto!"]}'::jsonb),
  ('es-unit-2-lesson-1-act-1', 'es-unit-2-lesson-1', 1, 'multiple_choice', 'Chọn đáp án đúng:', '{"question":"\"Tres\" có nghĩa là số mấy?","options":["1","2","3","5"],"correctIndex":2}'::jsonb),
  ('es-unit-2-lesson-1-act-2', 'es-unit-2-lesson-1', 2, 'vocabulary_match', 'Nối số tiếng Tây Ban Nha với số tương ứng:', '{"pairs":[{"word":"Uno","match":"1"},{"word":"Dos","match":"2"},{"word":"Cinco","match":"5"},{"word":"Diez","match":"10"}]}'::jsonb),
  ('es-unit-2-lesson-1-act-3', 'es-unit-2-lesson-1', 3, 'ai_conversation', 'Đếm số với AI teacher bằng tiếng Tây Ban Nha:', '{"scenario":"Hãy đếm từ 1 đến 10 bằng tiếng Tây Ban Nha cùng AI teacher.","suggestedPhrases":["Uno, dos, tres...","¿Cómo se dice 7?","¡Contemos juntos!"]}'::jsonb),
  ('es-unit-2-lesson-2-act-1', 'es-unit-2-lesson-2', 1, 'multiple_choice', 'Chọn nghĩa đúng:', '{"question":"\"Azul\" có nghĩa là màu gì?","options":["Đỏ","Vàng","Xanh dương","Xanh lá"],"correctIndex":2}'::jsonb),
  ('es-unit-2-lesson-2-act-2', 'es-unit-2-lesson-2', 2, 'translation', 'Dịch sang tiếng Tây Ban Nha:', '{"sourceText":"Bầu trời màu xanh dương.","targetText":"El cielo es azul.","acceptedVariants":["El cielo es azul.","El cielo es azul","el cielo es azul"]}'::jsonb),
  ('es-unit-2-lesson-2-act-3', 'es-unit-2-lesson-2', 3, 'ai_conversation', 'Mô tả màu sắc với AI teacher bằng tiếng Tây Ban Nha:', '{"scenario":"Hãy mô tả màu sắc của các đồ vật xung quanh bạn bằng tiếng Tây Ban Nha.","suggestedPhrases":["Es... rojo.","¿De qué color es...?","Mi color favorito es..."]}'::jsonb)
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
