import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DailyPlanItem, PlanItemType } from '@/types/home';

export interface TodaysPlanListProps {
  items: DailyPlanItem[];
  onItemPress?: (item: DailyPlanItem) => void;
  onViewAll?: () => void;
}

export const TodaysPlanList: React.FC<TodaysPlanListProps> = ({
  items,
  onItemPress,
  onViewAll,
}) => {
  const renderItemIcon = (type: PlanItemType) => {
    switch (type) {
      case 'lesson':
        return <Ionicons name="book-outline" size={22} color="#4B3FA8" />;
      case 'ai_conversation':
        return <Ionicons name="headset-outline" size={22} color="#FF6B57" />;
      case 'vocabulary':
        return <Ionicons name="chatbox-ellipses-outline" size={22} color="#35D0A0" />;
      default:
        return <Ionicons name="book-outline" size={22} color="#4B3FA8" />;
    }
  };

  const renderStatusIndicator = (completed: boolean, active: boolean) => {
    if (completed) {
      return (
        <View className="w-7 h-7 rounded-full bg-mint items-center justify-center">
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      );
    }
    if (active) {
      return (
        <View className="w-7 h-7 rounded-full border-2 border-lumio-coral items-center justify-center bg-lumio-coral/10">
          <Ionicons name="pulse" size={14} color="#FF6B57" />
        </View>
      );
    }
    return <View className="w-7 h-7 rounded-full border border-slate-300" />;
  };

  return (
    <View className="mx-6 my-3">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-deep-indigo font-display text-lg">Today&apos;s plan</Text>
        {onViewAll && (
          <Pressable onPress={onViewAll} className="active:opacity-70">
            <Text className="text-canvas-dark-end font-sans text-sm">View all</Text>
          </Pressable>
        )}
      </View>

      {/* Plan Items */}
      <View className="space-y-3">
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onItemPress?.(item)}
            className="bg-white rounded-2xl p-4 border border-lavender-mist flex-row items-center justify-between active:opacity-90 shadow-sm mb-3"
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
            })}
          >
            {/* Left Icon & Text */}
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-12 h-12 rounded-xl bg-lavender-mist/50 items-center justify-center mr-3">
                {renderItemIcon(item.type)}
              </View>
              <View className="flex-1">
                <Text className="text-deep-indigo font-display text-base mb-0.5">
                  {item.title}
                </Text>
                <Text className="text-slate font-sans text-xs" numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
            </View>

            {/* Status Indicator */}
            {renderStatusIndicator(item.completed, item.active)}
          </Pressable>
        ))}
      </View>
    </View>
  );
};
