import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import type { VocabularyWithProgress } from '@/types/vocabulary';

export interface WordDetailBottomSheetProps {
  visible: boolean;
  item: VocabularyWithProgress | null;
  onClose: () => void;
  onPractice: (wordId: string) => void;
}

export const WordDetailBottomSheet: React.FC<WordDetailBottomSheetProps> = ({
  visible,
  item,
  onClose,
  onPractice,
}) => {
  if (!item) return null;

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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/45">
        <Pressable
          testID="word-detail-backdrop"
          className="flex-1"
          onPress={onClose}
        />

        <View className="bg-white rounded-t-3xl px-6 pt-3 pb-8 max-h-[85%] border-t border-lavender-mist shadow-2xl">
          {/* Drag Handle Bar */}
          <View className="w-12 h-1.5 rounded-full bg-slate/20 self-center mb-3" />

          {/* Header Row */}
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-3">
              <Text
                style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
                className="text-2xl"
              >
                {item.word}
              </Text>
              {Boolean(item.pronunciation) && (
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
                  className="text-sm mt-0.5"
                >
                  {item.pronunciation}
                </Text>
              )}
            </View>

            <Pressable
              testID="close-detail-btn"
              onPress={onClose}
              className="w-9 h-9 rounded-full bg-slate/10 items-center justify-center active:opacity-70"
            >
              <Ionicons name="close" size={20} color={colors.deepIndigo} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
            {/* Meaning & Status Row */}
            <View className="flex-row items-center justify-between py-2 border-b border-lavender-mist/50 mb-3">
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.canvasDarkEnd }}
                className="text-base flex-1 mr-2"
              >
                {item.translation}
              </Text>
              {renderStatusBadge()}
            </View>

            {/* Example Sentence Box */}
            {Boolean(item.exampleSentence) && (
              <View className="bg-cream rounded-2xl p-4 border border-lavender-mist/70 mb-3">
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.slate }}
                  className="text-[11px] uppercase tracking-wider mb-1"
                >
                  Context Example
                </Text>
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.deepIndigo }}
                  className="text-sm leading-relaxed"
                >
                  {item.exampleSentence}
                </Text>
                {Boolean(item.exampleTranslation) && (
                  <Text
                    style={{ fontFamily: 'PlusJakartaSans_400Regular', color: colors.slate }}
                    className="text-xs mt-1.5 italic"
                  >
                    {item.exampleTranslation}
                  </Text>
                )}
              </View>
            )}

            {/* SRS Retention Info */}
            <View className="flex-row items-center justify-between bg-canvas-dark-end/5 rounded-xl p-3">
              <View className="items-center flex-1">
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.deepIndigo }}
                  className="text-xs"
                >
                  {item.intervalDays}d interval
                </Text>
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
                  className="text-[10px]"
                >
                  SRS Spacing
                </Text>
              </View>
              <View className="w-[1px] h-6 bg-lavender-mist" />
              <View className="items-center flex-1">
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.deepIndigo }}
                  className="text-xs"
                >
                  {item.correctCount} correct
                </Text>
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
                  className="text-[10px]"
                >
                  Retention Stats
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action CTA */}
          <Pressable
            testID="practice-word-btn"
            onPress={() => onPractice(item.id)}
            className="bg-lumio-coral py-3.5 rounded-2xl items-center flex-row justify-center shadow-md active:opacity-90"
          >
            <Ionicons name="play" size={16} color={colors.cream} className="mr-2" />
            <Text
              style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
              className="text-sm ml-2"
            >
              Practice This Word
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
