import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import type { VocabularyWithProgress } from '@/types/vocabulary';

export interface VocabularyListItemProps {
  item: VocabularyWithProgress;
  onPress?: () => void;
}

export const VocabularyListItem: React.FC<VocabularyListItemProps> = ({ item, onPress }) => {
  const renderStatusBadge = () => {
    switch (item.status) {
      case 'mastered':
        return (
          <View className="px-2 py-0.5 rounded-full bg-mint/15 border border-mint/30">
            <Text className="text-mint font-sans-bold text-[11px]">Mastered</Text>
          </View>
        );
      case 'learning':
        return (
          <View className="px-2 py-0.5 rounded-full bg-daylight-amber/15 border border-daylight-amber/30">
            <Text className="text-daylight-amber font-sans-bold text-[11px]">Learning</Text>
          </View>
        );
      default:
        return (
          <View className="px-2 py-0.5 rounded-full bg-slate/10 border border-slate/20">
            <Text className="text-slate font-sans-medium text-[11px]">Unseen</Text>
          </View>
        );
    }
  };

  return (
    <Pressable
      testID={`vocab-item-${item.id}`}
      onPress={onPress}
      disabled={!onPress}
      className="bg-white rounded-2xl px-4 py-3 border border-lavender-mist mb-2.5 shadow-sm flex-row items-center justify-between active:bg-lavender-mist/20"
    >
      <View className="flex-row items-baseline flex-1 mr-2">
        <Text
          style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
          className="text-base"
        >
          {item.word}
        </Text>
        {Boolean(item.pronunciation) && (
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
            className="text-xs ml-2"
          >
            {item.pronunciation}
          </Text>
        )}
      </View>

      <View className="flex-row items-center">
        {renderStatusBadge()}
        <Ionicons
          name="chevron-forward"
          size={14}
          color={colors.slate}
          style={{ opacity: 0.6, marginLeft: 6 }}
        />
      </View>
    </Pressable>
  );
};
