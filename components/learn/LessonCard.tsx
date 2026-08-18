import React from 'react';
import { ActivityCard } from '@/components/ui/ActivityCard';

export interface LessonCardProps {
  lessonNumber: number;
  title: string;
  status: 'completed' | 'in_progress' | 'not_started';
  xpReward?: number;
  estimatedMinutes?: number;
  onPress: () => void;
}

export function LessonCard({
  lessonNumber,
  title,
  status,
  xpReward,
  estimatedMinutes,
  onPress,
}: LessonCardProps) {
  return (
    <ActivityCard
      orderNumber={lessonNumber}
      title={title}
      status={status}
      xpReward={xpReward}
      estimatedMinutes={estimatedMinutes}
      onPress={onPress}
      testID="lesson-card"
    />
  );
}
