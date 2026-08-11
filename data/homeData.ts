import { HomeData } from '@/types/home';

export const HOME_DATA: HomeData = {
  streak: 12,
  dailyGoal: {
    currentXp: 15,
    targetXp: 20,
  },
  todaysPlan: [
    {
      id: 'plan-1',
      type: 'lesson',
      title: 'Lesson: At the café',
      subtitle: 'Order coffee and pastries',
      completed: true,
      active: false,
      lessonId: 'cafe-1',
    },
    {
      id: 'plan-2',
      type: 'ai_conversation',
      title: 'AI Conversation: Talk about your day',
      subtitle: '3-min voice chat with Lumio',
      completed: false,
      active: true,
    },
    {
      id: 'plan-3',
      type: 'vocabulary',
      title: 'New words: 10 words review',
      subtitle: 'Flashcard practice',
      completed: false,
      active: false,
    },
  ],
};
