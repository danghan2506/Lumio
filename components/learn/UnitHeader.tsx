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
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity
          onPress={handlePrev}
          disabled={!canGoPrev}
          className={`w-11 h-11 items-center justify-center rounded-full bg-slate-800/40 ${!canGoPrev ? 'opacity-30' : ''}`}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="unit-header-prev"
          accessibilityRole="button"
          accessibilityLabel="Previous unit"
          accessibilityState={{ disabled: !canGoPrev }}
        >
          <View testID="unit-header-back-button" accessible={false}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={canGoPrev ? colors.cream : colors.lavenderMist}
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
              style={{ fontFamily: 'Fredoka_700Bold' }}
              className="text-lg text-cream text-center mr-1"
              numberOfLines={1}
            >
              {unitTitle}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.cream} />
          </View>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
            className="text-xs text-lavender-mist/70"
          >
            {subtitle}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!canGoNext}
          className={`w-11 h-11 items-center justify-center rounded-full bg-slate-800/40 ${!canGoNext ? 'opacity-30' : ''}`}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="unit-header-next"
          accessibilityRole="button"
          accessibilityLabel="Next unit"
          accessibilityState={{ disabled: !canGoNext }}
        >
          <View testID="unit-header-bookmark-button" accessible={false}>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={canGoNext ? colors.cream : colors.lavenderMist}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Hero Mascot Banner */}
      <View className="mx-4 mt-3 overflow-hidden rounded-3xl bg-canvas-dark-end/30 border border-slate-700/40 items-center justify-center py-4 px-6 relative">
        <Image
          source={images.lumiTutor}
          style={{ width: 140, height: 140, resizeMode: 'contain' }}
        />
      </View>
    </View>
  );
}
