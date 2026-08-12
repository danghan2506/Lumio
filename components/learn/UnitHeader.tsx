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
  onBackPress?: () => void;
  onBookmarkPress?: () => void;
}

export function UnitHeader({
  unitTitle,
  unitNumber,
  completedCount,
  totalCount,
  onBackPress,
  onBookmarkPress,
}: UnitHeaderProps) {
  const subtitle = `Unit ${unitNumber} • ${completedCount} / ${totalCount} lessons`;

  return (
    <View className="mb-4">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity
          onPress={onBackPress}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-800/40"
          activeOpacity={0.7}
          testID="unit-header-back-button"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </TouchableOpacity>

        <View className="items-center flex-1 mx-2">
          <Text
            style={{ fontFamily: 'Fredoka_700Bold' }}
            className="text-lg text-cream text-center"
            numberOfLines={1}
          >
            {unitTitle}
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
            className="text-xs text-lavender-mist/70"
          >
            {subtitle}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onBookmarkPress}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-800/40"
          activeOpacity={0.7}
          testID="unit-header-bookmark-button"
          accessibilityRole="button"
          accessibilityLabel="Bookmark unit"
        >
          <Ionicons name="bookmark-outline" size={20} color={colors.daylightAmber} />
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
