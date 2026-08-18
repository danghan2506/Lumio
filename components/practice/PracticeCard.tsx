import React from 'react';
import { ActivityCard } from '@/components/ui/ActivityCard';

export interface PracticeCardProps {
  lessonNumber: number;
  title: string;
  activitiesCount: number;
  xpReward: number;
  estimatedMinutes: number;
  status: 'completed' | 'in_progress' | 'not_started';
  activityType?: 'multiple_choice' | 'translation';
  onPress: () => void;
  testID?: string;
}

export function PracticeCard({
  lessonNumber,
  title,
  activitiesCount,
  xpReward,
  estimatedMinutes,
  status,
  activityType = 'multiple_choice',
  onPress,
  testID = 'practice-card',
}: PracticeCardProps) {
  const typeLabel = activityType === 'translation' ? 'Ghép câu dịch' : 'Trắc nghiệm';

  return (
    <ActivityCard
      orderNumber={lessonNumber}
      typeLabel={typeLabel}
      title={title}
      questionsCount={activitiesCount}
      xpReward={xpReward}
      estimatedMinutes={estimatedMinutes}
      status={status}
      onPress={onPress}
      testID={testID}
    />
  );
}
