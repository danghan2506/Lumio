import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { images } from '@/constants/images';
import { colors } from '@/theme/colors';

export interface UnitHeaderProps {
  unitTitle: string;
  unitNumber: number;
  completedCount: number;
  totalCount: number;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  onPrevPress?: () => void;
  onNextPress?: () => void;
  onTitlePress?: () => void;
  // Backward compatibility with existing callers
  onBackPress?: () => void;
  onBookmarkPress?: () => void;
}

export function UnitHeader({
  unitTitle,
  unitNumber,
  completedCount,
  totalCount,
  canGoPrev = true,
  canGoNext = true,
  onPrevPress,
  onNextPress,
  onTitlePress,
  onBackPress,
  onBookmarkPress,
}: UnitHeaderProps) {
  const subtitle = `Unit ${unitNumber} • ${completedCount} / ${totalCount} lessons`;
  const handlePrev = onPrevPress ?? onBackPress;
  const handleNext = onNextPress ?? onBookmarkPress;

  return (
    <View className="mb-4">
      {/* Top Bar Navigation */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity
          onPress={handlePrev}
          disabled={!canGoPrev}
          className={`w-11 h-11 items-center justify-center rounded-full bg-deep-indigo/5 border border-deep-indigo/10 active:opacity-70 ${!canGoPrev ? 'opacity-30' : ''}`}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="unit-header-prev"
          accessibilityRole="button"
          accessibilityLabel="Previous unit"
          accessibilityState={{ disabled: !canGoPrev }}
        >
          <View testID="unit-header-back-button" accessible={false}>
            <Ionicons
              name="chevron-back"
              size={20}
              color={canGoPrev ? colors.deepIndigo : colors.slate}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onTitlePress}
          disabled={!onTitlePress}
          testID="unit-header-title"
          accessibilityRole="button"
          accessibilityLabel="Select unit"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          className="items-center flex-1 mx-2 py-1"
        >
          <View className="flex-row items-center justify-center">
            <Text
              className="text-lg font-display text-deep-indigo text-center mr-1"
              numberOfLines={1}
            >
              {unitTitle}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.deepIndigo} />
          </View>
          <Text className="text-xs font-sans text-slate mt-0.5">
            {subtitle}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!canGoNext}
          className={`w-11 h-11 items-center justify-center rounded-full bg-deep-indigo/5 border border-deep-indigo/10 active:opacity-70 ${!canGoNext ? 'opacity-30' : ''}`}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="unit-header-next"
          accessibilityRole="button"
          accessibilityLabel="Next unit"
          accessibilityState={{ disabled: !canGoNext }}
        >
          <View testID="unit-header-bookmark-button" accessible={false}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={canGoNext ? colors.deepIndigo : colors.slate}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Unit Guidebook Card: Compact, Educational, Safe Mascot Emblem */}
      <View className="mx-4 mt-2 p-4 rounded-3xl bg-warm-ivory border border-deep-indigo/8 flex-row items-center justify-between shadow-sm">
        <View className="flex-1 mr-3">
          <View className="bg-lumio-coral/15 self-start px-2.5 py-0.5 rounded-full mb-1.5">
            <Text className="text-[10px] font-sans-bold text-lumio-coral uppercase tracking-wider">
              Unit {unitNumber} Guidebook
            </Text>
          </View>
          <Text
            className="text-base font-display text-deep-indigo mb-0.5"
            numberOfLines={1}
          >
            Core Grammar & Vocabulary
          </Text>
          <Text
            className="text-xs font-sans text-slate leading-4"
            numberOfLines={2}
          >
            Review essential vocabulary, grammar, and key phrases.
          </Text>
        </View>

        {/* Mascot Safe Frame: Circular emblem with safe scale */}
        <View className="w-16 h-16 rounded-full bg-[#1E1738] border-2 border-daylight-amber/40 items-center justify-center overflow-hidden shadow-sm">
          <Image
            source={images.lumiTutor}
            className="w-12 h-12"
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}
