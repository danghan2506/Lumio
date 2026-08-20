-- Migration: 20260819000000_english_only_content.sql
-- Description: Convert all Vietnamese content to English across languages, units,
-- lessons, vocabularies, and activities. learner_language switches from 'vi' to 'en',
-- meaning the app now targets English speakers learning a second language.
-- The English (en) course uses short English definitions/glosses for its vocabulary
-- so the course remains coherent for English speakers.

-- ─── 1. Languages ─────────────────────────────────────────────────────────────

UPDATE public.languages SET learner_language = 'en';

-- ─── 2. Units ─────────────────────────────────────────────────────────────────

UPDATE public.units SET description = 'Learn how to greet people and introduce yourself in English' WHERE id = 'en-unit-1';
UPDATE public.units SET description = 'Learn to count numbers and name colors in English' WHERE id = 'en-unit-2';
UPDATE public.units SET description = 'Learn how to greet people and introduce yourself in Korean' WHERE id = 'ko-unit-1';
UPDATE public.units SET description = 'Learn to count numbers and name colors in Korean' WHERE id = 'ko-unit-2';
UPDATE public.units SET description = 'Learn how to greet people and introduce yourself in French' WHERE id = 'fr-unit-1';
UPDATE public.units SET description = 'Learn to count numbers and name colors in French' WHERE id = 'fr-unit-2';
UPDATE public.units SET description = 'Learn how to greet people and introduce yourself in Spanish' WHERE id = 'es-unit-1';
UPDATE public.units SET description = 'Learn to count numbers and name colors in Spanish' WHERE id = 'es-unit-2';

-- ─── 3. Lesson titles (Korean lessons had Vietnamese glosses) ─────────────────

UPDATE public.lessons SET title = '안녕하세요 (Hello)' WHERE id = 'ko-unit-1-lesson-1';
UPDATE public.lessons SET title = '자기소개 (Self-introduction)' WHERE id = 'ko-unit-1-lesson-2';
UPDATE public.lessons SET title = '숫자 (Numbers)' WHERE id = 'ko-unit-2-lesson-1';
UPDATE public.lessons SET title = '색깔 (Colors)' WHERE id = 'ko-unit-2-lesson-2';

-- ─── 4. Vocabularies ──────────────────────────────────────────────────────────

-- English course: definitions/glosses in English
UPDATE public.vocabularies SET translation = 'A friendly greeting used when meeting someone', example_translation = 'Hello, my name is Lumi.' WHERE id = 'en-vocab-hello';
UPDATE public.vocabularies SET translation = 'A word said when leaving or ending a conversation', example_translation = 'Goodbye, see you tomorrow!' WHERE id = 'en-vocab-goodbye';
UPDATE public.vocabularies SET translation = 'A greeting used in the morning', example_translation = 'Good morning! How are you?' WHERE id = 'en-vocab-good-morning';
UPDATE public.vocabularies SET translation = 'A phrase said before going to sleep', example_translation = 'Good night, sweet dreams.' WHERE id = 'en-vocab-good-night';
UPDATE public.vocabularies SET translation = 'A phrase used to introduce yourself', example_translation = 'My name is Anna.' WHERE id = 'en-vocab-my-name-is';
UPDATE public.vocabularies SET translation = 'A phrase used to say where you come from', example_translation = 'I am from Vietnam.' WHERE id = 'en-vocab-i-am-from';
UPDATE public.vocabularies SET translation = 'A polite phrase said when meeting someone for the first time', example_translation = 'Nice to meet you, Tom!' WHERE id = 'en-vocab-nice-to-meet-you';
UPDATE public.vocabularies SET translation = 'A question asking about someone''s well-being', example_translation = 'Hello! How are you?' WHERE id = 'en-vocab-how-are-you';
UPDATE public.vocabularies SET translation = 'A reply meaning you are doing well', example_translation = 'I am fine, thank you!' WHERE id = 'en-vocab-i-am-fine';
UPDATE public.vocabularies SET translation = 'The number 1', example_translation = 'I have one cat.' WHERE id = 'en-vocab-one';
UPDATE public.vocabularies SET translation = 'The number 2', example_translation = 'She has two sisters.' WHERE id = 'en-vocab-two';
UPDATE public.vocabularies SET translation = 'The number 3', example_translation = 'There are three books.' WHERE id = 'en-vocab-three';
UPDATE public.vocabularies SET translation = 'The number 5', example_translation = 'I am five years old.' WHERE id = 'en-vocab-five';
UPDATE public.vocabularies SET translation = 'The number 10', example_translation = 'Count to ten.' WHERE id = 'en-vocab-ten';
UPDATE public.vocabularies SET translation = 'The color of a ripe apple', example_translation = 'The apple is red.' WHERE id = 'en-vocab-red';
UPDATE public.vocabularies SET translation = 'The color of the clear sky', example_translation = 'The sky is blue.' WHERE id = 'en-vocab-blue';
UPDATE public.vocabularies SET translation = 'The color of grass and leaves', example_translation = 'The tree is green.' WHERE id = 'en-vocab-green';
UPDATE public.vocabularies SET translation = 'The color of the sun', example_translation = 'The sun is yellow.' WHERE id = 'en-vocab-yellow';

-- Korean course
UPDATE public.vocabularies SET translation = 'Hello (formal)', example_translation = 'Hello! Nice to meet you.' WHERE id = 'ko-vocab-hello';
UPDATE public.vocabularies SET translation = 'Hi (informal)', example_translation = 'Hi! How are you?' WHERE id = 'ko-vocab-hello-casual';
UPDATE public.vocabularies SET translation = 'Thank you', example_translation = 'Thank you for your help.' WHERE id = 'ko-vocab-thank-you';
UPDATE public.vocabularies SET translation = 'Sorry', example_translation = 'Sorry for being late.' WHERE id = 'ko-vocab-sorry';
UPDATE public.vocabularies SET translation = 'I am ~', example_translation = 'I am a student.' WHERE id = 'ko-vocab-my-name-is';
UPDATE public.vocabularies SET translation = 'What''s your name?', example_translation = 'What''s your name? I am Lumi.' WHERE id = 'ko-vocab-what-is-your-name';
UPDATE public.vocabularies SET translation = 'Nice to meet you', example_translation = 'Nice to meet you for the first time!' WHERE id = 'ko-vocab-nice-to-meet-you';
UPDATE public.vocabularies SET translation = 'Where are you from?', example_translation = 'Where are you from? I''m from Vietnam.' WHERE id = 'ko-vocab-where-are-you-from';
UPDATE public.vocabularies SET translation = 'One', example_translation = 'One plus one equals two.' WHERE id = 'ko-vocab-one';
UPDATE public.vocabularies SET translation = 'Two', example_translation = 'There are two apples.' WHERE id = 'ko-vocab-two';
UPDATE public.vocabularies SET translation = 'Three', example_translation = 'I studied for three days.' WHERE id = 'ko-vocab-three';
UPDATE public.vocabularies SET translation = 'Five', example_translation = 'Please wait five minutes.' WHERE id = 'ko-vocab-five';
UPDATE public.vocabularies SET translation = 'Ten', example_translation = 'Ten people came.' WHERE id = 'ko-vocab-ten';
UPDATE public.vocabularies SET translation = 'Red', example_translation = 'The apple is red.' WHERE id = 'ko-vocab-red';
UPDATE public.vocabularies SET translation = 'Blue', example_translation = 'The sky is blue.' WHERE id = 'ko-vocab-blue';
UPDATE public.vocabularies SET translation = 'Green', example_translation = 'The leaves are green.' WHERE id = 'ko-vocab-green';
UPDATE public.vocabularies SET translation = 'Yellow', example_translation = 'The banana is yellow.' WHERE id = 'ko-vocab-yellow';

-- French course
UPDATE public.vocabularies SET translation = 'Hello / Good morning', example_translation = 'Hello, what''s your name?' WHERE id = 'fr-vocab-bonjour';
UPDATE public.vocabularies SET translation = 'Good evening', example_translation = 'Good evening! Did you have a good day?' WHERE id = 'fr-vocab-bonsoir';
UPDATE public.vocabularies SET translation = 'Goodbye', example_translation = 'Goodbye, see you tomorrow!' WHERE id = 'fr-vocab-au-revoir';
UPDATE public.vocabularies SET translation = 'Thank you', example_translation = 'Thank you very much!' WHERE id = 'fr-vocab-merci';
UPDATE public.vocabularies SET translation = 'My name is', example_translation = 'My name is Marie.' WHERE id = 'fr-vocab-je-mappelle';
UPDATE public.vocabularies SET translation = 'I come from', example_translation = 'I come from Vietnam.' WHERE id = 'fr-vocab-je-viens-de';
UPDATE public.vocabularies SET translation = 'Nice to meet you', example_translation = 'Hello! Nice to meet you!' WHERE id = 'fr-vocab-enchante';
UPDATE public.vocabularies SET translation = 'How are you?', example_translation = 'Hello! How are you?' WHERE id = 'fr-vocab-comment-allez-vous';
UPDATE public.vocabularies SET translation = 'One', example_translation = 'I have a cat.' WHERE id = 'fr-vocab-un';
UPDATE public.vocabularies SET translation = 'Two', example_translation = 'He has two brothers.' WHERE id = 'fr-vocab-deux';
UPDATE public.vocabularies SET translation = 'Three', example_translation = 'There are three books.' WHERE id = 'fr-vocab-trois';
UPDATE public.vocabularies SET translation = 'Five', example_translation = 'I am five years old.' WHERE id = 'fr-vocab-cinq';
UPDATE public.vocabularies SET translation = 'Ten', example_translation = 'Count to ten.' WHERE id = 'fr-vocab-dix';
UPDATE public.vocabularies SET translation = 'Red', example_translation = 'The apple is red.' WHERE id = 'fr-vocab-rouge';
UPDATE public.vocabularies SET translation = 'Blue', example_translation = 'The sky is blue.' WHERE id = 'fr-vocab-bleu';
UPDATE public.vocabularies SET translation = 'Green', example_translation = 'The tree is green.' WHERE id = 'fr-vocab-vert';
UPDATE public.vocabularies SET translation = 'Yellow', example_translation = 'The sun is yellow.' WHERE id = 'fr-vocab-jaune';

-- Spanish course
UPDATE public.vocabularies SET translation = 'Hello', example_translation = 'Hello! What''s your name?' WHERE id = 'es-vocab-hola';
UPDATE public.vocabularies SET translation = 'Good morning', example_translation = 'Good morning! How are you?' WHERE id = 'es-vocab-buenos-dias';
UPDATE public.vocabularies SET translation = 'Goodbye', example_translation = 'Goodbye! See you tomorrow!' WHERE id = 'es-vocab-adios';
UPDATE public.vocabularies SET translation = 'Thank you', example_translation = 'Thank you very much!' WHERE id = 'es-vocab-gracias';
UPDATE public.vocabularies SET translation = 'My name is', example_translation = 'My name is Carlos.' WHERE id = 'es-vocab-me-llamo';
UPDATE public.vocabularies SET translation = 'I am from', example_translation = 'I am from Vietnam.' WHERE id = 'es-vocab-soy-de';
UPDATE public.vocabularies SET translation = 'Nice to meet you', example_translation = 'Hello! Nice to meet you!' WHERE id = 'es-vocab-mucho-gusto';
UPDATE public.vocabularies SET translation = 'How are you?', example_translation = 'Hello! How are you?' WHERE id = 'es-vocab-como-estas';
UPDATE public.vocabularies SET translation = 'One', example_translation = 'I have a cat.' WHERE id = 'es-vocab-uno';
UPDATE public.vocabularies SET translation = 'Two', example_translation = 'She has two sisters.' WHERE id = 'es-vocab-dos';
UPDATE public.vocabularies SET translation = 'Three', example_translation = 'There are three books.' WHERE id = 'es-vocab-tres';
UPDATE public.vocabularies SET translation = 'Five', example_translation = 'I am five years old.' WHERE id = 'es-vocab-cinco';
UPDATE public.vocabularies SET translation = 'Ten', example_translation = 'Count to ten.' WHERE id = 'es-vocab-diez';
UPDATE public.vocabularies SET translation = 'Red', example_translation = 'The apple is red.' WHERE id = 'es-vocab-rojo';
UPDATE public.vocabularies SET translation = 'Blue', example_translation = 'The sky is blue.' WHERE id = 'es-vocab-azul';
UPDATE public.vocabularies SET translation = 'Green', example_translation = 'The tree is green.' WHERE id = 'es-vocab-verde';
UPDATE public.vocabularies SET translation = 'Yellow', example_translation = 'The sun is yellow.' WHERE id = 'es-vocab-amarillo';

-- ─── 5. Activities ────────────────────────────────────────────────────────────

-- English course
UPDATE public.activities
SET instruction = 'Choose the correct meaning of the following word:',
    data = '{"question":"What does \"Hello\" mean?","options":["Goodbye","Hello","Thank you","Sorry"],"correctIndex":1}'::jsonb
WHERE id = 'en-unit-1-lesson-1-act-1';

UPDATE public.activities
SET instruction = 'Match the English word with its meaning:',
    data = '{"pairs":[{"word":"Hello","match":"A greeting used when meeting someone"},{"word":"Goodbye","match":"A word said when leaving"},{"word":"Good morning","match":"A greeting used in the morning"},{"word":"Good night","match":"A phrase said before sleeping"}]}'::jsonb
WHERE id = 'en-unit-1-lesson-1-act-2';

UPDATE public.activities
SET instruction = 'Practice greetings with AI teacher Lumi:',
    data = '{"scenario":"Greet the AI teacher and introduce your name in English.","suggestedPhrases":["Hello!","My name is...","Nice to meet you!"]}'::jsonb
WHERE id = 'en-unit-1-lesson-1-act-3';

UPDATE public.activities
SET instruction = 'Choose the correct sentence to introduce yourself:',
    data = '{"question":"How do you say \"My name is Nam\" in English?","options":["I am from Nam.","My name is Nam.","Nice to meet Nam.","How are you Nam?"],"correctIndex":1}'::jsonb
WHERE id = 'en-unit-1-lesson-2-act-1';

UPDATE public.activities
SET instruction = 'Translate the following sentence into English:',
    data = '{"sourceText":"Nice to meet you!","targetText":"Nice to meet you!","acceptedVariants":["Nice to meet you!","Nice to meet you","nice to meet you"]}'::jsonb
WHERE id = 'en-unit-1-lesson-2-act-2';

UPDATE public.activities
SET instruction = 'Introduce yourself to the AI teacher in English:',
    data = '{"scenario":"Introduce your name, where you''re from, and ask how the AI teacher is doing.","suggestedPhrases":["My name is...","I am from...","Nice to meet you!","How are you?"]}'::jsonb
WHERE id = 'en-unit-1-lesson-2-act-3';

UPDATE public.activities
SET instruction = 'Choose the correct number:',
    data = '{"question":"What number does \"Three\" mean?","options":["1","2","3","5"],"correctIndex":2}'::jsonb
WHERE id = 'en-unit-2-lesson-1-act-1';

UPDATE public.activities
SET instruction = 'Match the English number with the corresponding number:',
    data = '{"pairs":[{"word":"One","match":"1"},{"word":"Two","match":"2"},{"word":"Five","match":"5"},{"word":"Ten","match":"10"}]}'::jsonb
WHERE id = 'en-unit-2-lesson-1-act-2';

UPDATE public.activities
SET instruction = 'Count numbers with the AI teacher:',
    data = '{"scenario":"Count from 1 to 10 in English with the AI teacher.","suggestedPhrases":["One, two, three...","How do you say 7?","Can you count with me?"]}'::jsonb
WHERE id = 'en-unit-2-lesson-1-act-3';

UPDATE public.activities
SET instruction = 'Choose the correct meaning:',
    data = '{"question":"What does \"Blue\" mean?","options":["Red","Yellow","Blue","Green"],"correctIndex":2}'::jsonb
WHERE id = 'en-unit-2-lesson-2-act-1';

UPDATE public.activities
SET instruction = 'Translate into English:',
    data = '{"sourceText":"The sky is blue.","targetText":"The sky is blue.","acceptedVariants":["The sky is blue.","The sky is blue","the sky is blue"]}'::jsonb
WHERE id = 'en-unit-2-lesson-2-act-2';

UPDATE public.activities
SET instruction = 'Describe colors with the AI teacher:',
    data = '{"scenario":"Describe the colors of the objects around you in English.","suggestedPhrases":["The ... is red.","What color is ...?","My favorite color is ..."]}'::jsonb
WHERE id = 'en-unit-2-lesson-2-act-3';

-- Korean course
UPDATE public.activities
SET instruction = 'Choose the correct meaning:',
    data = '{"question":"What does \"감사합니다\" mean?","options":["Hello","Goodbye","Thank you","Sorry"],"correctIndex":2}'::jsonb
WHERE id = 'ko-unit-1-lesson-1-act-1';

UPDATE public.activities
SET instruction = 'Match the Korean word with its meaning:',
    data = '{"pairs":[{"word":"안녕하세요","match":"Hello"},{"word":"감사합니다","match":"Thank you"},{"word":"죄송합니다","match":"Sorry"},{"word":"안녕","match":"Hi (informal)"}]}'::jsonb
WHERE id = 'ko-unit-1-lesson-1-act-2';

UPDATE public.activities
SET instruction = 'Greet the AI teacher in Korean:',
    data = '{"scenario":"Greet the AI teacher and say thank you in Korean.","suggestedPhrases":["안녕하세요!","감사합니다!","죄송합니다."]}'::jsonb
WHERE id = 'ko-unit-1-lesson-1-act-3';

UPDATE public.activities
SET instruction = 'Choose the correct sentence:',
    data = '{"question":"How do you say \"I am a student\" in Korean?","options":["저는 선생님입니다.","저는 학생입니다.","이름이 뭐예요?","반갑습니다."],"correctIndex":1}'::jsonb
WHERE id = 'ko-unit-1-lesson-2-act-1';

UPDATE public.activities
SET instruction = 'Translate the following sentence into Korean:',
    data = '{"sourceText":"Nice to meet you!","targetText":"반갑습니다!","acceptedVariants":["반갑습니다!","반갑습니다","반가워요!","반가워요"]}'::jsonb
WHERE id = 'ko-unit-1-lesson-2-act-2';

UPDATE public.activities
SET instruction = 'Introduce yourself to the AI teacher in Korean:',
    data = '{"scenario":"Introduce your name and where you''re from in Korean.","suggestedPhrases":["저는 ~입니다.","어디서 왔어요?","반갑습니다!"]}'::jsonb
WHERE id = 'ko-unit-1-lesson-2-act-3';

UPDATE public.activities
SET instruction = 'Choose the correct answer:',
    data = '{"question":"What number does \"삼\" mean?","options":["1","2","3","5"],"correctIndex":2}'::jsonb
WHERE id = 'ko-unit-2-lesson-1-act-1';

UPDATE public.activities
SET instruction = 'Match the Korean number with the corresponding number:',
    data = '{"pairs":[{"word":"일","match":"1"},{"word":"이","match":"2"},{"word":"오","match":"5"},{"word":"십","match":"10"}]}'::jsonb
WHERE id = 'ko-unit-2-lesson-1-act-2';

UPDATE public.activities
SET instruction = 'Count numbers with the AI teacher in Korean:',
    data = '{"scenario":"Count from 1 to 10 in Korean with the AI teacher.","suggestedPhrases":["일, 이, 삼...","몇 번이에요?","같이 세어 볼까요?"]}'::jsonb
WHERE id = 'ko-unit-2-lesson-1-act-3';

UPDATE public.activities
SET instruction = 'Choose the correct meaning:',
    data = '{"question":"What does \"파란색\" mean?","options":["Red","Yellow","Blue","Green"],"correctIndex":2}'::jsonb
WHERE id = 'ko-unit-2-lesson-2-act-1';

UPDATE public.activities
SET instruction = 'Translate into Korean:',
    data = '{"sourceText":"The sky is blue.","targetText":"하늘은 파란색입니다.","acceptedVariants":["하늘은 파란색입니다.","하늘은 파란색입니다","하늘이 파란색이에요."]}'::jsonb
WHERE id = 'ko-unit-2-lesson-2-act-2';

UPDATE public.activities
SET instruction = 'Describe colors with the AI teacher in Korean:',
    data = '{"scenario":"Describe the colors of the objects around you in Korean.","suggestedPhrases":["이것은 ~색입니다.","무슨 색이에요?","제가 좋아하는 색은 ~입니다."]}'::jsonb
WHERE id = 'ko-unit-2-lesson-2-act-3';

-- French course
UPDATE public.activities
SET instruction = 'Choose the correct meaning:',
    data = '{"question":"What does \"Au revoir\" mean?","options":["Hello","Thank you","Goodbye","Sorry"],"correctIndex":2}'::jsonb
WHERE id = 'fr-unit-1-lesson-1-act-1';

UPDATE public.activities
SET instruction = 'Match the French word with its meaning:',
    data = '{"pairs":[{"word":"Bonjour","match":"Hello"},{"word":"Bonsoir","match":"Good evening"},{"word":"Au revoir","match":"Goodbye"},{"word":"Merci","match":"Thank you"}]}'::jsonb
WHERE id = 'fr-unit-1-lesson-1-act-2';

UPDATE public.activities
SET instruction = 'Greet the AI teacher in French:',
    data = '{"scenario":"Greet the AI teacher in French and say thank you.","suggestedPhrases":["Bonjour!","Merci beaucoup!","Au revoir!"]}'::jsonb
WHERE id = 'fr-unit-1-lesson-1-act-3';

UPDATE public.activities
SET instruction = 'Choose the correct sentence:',
    data = '{"question":"How do you say \"My name is Nam\" in French?","options":["Je viens de Nam.","Enchanté, Nam.","Je m''appelle Nam.","Comment allez-vous, Nam?"],"correctIndex":2}'::jsonb
WHERE id = 'fr-unit-1-lesson-2-act-1';

UPDATE public.activities
SET instruction = 'Translate into French:',
    data = '{"sourceText":"Nice to meet you!","targetText":"Enchanté!","acceptedVariants":["Enchanté!","Enchanté","Enchantée!","Enchantée"]}'::jsonb
WHERE id = 'fr-unit-1-lesson-2-act-2';

UPDATE public.activities
SET instruction = 'Introduce yourself to the AI teacher in French:',
    data = '{"scenario":"Introduce your name and where you''re from in French.","suggestedPhrases":["Je m''appelle...","Je viens de...","Enchanté!"]}'::jsonb
WHERE id = 'fr-unit-1-lesson-2-act-3';

UPDATE public.activities
SET instruction = 'Choose the correct answer:',
    data = '{"question":"What number does \"Trois\" mean?","options":["1","2","3","5"],"correctIndex":2}'::jsonb
WHERE id = 'fr-unit-2-lesson-1-act-1';

UPDATE public.activities
SET instruction = 'Match the French number with the corresponding number:',
    data = '{"pairs":[{"word":"Un","match":"1"},{"word":"Deux","match":"2"},{"word":"Cinq","match":"5"},{"word":"Dix","match":"10"}]}'::jsonb
WHERE id = 'fr-unit-2-lesson-1-act-2';

UPDATE public.activities
SET instruction = 'Count numbers with the AI teacher in French:',
    data = '{"scenario":"Count from 1 to 10 in French with the AI teacher.","suggestedPhrases":["Un, deux, trois...","Comment dit-on 7?","Comptons ensemble!"]}'::jsonb
WHERE id = 'fr-unit-2-lesson-1-act-3';

UPDATE public.activities
SET instruction = 'Choose the correct meaning:',
    data = '{"question":"What does \"Bleu\" mean?","options":["Red","Yellow","Blue","Green"],"correctIndex":2}'::jsonb
WHERE id = 'fr-unit-2-lesson-2-act-1';

UPDATE public.activities
SET instruction = 'Translate into French:',
    data = '{"sourceText":"The sky is blue.","targetText":"Le ciel est bleu.","acceptedVariants":["Le ciel est bleu.","Le ciel est bleu","le ciel est bleu"]}'::jsonb
WHERE id = 'fr-unit-2-lesson-2-act-2';

UPDATE public.activities
SET instruction = 'Describe colors with the AI teacher in French:',
    data = '{"scenario":"Describe the colors of the objects around you in French.","suggestedPhrases":["C''est... rouge.","De quelle couleur est...?","Ma couleur préférée est..."]}'::jsonb
WHERE id = 'fr-unit-2-lesson-2-act-3';

-- Spanish course
UPDATE public.activities
SET instruction = 'Choose the correct meaning:',
    data = '{"question":"What does \"Adiós\" mean?","options":["Hello","Thank you","Goodbye","Sorry"],"correctIndex":2}'::jsonb
WHERE id = 'es-unit-1-lesson-1-act-1';

UPDATE public.activities
SET instruction = 'Match the Spanish word with its meaning:',
    data = '{"pairs":[{"word":"Hola","match":"Hello"},{"word":"Buenos días","match":"Good morning"},{"word":"Adiós","match":"Goodbye"},{"word":"Gracias","match":"Thank you"}]}'::jsonb
WHERE id = 'es-unit-1-lesson-1-act-2';

UPDATE public.activities
SET instruction = 'Greet the AI teacher in Spanish:',
    data = '{"scenario":"Greet the AI teacher and say thank you in Spanish.","suggestedPhrases":["¡Hola!","¡Gracias!","¡Adiós!"]}'::jsonb
WHERE id = 'es-unit-1-lesson-1-act-3';

UPDATE public.activities
SET instruction = 'Choose the correct sentence:',
    data = '{"question":"How do you say \"My name is Nam\" in Spanish?","options":["Soy de Nam.","Me llamo Nam.","Mucho gusto, Nam.","¿Cómo estás, Nam?"],"correctIndex":1}'::jsonb
WHERE id = 'es-unit-1-lesson-2-act-1';

UPDATE public.activities
SET instruction = 'Translate into Spanish:',
    data = '{"sourceText":"Nice to meet you!","targetText":"¡Mucho gusto!","acceptedVariants":["¡Mucho gusto!","Mucho gusto!","Mucho gusto","¡Mucho gusto"]}'::jsonb
WHERE id = 'es-unit-1-lesson-2-act-2';

UPDATE public.activities
SET instruction = 'Introduce yourself to the AI teacher in Spanish:',
    data = '{"scenario":"Introduce your name and where you''re from in Spanish.","suggestedPhrases":["Me llamo...","Soy de...","¡Mucho gusto!"]}'::jsonb
WHERE id = 'es-unit-1-lesson-2-act-3';

UPDATE public.activities
SET instruction = 'Choose the correct answer:',
    data = '{"question":"What number does \"Tres\" mean?","options":["1","2","3","5"],"correctIndex":2}'::jsonb
WHERE id = 'es-unit-2-lesson-1-act-1';

UPDATE public.activities
SET instruction = 'Match the Spanish number with the corresponding number:',
    data = '{"pairs":[{"word":"Uno","match":"1"},{"word":"Dos","match":"2"},{"word":"Cinco","match":"5"},{"word":"Diez","match":"10"}]}'::jsonb
WHERE id = 'es-unit-2-lesson-1-act-2';

UPDATE public.activities
SET instruction = 'Count numbers with the AI teacher in Spanish:',
    data = '{"scenario":"Count from 1 to 10 in Spanish with the AI teacher.","suggestedPhrases":["Uno, dos, tres...","¿Cómo se dice 7?","¡Contemos juntos!"]}'::jsonb
WHERE id = 'es-unit-2-lesson-1-act-3';

UPDATE public.activities
SET instruction = 'Choose the correct meaning:',
    data = '{"question":"What does \"Azul\" mean?","options":["Red","Yellow","Blue","Green"],"correctIndex":2}'::jsonb
WHERE id = 'es-unit-2-lesson-2-act-1';

UPDATE public.activities
SET instruction = 'Translate into Spanish:',
    data = '{"sourceText":"The sky is blue.","targetText":"El cielo es azul.","acceptedVariants":["El cielo es azul.","El cielo es azul","el cielo es azul"]}'::jsonb
WHERE id = 'es-unit-2-lesson-2-act-2';

UPDATE public.activities
SET instruction = 'Describe colors with the AI teacher in Spanish:',
    data = '{"scenario":"Describe the colors of the objects around you in Spanish.","suggestedPhrases":["Es... rojo.","¿De qué color es...?","Mi color favorito es..."]}'::jsonb
WHERE id = 'es-unit-2-lesson-2-act-3';