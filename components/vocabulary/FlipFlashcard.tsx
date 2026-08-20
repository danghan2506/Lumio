import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import type { VocabularyWithProgress } from '@/types/vocabulary';

export interface FlipFlashcardProps {
  item: VocabularyWithProgress;
  isFlipped: boolean;
  onFlip: () => void;
}

export const FlipFlashcard: React.FC<FlipFlashcardProps> = ({
  item,
  isFlipped,
  onFlip,
}) => {
  const rotateY = useSharedValue(0);

  useEffect(() => {
    rotateY.value = withSpring(isFlipped ? 180 : 0, {
      stiffness: 120,
      damping: 18,
    });
  }, [isFlipped, rotateY]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spin = `${rotateY.value}deg`;
    return {
      transform: [{ perspective: 1000 }, { rotateY: spin }],
      backfaceVisibility: 'hidden',
      opacity: interpolate(rotateY.value, [89, 90], [1, 0]),
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const spin = `${rotateY.value + 180}deg`;
    return {
      transform: [{ perspective: 1000 }, { rotateY: spin }],
      backfaceVisibility: 'hidden',
      opacity: interpolate(rotateY.value, [89, 90], [0, 1]),
    };
  });

  return (
    <Pressable
      testID="flip-flashcard-pressable"
      onPress={onFlip}
      className="w-full aspect-[4/5] max-h-[420px] justify-center items-center my-4"
    >
      {/* FRONT FACE */}
      <Animated.View
        style={[
          styles.card,
          frontAnimatedStyle,
          { backgroundColor: colors.deepIndigo, borderColor: 'rgba(255,255,255,0.15)' },
        ]}
        className="w-full h-full rounded-3xl p-6 border shadow-2xl justify-between items-center"
      >
        <View className="w-full flex-row justify-between items-center">
          <View className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
            <Text
              style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist }}
              className="text-xs"
            >
              {item.status === 'unseen' ? 'New Word' : 'Review Word'}
            </Text>
          </View>
          <Ionicons name="eye-outline" size={20} color={colors.lavenderMist} />
        </View>

        <View className="items-center px-4">
          <Text
            style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
            className="text-4xl text-center mb-2"
          >
            {item.word}
          </Text>
          {Boolean(item.pronunciation) && (
            <Text
              style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.daylightAmber }}
              className="text-base text-center"
            >
              {item.pronunciation}
            </Text>
          )}
        </View>

        <View className="flex-row items-center bg-white/10 px-4 py-2 rounded-full">
          <Ionicons name="refresh" size={14} color={colors.lavenderMist} className="mr-1.5" />
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
            className="text-xs ml-1.5"
          >
            Tap card to reveal answer
          </Text>
        </View>
      </Animated.View>

      {/* BACK FACE */}
      <Animated.View
        style={[
          styles.card,
          backAnimatedStyle,
          { backgroundColor: '#30265B', borderColor: 'rgba(255,255,255,0.2)' },
        ]}
        className="w-full h-full rounded-3xl p-6 border shadow-2xl justify-between items-center absolute"
      >
        <View className="w-full flex-row justify-between items-center">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.daylightAmber }}
            className="text-xs"
          >
            Translation & Context
          </Text>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.mint} />
        </View>

        <View className="items-center px-4 w-full">
          <Text
            style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
            className="text-2xl text-center mb-1"
          >
            {item.word}
          </Text>
          <Text
            style={{ fontFamily: 'Fredoka_700Bold', color: colors.mint }}
            className="text-3xl text-center mb-4"
          >
            {item.translation}
          </Text>

          {Boolean(item.exampleSentence) && (
            <View className="bg-black/30 rounded-2xl p-3.5 border border-white/10 w-full">
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.cream }}
                className="text-xs leading-relaxed text-center"
              >
                &ldquo;{item.exampleSentence}&rdquo;
              </Text>
              {Boolean(item.exampleTranslation) && (
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_400Regular', color: colors.lavenderMist }}
                  className="text-[11px] text-center mt-1.5 italic"
                >
                  {item.exampleTranslation}
                </Text>
              )}
            </View>
          )}
        </View>

        <View className="flex-row items-center">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist }}
            className="text-xs"
          >
            Rate your recall below
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
  },
});
