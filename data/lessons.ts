import type {
  Lesson,
  MultipleChoiceActivity,
  VocabularyMatchActivity,
  TranslationActivity,
  AiConversationActivity,
} from '@/types/learning';

export const lessons: Lesson[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // ENGLISH
  // ═══════════════════════════════════════════════════════════════════════

  // ── en-unit-1 / lesson-1 ───────────────────────────────────────────────
  {
    id: 'en-unit-1-lesson-1',
    unitId: 'en-unit-1',
    order: 1,
    title: 'Hello & Goodbye',
    xpReward: 10,
    estimatedMinutes: 5,
    vocabulary: [
      {
        word: 'Hello',
        translation: 'Xin chào',
        pronunciation: '/həˈloʊ/',
        exampleSentence: 'Hello, my name is Lumi.',
        exampleTranslation: 'Xin chào, tôi tên là Lumi.',
      },
      {
        word: 'Goodbye',
        translation: 'Tạm biệt',
        pronunciation: '/ˌɡʊdˈbaɪ/',
        exampleSentence: 'Goodbye, see you tomorrow!',
        exampleTranslation: 'Tạm biệt, hẹn gặp lại ngày mai!',
      },
      {
        word: 'Good morning',
        translation: 'Chào buổi sáng',
        pronunciation: '/ɡʊd ˈmɔːrnɪŋ/',
        exampleSentence: 'Good morning! How are you?',
        exampleTranslation: 'Chào buổi sáng! Bạn có khoẻ không?',
      },
      {
        word: 'Good night',
        translation: 'Chúc ngủ ngon',
        pronunciation: '/ɡʊd naɪt/',
        exampleSentence: 'Good night, sweet dreams.',
        exampleTranslation: 'Chúc ngủ ngon, mơ đẹp nhé.',
      },
    ],
    activities: [
      {
        id: 'en-unit-1-lesson-1-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn nghĩa đúng của từ sau:',
        question: '"Hello" có nghĩa là gì?',
        options: ['Tạm biệt', 'Xin chào', 'Cảm ơn', 'Xin lỗi'],
        correctIndex: 1,
      } satisfies MultipleChoiceActivity,
      {
        id: 'en-unit-1-lesson-1-act-2',
        type: 'vocabulary_match',
        instruction: 'Nối từ tiếng Anh với nghĩa tiếng Việt:',
        pairs: [
          { word: 'Hello', match: 'Xin chào' },
          { word: 'Goodbye', match: 'Tạm biệt' },
          { word: 'Good morning', match: 'Chào buổi sáng' },
          { word: 'Good night', match: 'Chúc ngủ ngon' },
        ],
      } satisfies VocabularyMatchActivity,
      {
        id: 'en-unit-1-lesson-1-act-3',
        type: 'ai_conversation',
        instruction: 'Luyện tập chào hỏi với AI teacher Lumi:',
        scenario: 'Hãy chào AI teacher và giới thiệu tên bạn bằng tiếng Anh.',
        suggestedPhrases: ['Hello!', 'My name is...', 'Nice to meet you!'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly English teacher speaking to a Vietnamese learner. ' +
      'The student just learned basic greetings: Hello, Goodbye, Good morning, Good night. ' +
      'Your goal: help them practice greeting naturally in English. ' +
      'Speak mostly in English using simple sentences. ' +
      'Switch to Vietnamese only to clarify meaning when necessary. ' +
      'Start by greeting the student warmly in English.',
  },

  // ── en-unit-1 / lesson-2 ───────────────────────────────────────────────
  {
    id: 'en-unit-1-lesson-2',
    unitId: 'en-unit-1',
    order: 2,
    title: 'Introducing Yourself',
    xpReward: 20,
    estimatedMinutes: 10,
    vocabulary: [
      {
        word: 'My name is',
        translation: 'Tên tôi là',
        pronunciation: '/maɪ neɪm ɪz/',
        exampleSentence: 'My name is Anna.',
        exampleTranslation: 'Tên tôi là Anna.',
      },
      {
        word: 'I am from',
        translation: 'Tôi đến từ',
        pronunciation: '/aɪ æm frɒm/',
        exampleSentence: 'I am from Vietnam.',
        exampleTranslation: 'Tôi đến từ Việt Nam.',
      },
      {
        word: 'Nice to meet you',
        translation: 'Rất vui được gặp bạn',
        pronunciation: '/naɪs tə miːt juː/',
        exampleSentence: 'Nice to meet you, Tom!',
        exampleTranslation: 'Rất vui được gặp bạn, Tom!',
      },
      {
        word: 'How are you?',
        translation: 'Bạn có khoẻ không?',
        pronunciation: '/haʊ ɑːr juː/',
        exampleSentence: 'Hello! How are you?',
        exampleTranslation: 'Xin chào! Bạn có khoẻ không?',
      },
      {
        word: 'I am fine',
        translation: 'Tôi khoẻ',
        pronunciation: '/aɪ æm faɪn/',
        exampleSentence: 'I am fine, thank you!',
        exampleTranslation: 'Tôi khoẻ, cảm ơn!',
      },
    ],
    activities: [
      {
        id: 'en-unit-1-lesson-2-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn câu đúng để tự giới thiệu:',
        question: 'Làm thế nào để nói "Tên tôi là Nam" bằng tiếng Anh?',
        options: ['I am from Nam.', 'My name is Nam.', 'Nice to meet Nam.', 'How are you Nam?'],
        correctIndex: 1,
      } satisfies MultipleChoiceActivity,
      {
        id: 'en-unit-1-lesson-2-act-2',
        type: 'translation',
        instruction: 'Dịch câu sau sang tiếng Anh:',
        sourceText: 'Rất vui được gặp bạn!',
        targetText: 'Nice to meet you!',
        acceptedVariants: ['Nice to meet you!', 'Nice to meet you', 'nice to meet you'],
      } satisfies TranslationActivity,
      {
        id: 'en-unit-1-lesson-2-act-3',
        type: 'ai_conversation',
        instruction: 'Tự giới thiệu với AI teacher bằng tiếng Anh:',
        scenario: 'Hãy tự giới thiệu tên, quê quán và hỏi thăm AI teacher.',
        suggestedPhrases: ['My name is...', 'I am from...', 'Nice to meet you!', 'How are you?'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly English teacher speaking to a Vietnamese learner. ' +
      'The student just learned self-introduction phrases: My name is, I am from, Nice to meet you, How are you, I am fine. ' +
      'Your goal: help them introduce themselves confidently in English. ' +
      'Speak mostly in English. Switch to Vietnamese only to clarify meaning. ' +
      'Ask the student their name and where they are from to start the conversation.',
  },

  // ── en-unit-2 / lesson-1 ───────────────────────────────────────────────
  {
    id: 'en-unit-2-lesson-1',
    unitId: 'en-unit-2',
    order: 1,
    title: 'Numbers 1–10',
    xpReward: 10,
    estimatedMinutes: 5,
    vocabulary: [
      {
        word: 'One',
        translation: 'Một',
        pronunciation: '/wʌn/',
        exampleSentence: 'I have one cat.',
        exampleTranslation: 'Tôi có một con mèo.',
      },
      {
        word: 'Two',
        translation: 'Hai',
        pronunciation: '/tuː/',
        exampleSentence: 'She has two sisters.',
        exampleTranslation: 'Cô ấy có hai người chị.',
      },
      {
        word: 'Three',
        translation: 'Ba',
        pronunciation: '/θriː/',
        exampleSentence: 'There are three books.',
        exampleTranslation: 'Có ba quyển sách.',
      },
      {
        word: 'Five',
        translation: 'Năm',
        pronunciation: '/faɪv/',
        exampleSentence: 'I am five years old.',
        exampleTranslation: 'Tôi năm tuổi.',
      },
      {
        word: 'Ten',
        translation: 'Mười',
        pronunciation: '/ten/',
        exampleSentence: 'Count to ten.',
        exampleTranslation: 'Đếm đến mười.',
      },
    ],
    activities: [
      {
        id: 'en-unit-2-lesson-1-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn số đúng:',
        question: '"Three" có nghĩa là số mấy?',
        options: ['1', '2', '3', '5'],
        correctIndex: 2,
      } satisfies MultipleChoiceActivity,
      {
        id: 'en-unit-2-lesson-1-act-2',
        type: 'vocabulary_match',
        instruction: 'Nối số tiếng Anh với số tương ứng:',
        pairs: [
          { word: 'One', match: '1' },
          { word: 'Two', match: '2' },
          { word: 'Five', match: '5' },
          { word: 'Ten', match: '10' },
        ],
      } satisfies VocabularyMatchActivity,
      {
        id: 'en-unit-2-lesson-1-act-3',
        type: 'ai_conversation',
        instruction: 'Đếm số với AI teacher:',
        scenario: 'Hãy đếm từ 1 đến 10 bằng tiếng Anh cùng AI teacher.',
        suggestedPhrases: ['One, two, three...', 'How do you say 7?', 'Can you count with me?'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly English teacher speaking to a Vietnamese learner. ' +
      'The student just learned numbers: one, two, three, five, ten. ' +
      'Your goal: help them count confidently from 1 to 10 in English. ' +
      'Speak in English. Switch to Vietnamese only to clarify. ' +
      'Start by asking the student to count together with you.',
  },

  // ── en-unit-2 / lesson-2 ───────────────────────────────────────────────
  {
    id: 'en-unit-2-lesson-2',
    unitId: 'en-unit-2',
    order: 2,
    title: 'Colors',
    xpReward: 20,
    estimatedMinutes: 10,
    vocabulary: [
      {
        word: 'Red',
        translation: 'Đỏ',
        pronunciation: '/red/',
        exampleSentence: 'The apple is red.',
        exampleTranslation: 'Quả táo màu đỏ.',
      },
      {
        word: 'Blue',
        translation: 'Xanh dương',
        pronunciation: '/bluː/',
        exampleSentence: 'The sky is blue.',
        exampleTranslation: 'Bầu trời màu xanh dương.',
      },
      {
        word: 'Green',
        translation: 'Xanh lá',
        pronunciation: '/ɡriːn/',
        exampleSentence: 'The tree is green.',
        exampleTranslation: 'Cái cây màu xanh lá.',
      },
      {
        word: 'Yellow',
        translation: 'Vàng',
        pronunciation: '/ˈjeloʊ/',
        exampleSentence: 'The sun is yellow.',
        exampleTranslation: 'Mặt trời màu vàng.',
      },
    ],
    activities: [
      {
        id: 'en-unit-2-lesson-2-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn nghĩa đúng:',
        question: '"Blue" có nghĩa là màu gì?',
        options: ['Đỏ', 'Vàng', 'Xanh dương', 'Xanh lá'],
        correctIndex: 2,
      } satisfies MultipleChoiceActivity,
      {
        id: 'en-unit-2-lesson-2-act-2',
        type: 'translation',
        instruction: 'Dịch sang tiếng Anh:',
        sourceText: 'Bầu trời màu xanh dương.',
        targetText: 'The sky is blue.',
        acceptedVariants: ['The sky is blue.', 'The sky is blue', 'the sky is blue'],
      } satisfies TranslationActivity,
      {
        id: 'en-unit-2-lesson-2-act-3',
        type: 'ai_conversation',
        instruction: 'Mô tả màu sắc với AI teacher:',
        scenario: 'Hãy mô tả màu sắc của các đồ vật xung quanh bạn bằng tiếng Anh.',
        suggestedPhrases: ['The ... is red.', 'What color is ...?', 'My favorite color is ...'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly English teacher speaking to a Vietnamese learner. ' +
      'The student just learned colors: red, blue, green, yellow. ' +
      'Your goal: help them describe colors of everyday objects in English. ' +
      'Ask about colors of things around them. Speak in English. Switch to Vietnamese only to clarify.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // KOREAN
  // ═══════════════════════════════════════════════════════════════════════

  // ── ko-unit-1 / lesson-1 ───────────────────────────────────────────────
  {
    id: 'ko-unit-1-lesson-1',
    unitId: 'ko-unit-1',
    order: 1,
    title: '안녕하세요 (Xin chào)',
    xpReward: 10,
    estimatedMinutes: 5,
    vocabulary: [
      {
        word: '안녕하세요',
        translation: 'Xin chào (trang trọng)',
        pronunciation: 'an-nyeong-ha-se-yo',
        exampleSentence: '안녕하세요! 처음 뵙겠습니다.',
        exampleTranslation: 'Xin chào! Rất vui được gặp bạn.',
      },
      {
        word: '안녕',
        translation: 'Chào (thân mật)',
        pronunciation: 'an-nyeong',
        exampleSentence: '안녕! 잘 지냈어?',
        exampleTranslation: 'Chào! Bạn có khoẻ không?',
      },
      {
        word: '감사합니다',
        translation: 'Cảm ơn',
        pronunciation: 'gam-sa-ham-ni-da',
        exampleSentence: '도와주셔서 감사합니다.',
        exampleTranslation: 'Cảm ơn bạn đã giúp đỡ.',
      },
      {
        word: '죄송합니다',
        translation: 'Xin lỗi',
        pronunciation: 'joe-song-ham-ni-da',
        exampleSentence: '늦어서 죄송합니다.',
        exampleTranslation: 'Xin lỗi vì đã trễ.',
      },
    ],
    activities: [
      {
        id: 'ko-unit-1-lesson-1-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn nghĩa đúng:',
        question: '"감사합니다" có nghĩa là gì?',
        options: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi'],
        correctIndex: 2,
      } satisfies MultipleChoiceActivity,
      {
        id: 'ko-unit-1-lesson-1-act-2',
        type: 'vocabulary_match',
        instruction: 'Nối từ tiếng Hàn với nghĩa tiếng Việt:',
        pairs: [
          { word: '안녕하세요', match: 'Xin chào' },
          { word: '감사합니다', match: 'Cảm ơn' },
          { word: '죄송합니다', match: 'Xin lỗi' },
          { word: '안녕', match: 'Chào (thân mật)' },
        ],
      } satisfies VocabularyMatchActivity,
      {
        id: 'ko-unit-1-lesson-1-act-3',
        type: 'ai_conversation',
        instruction: 'Chào hỏi AI teacher bằng tiếng Hàn:',
        scenario: 'Hãy chào AI teacher và nói cảm ơn bằng tiếng Hàn.',
        suggestedPhrases: ['안녕하세요!', '감사합니다!', '죄송합니다.'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly Korean teacher speaking to a Vietnamese learner. ' +
      'The student just learned basic Korean greetings: 안녕하세요, 안녕, 감사합니다, 죄송합니다. ' +
      'Your goal: help them greet and thank naturally in Korean. ' +
      'Speak mostly in Korean with simple sentences. Switch to Vietnamese to clarify meaning. ' +
      'Start with 안녕하세요 and encourage the student to respond.',
  },

  // ── ko-unit-1 / lesson-2 ───────────────────────────────────────────────
  {
    id: 'ko-unit-1-lesson-2',
    unitId: 'ko-unit-1',
    order: 2,
    title: '자기소개 (Tự giới thiệu)',
    xpReward: 20,
    estimatedMinutes: 10,
    vocabulary: [
      {
        word: '저는 ~입니다',
        translation: 'Tôi là ~',
        pronunciation: 'jeo-neun ~im-ni-da',
        exampleSentence: '저는 학생입니다.',
        exampleTranslation: 'Tôi là học sinh.',
      },
      {
        word: '이름이 뭐예요?',
        translation: 'Tên bạn là gì?',
        pronunciation: 'i-reum-i mwo-ye-yo',
        exampleSentence: '이름이 뭐예요? 저는 Lumi예요.',
        exampleTranslation: 'Tên bạn là gì? Tôi là Lumi.',
      },
      {
        word: '반갑습니다',
        translation: 'Rất vui được gặp bạn',
        pronunciation: 'ban-gap-seum-ni-da',
        exampleSentence: '처음 뵙겠습니다. 반갑습니다!',
        exampleTranslation: 'Lần đầu gặp. Rất vui được gặp bạn!',
      },
      {
        word: '어디서 왔어요?',
        translation: 'Bạn đến từ đâu?',
        pronunciation: 'eo-di-seo wa-sseo-yo',
        exampleSentence: '어디서 왔어요? 베트남에서 왔어요.',
        exampleTranslation: 'Bạn đến từ đâu? Tôi đến từ Việt Nam.',
      },
    ],
    activities: [
      {
        id: 'ko-unit-1-lesson-2-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn câu đúng:',
        question: 'Làm thế nào để nói "Tôi là học sinh" bằng tiếng Hàn?',
        options: ['저는 선생님입니다.', '저는 학생입니다.', '이름이 뭐예요?', '반갑습니다.'],
        correctIndex: 1,
      } satisfies MultipleChoiceActivity,
      {
        id: 'ko-unit-1-lesson-2-act-2',
        type: 'translation',
        instruction: 'Dịch câu sau sang tiếng Hàn:',
        sourceText: 'Rất vui được gặp bạn!',
        targetText: '반갑습니다!',
        acceptedVariants: ['반갑습니다!', '반갑습니다', '반가워요!', '반가워요'],
      } satisfies TranslationActivity,
      {
        id: 'ko-unit-1-lesson-2-act-3',
        type: 'ai_conversation',
        instruction: 'Tự giới thiệu với AI teacher bằng tiếng Hàn:',
        scenario: 'Hãy tự giới thiệu tên và quê quán của bạn bằng tiếng Hàn.',
        suggestedPhrases: ['저는 ~입니다.', '어디서 왔어요?', '반갑습니다!'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly Korean teacher speaking to a Vietnamese learner. ' +
      'The student just learned self-introduction in Korean: 저는 ~입니다, 이름이 뭐예요, 반갑습니다, 어디서 왔어요. ' +
      'Your goal: help them introduce themselves naturally in Korean. ' +
      'Ask the student their name and where they are from. Speak in Korean. Switch to Vietnamese to clarify.',
  },

  // ── ko-unit-2 / lesson-1 ───────────────────────────────────────────────
  {
    id: 'ko-unit-2-lesson-1',
    unitId: 'ko-unit-2',
    order: 1,
    title: '숫자 (Số đếm)',
    xpReward: 10,
    estimatedMinutes: 5,
    vocabulary: [
      {
        word: '일 (一)',
        translation: 'Một',
        pronunciation: 'il',
        exampleSentence: '일 더하기 일은 이입니다.',
        exampleTranslation: 'Một cộng một bằng hai.',
      },
      {
        word: '이 (二)',
        translation: 'Hai',
        pronunciation: 'i',
        exampleSentence: '이 개의 사과가 있습니다.',
        exampleTranslation: 'Có hai quả táo.',
      },
      {
        word: '삼 (三)',
        translation: 'Ba',
        pronunciation: 'sam',
        exampleSentence: '삼 일 동안 공부했습니다.',
        exampleTranslation: 'Tôi đã học ba ngày.',
      },
      {
        word: '오 (五)',
        translation: 'Năm',
        pronunciation: 'o',
        exampleSentence: '오 분만 기다려 주세요.',
        exampleTranslation: 'Xin đợi năm phút.',
      },
      {
        word: '십 (十)',
        translation: 'Mười',
        pronunciation: 'sip',
        exampleSentence: '십 명이 왔습니다.',
        exampleTranslation: 'Có mười người đến.',
      },
    ],
    activities: [
      {
        id: 'ko-unit-2-lesson-1-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn đáp án đúng:',
        question: '"삼" có nghĩa là số mấy?',
        options: ['1', '2', '3', '5'],
        correctIndex: 2,
      } satisfies MultipleChoiceActivity,
      {
        id: 'ko-unit-2-lesson-1-act-2',
        type: 'vocabulary_match',
        instruction: 'Nối số Hàn với số tương ứng:',
        pairs: [
          { word: '일', match: '1' },
          { word: '이', match: '2' },
          { word: '오', match: '5' },
          { word: '십', match: '10' },
        ],
      } satisfies VocabularyMatchActivity,
      {
        id: 'ko-unit-2-lesson-1-act-3',
        type: 'ai_conversation',
        instruction: 'Đếm số với AI teacher bằng tiếng Hàn:',
        scenario: 'Hãy đếm từ 1 đến 10 bằng tiếng Hàn cùng AI teacher.',
        suggestedPhrases: ['일, 이, 삼...', '몇 번이에요?', '같이 세어 볼까요?'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly Korean teacher speaking to a Vietnamese learner. ' +
      'The student just learned Sino-Korean numbers: 일, 이, 삼, 오, 십. ' +
      'Your goal: help them count from 1 to 10 in Korean. ' +
      'Count together with the student. Speak in Korean. Switch to Vietnamese to clarify.',
  },

  // ── ko-unit-2 / lesson-2 ───────────────────────────────────────────────
  {
    id: 'ko-unit-2-lesson-2',
    unitId: 'ko-unit-2',
    order: 2,
    title: '색깔 (Màu sắc)',
    xpReward: 20,
    estimatedMinutes: 10,
    vocabulary: [
      {
        word: '빨간색',
        translation: 'Màu đỏ',
        pronunciation: 'ppal-gan-saek',
        exampleSentence: '사과는 빨간색입니다.',
        exampleTranslation: 'Quả táo màu đỏ.',
      },
      {
        word: '파란색',
        translation: 'Màu xanh dương',
        pronunciation: 'pa-ran-saek',
        exampleSentence: '하늘은 파란색입니다.',
        exampleTranslation: 'Bầu trời màu xanh dương.',
      },
      {
        word: '초록색',
        translation: 'Màu xanh lá',
        pronunciation: 'cho-rok-saek',
        exampleSentence: '나뭇잎은 초록색입니다.',
        exampleTranslation: 'Lá cây màu xanh lá.',
      },
      {
        word: '노란색',
        translation: 'Màu vàng',
        pronunciation: 'no-ran-saek',
        exampleSentence: '바나나는 노란색입니다.',
        exampleTranslation: 'Quả chuối màu vàng.',
      },
    ],
    activities: [
      {
        id: 'ko-unit-2-lesson-2-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn nghĩa đúng:',
        question: '"파란색" có nghĩa là màu gì?',
        options: ['Đỏ', 'Vàng', 'Xanh dương', 'Xanh lá'],
        correctIndex: 2,
      } satisfies MultipleChoiceActivity,
      {
        id: 'ko-unit-2-lesson-2-act-2',
        type: 'translation',
        instruction: 'Dịch sang tiếng Hàn:',
        sourceText: 'Bầu trời màu xanh dương.',
        targetText: '하늘은 파란색입니다.',
        acceptedVariants: ['하늘은 파란색입니다.', '하늘은 파란색입니다', '하늘이 파란색이에요.'],
      } satisfies TranslationActivity,
      {
        id: 'ko-unit-2-lesson-2-act-3',
        type: 'ai_conversation',
        instruction: 'Mô tả màu sắc với AI teacher bằng tiếng Hàn:',
        scenario: 'Hãy mô tả màu sắc của các đồ vật xung quanh bạn bằng tiếng Hàn.',
        suggestedPhrases: ['이것은 ~색입니다.', '무슨 색이에요?', '제가 좋아하는 색은 ~입니다.'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly Korean teacher speaking to a Vietnamese learner. ' +
      'The student just learned Korean colors: 빨간색, 파란색, 초록색, 노란색. ' +
      'Your goal: help them describe colors of everyday objects in Korean. ' +
      'Ask about colors of things around them. Speak in Korean. Switch to Vietnamese to clarify.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // FRENCH
  // ═══════════════════════════════════════════════════════════════════════

  // ── fr-unit-1 / lesson-1 ───────────────────────────────────────────────
  {
    id: 'fr-unit-1-lesson-1',
    unitId: 'fr-unit-1',
    order: 1,
    title: 'Bonjour & Au revoir',
    xpReward: 10,
    estimatedMinutes: 5,
    vocabulary: [
      {
        word: 'Bonjour',
        translation: 'Xin chào / Chào buổi sáng',
        pronunciation: '/bɔ̃.ʒuʁ/',
        exampleSentence: 'Bonjour, comment vous appelez-vous?',
        exampleTranslation: 'Xin chào, bạn tên là gì?',
      },
      {
        word: 'Bonsoir',
        translation: 'Chào buổi tối',
        pronunciation: '/bɔ̃.swaʁ/',
        exampleSentence: 'Bonsoir! Vous avez passé une bonne journée?',
        exampleTranslation: 'Chào buổi tối! Bạn có một ngày tốt không?',
      },
      {
        word: 'Au revoir',
        translation: 'Tạm biệt',
        pronunciation: '/o ʁə.vwaʁ/',
        exampleSentence: 'Au revoir, à demain!',
        exampleTranslation: 'Tạm biệt, hẹn gặp lại ngày mai!',
      },
      {
        word: 'Merci',
        translation: 'Cảm ơn',
        pronunciation: '/mɛʁ.si/',
        exampleSentence: 'Merci beaucoup!',
        exampleTranslation: 'Cảm ơn rất nhiều!',
      },
    ],
    activities: [
      {
        id: 'fr-unit-1-lesson-1-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn nghĩa đúng:',
        question: '"Au revoir" có nghĩa là gì?',
        options: ['Xin chào', 'Cảm ơn', 'Tạm biệt', 'Xin lỗi'],
        correctIndex: 2,
      } satisfies MultipleChoiceActivity,
      {
        id: 'fr-unit-1-lesson-1-act-2',
        type: 'vocabulary_match',
        instruction: 'Nối từ tiếng Pháp với nghĩa tiếng Việt:',
        pairs: [
          { word: 'Bonjour', match: 'Xin chào' },
          { word: 'Bonsoir', match: 'Chào buổi tối' },
          { word: 'Au revoir', match: 'Tạm biệt' },
          { word: 'Merci', match: 'Cảm ơn' },
        ],
      } satisfies VocabularyMatchActivity,
      {
        id: 'fr-unit-1-lesson-1-act-3',
        type: 'ai_conversation',
        instruction: 'Chào hỏi AI teacher bằng tiếng Pháp:',
        scenario: 'Hãy chào AI teacher bằng tiếng Pháp và nói cảm ơn.',
        suggestedPhrases: ['Bonjour!', 'Merci beaucoup!', 'Au revoir!'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly French teacher speaking to a Vietnamese learner. ' +
      'The student just learned basic French greetings: Bonjour, Bonsoir, Au revoir, Merci. ' +
      'Your goal: help them greet naturally in French. ' +
      'Speak mostly in French using simple sentences. Switch to Vietnamese to clarify. ' +
      'Start with Bonjour and encourage the student to respond.',
  },

  // ── fr-unit-1 / lesson-2 ───────────────────────────────────────────────
  {
    id: 'fr-unit-1-lesson-2',
    unitId: 'fr-unit-1',
    order: 2,
    title: 'Se présenter',
    xpReward: 20,
    estimatedMinutes: 10,
    vocabulary: [
      {
        word: "Je m'appelle",
        translation: 'Tôi tên là',
        pronunciation: '/ʒə ma.pɛl/',
        exampleSentence: "Je m'appelle Marie.",
        exampleTranslation: 'Tôi tên là Marie.',
      },
      {
        word: 'Je viens de',
        translation: 'Tôi đến từ',
        pronunciation: '/ʒə vjɛ̃ də/',
        exampleSentence: 'Je viens du Vietnam.',
        exampleTranslation: 'Tôi đến từ Việt Nam.',
      },
      {
        word: 'Enchanté(e)',
        translation: 'Rất vui được gặp bạn',
        pronunciation: '/ɑ̃.ʃɑ̃.te/',
        exampleSentence: 'Bonjour! Enchanté!',
        exampleTranslation: 'Xin chào! Rất vui được gặp bạn!',
      },
      {
        word: 'Comment allez-vous?',
        translation: 'Bạn có khoẻ không?',
        pronunciation: '/kɔ.mɑ̃ ta.le vu/',
        exampleSentence: 'Bonjour! Comment allez-vous?',
        exampleTranslation: 'Xin chào! Bạn có khoẻ không?',
      },
    ],
    activities: [
      {
        id: 'fr-unit-1-lesson-2-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn câu đúng:',
        question: 'Làm thế nào để nói "Tôi tên là Nam" bằng tiếng Pháp?',
        options: ['Je viens de Nam.', 'Enchanté, Nam.', "Je m'appelle Nam.", 'Comment allez-vous, Nam?'],
        correctIndex: 2,
      } satisfies MultipleChoiceActivity,
      {
        id: 'fr-unit-1-lesson-2-act-2',
        type: 'translation',
        instruction: 'Dịch sang tiếng Pháp:',
        sourceText: 'Rất vui được gặp bạn!',
        targetText: 'Enchanté!',
        acceptedVariants: ['Enchanté!', 'Enchanté', 'Enchantée!', 'Enchantée'],
      } satisfies TranslationActivity,
      {
        id: 'fr-unit-1-lesson-2-act-3',
        type: 'ai_conversation',
        instruction: 'Tự giới thiệu với AI teacher bằng tiếng Pháp:',
        scenario: 'Hãy tự giới thiệu tên và quê quán của bạn bằng tiếng Pháp.',
        suggestedPhrases: ["Je m'appelle...", 'Je viens de...', 'Enchanté!'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly French teacher speaking to a Vietnamese learner. ' +
      "The student just learned self-introduction in French: Je m'appelle, Je viens de, Enchanté, Comment allez-vous. " +
      'Your goal: help them introduce themselves naturally in French. ' +
      'Ask their name and where they are from. Speak in French. Switch to Vietnamese to clarify.',
  },

  // ── fr-unit-2 / lesson-1 ───────────────────────────────────────────────
  {
    id: 'fr-unit-2-lesson-1',
    unitId: 'fr-unit-2',
    order: 1,
    title: 'Les nombres 1–10',
    xpReward: 10,
    estimatedMinutes: 5,
    vocabulary: [
      {
        word: 'Un / Une',
        translation: 'Một',
        pronunciation: '/œ̃/ /yn/',
        exampleSentence: "J'ai un chat.",
        exampleTranslation: 'Tôi có một con mèo.',
      },
      {
        word: 'Deux',
        translation: 'Hai',
        pronunciation: '/dø/',
        exampleSentence: 'Il a deux frères.',
        exampleTranslation: 'Anh ấy có hai người anh.',
      },
      {
        word: 'Trois',
        translation: 'Ba',
        pronunciation: '/tʁwa/',
        exampleSentence: 'Il y a trois livres.',
        exampleTranslation: 'Có ba quyển sách.',
      },
      {
        word: 'Cinq',
        translation: 'Năm',
        pronunciation: '/sɛ̃k/',
        exampleSentence: "J'ai cinq ans.",
        exampleTranslation: 'Tôi năm tuổi.',
      },
      {
        word: 'Dix',
        translation: 'Mười',
        pronunciation: '/dis/',
        exampleSentence: "Comptez jusqu'à dix.",
        exampleTranslation: 'Hãy đếm đến mười.',
      },
    ],
    activities: [
      {
        id: 'fr-unit-2-lesson-1-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn đáp án đúng:',
        question: '"Trois" có nghĩa là số mấy?',
        options: ['1', '2', '3', '5'],
        correctIndex: 2,
      } satisfies MultipleChoiceActivity,
      {
        id: 'fr-unit-2-lesson-1-act-2',
        type: 'vocabulary_match',
        instruction: 'Nối số tiếng Pháp với số tương ứng:',
        pairs: [
          { word: 'Un', match: '1' },
          { word: 'Deux', match: '2' },
          { word: 'Cinq', match: '5' },
          { word: 'Dix', match: '10' },
        ],
      } satisfies VocabularyMatchActivity,
      {
        id: 'fr-unit-2-lesson-1-act-3',
        type: 'ai_conversation',
        instruction: 'Đếm số với AI teacher bằng tiếng Pháp:',
        scenario: 'Hãy đếm từ 1 đến 10 bằng tiếng Pháp cùng AI teacher.',
        suggestedPhrases: ['Un, deux, trois...', 'Comment dit-on 7?', 'Comptons ensemble!'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly French teacher speaking to a Vietnamese learner. ' +
      'The student just learned French numbers: un, deux, trois, cinq, dix. ' +
      'Your goal: help them count from 1 to 10 in French. ' +
      'Count together with the student. Speak in French. Switch to Vietnamese to clarify.',
  },

  // ── fr-unit-2 / lesson-2 ───────────────────────────────────────────────
  {
    id: 'fr-unit-2-lesson-2',
    unitId: 'fr-unit-2',
    order: 2,
    title: 'Les couleurs',
    xpReward: 20,
    estimatedMinutes: 10,
    vocabulary: [
      {
        word: 'Rouge',
        translation: 'Màu đỏ',
        pronunciation: '/ʁuʒ/',
        exampleSentence: 'La pomme est rouge.',
        exampleTranslation: 'Quả táo màu đỏ.',
      },
      {
        word: 'Bleu / Bleue',
        translation: 'Màu xanh dương',
        pronunciation: '/blø/',
        exampleSentence: 'Le ciel est bleu.',
        exampleTranslation: 'Bầu trời màu xanh dương.',
      },
      {
        word: 'Vert / Verte',
        translation: 'Màu xanh lá',
        pronunciation: '/vɛʁ/',
        exampleSentence: "L'arbre est vert.",
        exampleTranslation: 'Cái cây màu xanh lá.',
      },
      {
        word: 'Jaune',
        translation: 'Màu vàng',
        pronunciation: '/ʒon/',
        exampleSentence: 'Le soleil est jaune.',
        exampleTranslation: 'Mặt trời màu vàng.',
      },
    ],
    activities: [
      {
        id: 'fr-unit-2-lesson-2-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn nghĩa đúng:',
        question: '"Bleu" có nghĩa là màu gì?',
        options: ['Đỏ', 'Vàng', 'Xanh dương', 'Xanh lá'],
        correctIndex: 2,
      } satisfies MultipleChoiceActivity,
      {
        id: 'fr-unit-2-lesson-2-act-2',
        type: 'translation',
        instruction: 'Dịch sang tiếng Pháp:',
        sourceText: 'Bầu trời màu xanh dương.',
        targetText: 'Le ciel est bleu.',
        acceptedVariants: ['Le ciel est bleu.', 'Le ciel est bleu', 'le ciel est bleu'],
      } satisfies TranslationActivity,
      {
        id: 'fr-unit-2-lesson-2-act-3',
        type: 'ai_conversation',
        instruction: 'Mô tả màu sắc với AI teacher bằng tiếng Pháp:',
        scenario: 'Hãy mô tả màu sắc của các đồ vật xung quanh bạn bằng tiếng Pháp.',
        suggestedPhrases: ["C'est... rouge.", 'De quelle couleur est...?', 'Ma couleur préférée est...'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly French teacher speaking to a Vietnamese learner. ' +
      'The student just learned French colors: rouge, bleu, vert, jaune. ' +
      'Your goal: help them describe colors of everyday objects in French. ' +
      'Ask about colors of things around them. Speak in French. Switch to Vietnamese to clarify.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SPANISH
  // ═══════════════════════════════════════════════════════════════════════

  // ── es-unit-1 / lesson-1 ───────────────────────────────────────────────
  {
    id: 'es-unit-1-lesson-1',
    unitId: 'es-unit-1',
    order: 1,
    title: 'Hola & Adiós',
    xpReward: 10,
    estimatedMinutes: 5,
    vocabulary: [
      {
        word: 'Hola',
        translation: 'Xin chào',
        pronunciation: '/ˈo.la/',
        exampleSentence: '¡Hola! ¿Cómo te llamas?',
        exampleTranslation: 'Xin chào! Bạn tên là gì?',
      },
      {
        word: 'Buenos días',
        translation: 'Chào buổi sáng',
        pronunciation: '/ˈbwe.nos ˈdi.as/',
        exampleSentence: '¡Buenos días! ¿Cómo estás?',
        exampleTranslation: 'Chào buổi sáng! Bạn có khoẻ không?',
      },
      {
        word: 'Adiós',
        translation: 'Tạm biệt',
        pronunciation: '/a.ˈðjos/',
        exampleSentence: '¡Adiós! ¡Hasta mañana!',
        exampleTranslation: 'Tạm biệt! Hẹn gặp lại ngày mai!',
      },
      {
        word: 'Gracias',
        translation: 'Cảm ơn',
        pronunciation: '/ˈɡɾa.θjas/',
        exampleSentence: '¡Muchas gracias!',
        exampleTranslation: 'Cảm ơn rất nhiều!',
      },
    ],
    activities: [
      {
        id: 'es-unit-1-lesson-1-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn nghĩa đúng:',
        question: '"Adiós" có nghĩa là gì?',
        options: ['Xin chào', 'Cảm ơn', 'Tạm biệt', 'Xin lỗi'],
        correctIndex: 2,
      } satisfies MultipleChoiceActivity,
      {
        id: 'es-unit-1-lesson-1-act-2',
        type: 'vocabulary_match',
        instruction: 'Nối từ tiếng Tây Ban Nha với nghĩa tiếng Việt:',
        pairs: [
          { word: 'Hola', match: 'Xin chào' },
          { word: 'Buenos días', match: 'Chào buổi sáng' },
          { word: 'Adiós', match: 'Tạm biệt' },
          { word: 'Gracias', match: 'Cảm ơn' },
        ],
      } satisfies VocabularyMatchActivity,
      {
        id: 'es-unit-1-lesson-1-act-3',
        type: 'ai_conversation',
        instruction: 'Chào hỏi AI teacher bằng tiếng Tây Ban Nha:',
        scenario: 'Hãy chào AI teacher và nói cảm ơn bằng tiếng Tây Ban Nha.',
        suggestedPhrases: ['¡Hola!', '¡Gracias!', '¡Adiós!'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly Spanish teacher speaking to a Vietnamese learner. ' +
      'The student just learned basic Spanish greetings: Hola, Buenos días, Adiós, Gracias. ' +
      'Your goal: help them greet naturally in Spanish. ' +
      'Speak mostly in Spanish using simple sentences. Switch to Vietnamese to clarify. ' +
      'Start with ¡Hola! and encourage the student to respond.',
  },

  // ── es-unit-1 / lesson-2 ───────────────────────────────────────────────
  {
    id: 'es-unit-1-lesson-2',
    unitId: 'es-unit-1',
    order: 2,
    title: 'Presentarse',
    xpReward: 20,
    estimatedMinutes: 10,
    vocabulary: [
      {
        word: 'Me llamo',
        translation: 'Tôi tên là',
        pronunciation: '/me ˈʎa.mo/',
        exampleSentence: 'Me llamo Carlos.',
        exampleTranslation: 'Tôi tên là Carlos.',
      },
      {
        word: 'Soy de',
        translation: 'Tôi đến từ',
        pronunciation: '/soi ðe/',
        exampleSentence: 'Soy de Vietnam.',
        exampleTranslation: 'Tôi đến từ Việt Nam.',
      },
      {
        word: 'Mucho gusto',
        translation: 'Rất vui được gặp bạn',
        pronunciation: '/ˈmu.tʃo ˈɡus.to/',
        exampleSentence: '¡Hola! ¡Mucho gusto!',
        exampleTranslation: 'Xin chào! Rất vui được gặp bạn!',
      },
      {
        word: '¿Cómo estás?',
        translation: 'Bạn có khoẻ không?',
        pronunciation: '/ˈko.mo esˈtas/',
        exampleSentence: '¡Hola! ¿Cómo estás?',
        exampleTranslation: 'Xin chào! Bạn có khoẻ không?',
      },
    ],
    activities: [
      {
        id: 'es-unit-1-lesson-2-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn câu đúng:',
        question: 'Làm thế nào để nói "Tôi tên là Nam" bằng tiếng Tây Ban Nha?',
        options: ['Soy de Nam.', 'Me llamo Nam.', 'Mucho gusto, Nam.', '¿Cómo estás, Nam?'],
        correctIndex: 1,
      } satisfies MultipleChoiceActivity,
      {
        id: 'es-unit-1-lesson-2-act-2',
        type: 'translation',
        instruction: 'Dịch sang tiếng Tây Ban Nha:',
        sourceText: 'Rất vui được gặp bạn!',
        targetText: '¡Mucho gusto!',
        acceptedVariants: ['¡Mucho gusto!', 'Mucho gusto!', 'Mucho gusto', '¡Mucho gusto'],
      } satisfies TranslationActivity,
      {
        id: 'es-unit-1-lesson-2-act-3',
        type: 'ai_conversation',
        instruction: 'Tự giới thiệu với AI teacher bằng tiếng Tây Ban Nha:',
        scenario: 'Hãy tự giới thiệu tên và quê quán của bạn bằng tiếng Tây Ban Nha.',
        suggestedPhrases: ['Me llamo...', 'Soy de...', '¡Mucho gusto!'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly Spanish teacher speaking to a Vietnamese learner. ' +
      'The student just learned self-introduction in Spanish: Me llamo, Soy de, Mucho gusto, ¿Cómo estás?. ' +
      'Your goal: help them introduce themselves naturally in Spanish. ' +
      'Ask their name and where they are from. Speak in Spanish. Switch to Vietnamese to clarify.',
  },

  // ── es-unit-2 / lesson-1 ───────────────────────────────────────────────
  {
    id: 'es-unit-2-lesson-1',
    unitId: 'es-unit-2',
    order: 1,
    title: 'Los números 1–10',
    xpReward: 10,
    estimatedMinutes: 5,
    vocabulary: [
      {
        word: 'Uno',
        translation: 'Một',
        pronunciation: '/ˈu.no/',
        exampleSentence: 'Tengo un gato.',
        exampleTranslation: 'Tôi có một con mèo.',
      },
      {
        word: 'Dos',
        translation: 'Hai',
        pronunciation: '/dos/',
        exampleSentence: 'Ella tiene dos hermanas.',
        exampleTranslation: 'Cô ấy có hai người chị.',
      },
      {
        word: 'Tres',
        translation: 'Ba',
        pronunciation: '/tɾes/',
        exampleSentence: 'Hay tres libros.',
        exampleTranslation: 'Có ba quyển sách.',
      },
      {
        word: 'Cinco',
        translation: 'Năm',
        pronunciation: '/ˈθin.ko/',
        exampleSentence: 'Tengo cinco años.',
        exampleTranslation: 'Tôi năm tuổi.',
      },
      {
        word: 'Diez',
        translation: 'Mười',
        pronunciation: '/ˈdjeθ/',
        exampleSentence: 'Cuenta hasta diez.',
        exampleTranslation: 'Hãy đếm đến mười.',
      },
    ],
    activities: [
      {
        id: 'es-unit-2-lesson-1-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn đáp án đúng:',
        question: '"Tres" có nghĩa là số mấy?',
        options: ['1', '2', '3', '5'],
        correctIndex: 2,
      } satisfies MultipleChoiceActivity,
      {
        id: 'es-unit-2-lesson-1-act-2',
        type: 'vocabulary_match',
        instruction: 'Nối số tiếng Tây Ban Nha với số tương ứng:',
        pairs: [
          { word: 'Uno', match: '1' },
          { word: 'Dos', match: '2' },
          { word: 'Cinco', match: '5' },
          { word: 'Diez', match: '10' },
        ],
      } satisfies VocabularyMatchActivity,
      {
        id: 'es-unit-2-lesson-1-act-3',
        type: 'ai_conversation',
        instruction: 'Đếm số với AI teacher bằng tiếng Tây Ban Nha:',
        scenario: 'Hãy đếm từ 1 đến 10 bằng tiếng Tây Ban Nha cùng AI teacher.',
        suggestedPhrases: ['Uno, dos, tres...', '¿Cómo se dice 7?', '¡Contemos juntos!'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly Spanish teacher speaking to a Vietnamese learner. ' +
      'The student just learned Spanish numbers: uno, dos, tres, cinco, diez. ' +
      'Your goal: help them count from 1 to 10 in Spanish. ' +
      'Count together with the student. Speak in Spanish. Switch to Vietnamese to clarify.',
  },

  // ── es-unit-2 / lesson-2 ───────────────────────────────────────────────
  {
    id: 'es-unit-2-lesson-2',
    unitId: 'es-unit-2',
    order: 2,
    title: 'Los colores',
    xpReward: 20,
    estimatedMinutes: 10,
    vocabulary: [
      {
        word: 'Rojo',
        translation: 'Màu đỏ',
        pronunciation: '/ˈro.xo/',
        exampleSentence: 'La manzana es roja.',
        exampleTranslation: 'Quả táo màu đỏ.',
      },
      {
        word: 'Azul',
        translation: 'Màu xanh dương',
        pronunciation: '/aˈθul/',
        exampleSentence: 'El cielo es azul.',
        exampleTranslation: 'Bầu trời màu xanh dương.',
      },
      {
        word: 'Verde',
        translation: 'Màu xanh lá',
        pronunciation: '/ˈbeɾ.ðe/',
        exampleSentence: 'El árbol es verde.',
        exampleTranslation: 'Cái cây màu xanh lá.',
      },
      {
        word: 'Amarillo',
        translation: 'Màu vàng',
        pronunciation: '/a.maˈɾi.ʎo/',
        exampleSentence: 'El sol es amarillo.',
        exampleTranslation: 'Mặt trời màu vàng.',
      },
    ],
    activities: [
      {
        id: 'es-unit-2-lesson-2-act-1',
        type: 'multiple_choice',
        instruction: 'Chọn nghĩa đúng:',
        question: '"Azul" có nghĩa là màu gì?',
        options: ['Đỏ', 'Vàng', 'Xanh dương', 'Xanh lá'],
        correctIndex: 2,
      } satisfies MultipleChoiceActivity,
      {
        id: 'es-unit-2-lesson-2-act-2',
        type: 'translation',
        instruction: 'Dịch sang tiếng Tây Ban Nha:',
        sourceText: 'Bầu trời màu xanh dương.',
        targetText: 'El cielo es azul.',
        acceptedVariants: ['El cielo es azul.', 'El cielo es azul', 'el cielo es azul'],
      } satisfies TranslationActivity,
      {
        id: 'es-unit-2-lesson-2-act-3',
        type: 'ai_conversation',
        instruction: 'Mô tả màu sắc với AI teacher bằng tiếng Tây Ban Nha:',
        scenario: 'Hãy mô tả màu sắc của các đồ vật xung quanh bạn bằng tiếng Tây Ban Nha.',
        suggestedPhrases: ['Es... rojo.', '¿De qué color es...?', 'Mi color favorito es...'],
      } satisfies AiConversationActivity,
    ],
    aiTeacherPrompt:
      'You are Lumi, a friendly Spanish teacher speaking to a Vietnamese learner. ' +
      'The student just learned Spanish colors: rojo, azul, verde, amarillo. ' +
      'Your goal: help them describe colors of everyday objects in Spanish. ' +
      'Ask about colors of things around them. Speak in Spanish. Switch to Vietnamese to clarify.',
  },
];

// ─── Helper functions ───────────────────────────────────────────────────────

export function getLessonsByUnit(unitId: string): Lesson[] {
  return lessons
    .filter((l) => l.unitId === unitId)
    .sort((a, b) => a.order - b.order);
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return lessons.find((l) => l.id === lessonId);
}
