import React from 'react';
import { ActivityCard } from '@/components/ui/ActivityCard';

export interface PracticeCardProps {
  lessonNumber: number;
  title: string;
  activitiesCount: number;
  xpReward: number;
  estimatedMinutes: number;
  status: 'completed' | 'in_progress' | 'not_started';
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
  onPress,
  testID = 'practice-card',
}: PracticeCardProps) {
  return (
    <ActivityCard
      orderNumber={lessonNumber}
      typeLabel="Trắc nghiệm"
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
