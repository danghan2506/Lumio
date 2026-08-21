import React from 'react';
import { View, Text, Pressable } from 'react-native';
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
          <View className="px-2.5 py-1 rounded-full bg-mint/15 border border-mint/30">
            <Text className="text-mint font-sans-bold text-xs">Mastered</Text>
          </View>
        );
      case 'learning':
        return (
          <View className="px-2.5 py-1 rounded-full bg-daylight-amber/15 border border-daylight-amber/30">
            <Text className="text-daylight-amber font-sans-bold text-xs">Learning</Text>
          </View>
        );
      default:
        return (
          <View className="px-2.5 py-1 rounded-full bg-slate/10 border border-slate/20">
            <Text className="text-slate font-sans-medium text-xs">Unseen</Text>
          </View>
        );
    }
  };

  return (
    <Pressable
      testID={`vocab-item-${item.id}`}
      onPress={onPress}
      disabled={!onPress}
      className="bg-white rounded-2xl p-4 border border-lavender-mist mb-3 shadow-sm active:opacity-90 active:scale-[0.99]"
    >
      {/* Top Header: Word + IPA + Status */}
      <View className="flex-row items-start justify-between mb-1.5">
        <View className="flex-1 mr-2">
          <Text
            style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
            className="text-lg"
          >
            {item.word}
          </Text>
          {Boolean(item.pronunciation) && (
            <Text
              style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
              className="text-xs mt-0.5"
            >
              {item.pronunciation}
            </Text>
          )}
        </View>
        {renderStatusBadge()}
      </View>

      {/* Translation */}
      <Text
        style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.canvasDarkEnd }}
        className="text-sm mb-2"
      >
        {item.translation}
      </Text>

      {/* Example Sentence */}
      {Boolean(item.exampleSentence) && (
        <View className="bg-cream rounded-xl p-2.5 border border-lavender-mist/60">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.deepIndigo }}
            className="text-xs leading-relaxed"
          >
            {item.exampleSentence}
          </Text>
          {Boolean(item.exampleTranslation) && (
            <Text
              style={{ fontFamily: 'PlusJakartaSans_400Regular', color: colors.slate }}
              className="text-[11px] mt-1 italic"
            >
              {item.exampleTranslation}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
};
