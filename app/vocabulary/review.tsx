import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, BackHandler, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVocabularyData } from '@/hooks/useVocabularyData';
import { FlipFlashcard } from '@/components/vocabulary/FlipFlashcard';
import { ReviewExitConfirmDialog } from '@/components/vocabulary/ReviewExitConfirmDialog';
import { ReviewCompletionModal } from '@/components/vocabulary/ReviewCompletionModal';
import { colors } from '@/theme/colors';
import { images } from '@/constants/images';
import type { SrsGrade } from '@/lib/srs';
import type { VocabularyWithProgress } from '@/types/vocabulary';

const SESSION_BATCH_SIZE = 15;

export default function VocabularyReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ wordId?: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 44);
  const bottomInset = Math.max(insets.bottom, 16);

  const { dueWords, vocabularies, recordReview, loading } = useVocabularyData();

  const [sessionQueue, setSessionQueue] = useState<VocabularyWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const [sessionStats, setSessionStats] = useState({
    xpEarned: 0,
    totalCards: 0,
    correctCount: 0,
    graduatedCount: 0,
  });

  // Initialize session queue
  useEffect(() => {
    if (!loading && sessionQueue.length === 0) {
      const source = dueWords.length > 0 ? dueWords : vocabularies;
      if (params.wordId) {
        const target = vocabularies.find((v) => v.id === params.wordId);
        if (target) {
          const others = source.filter((v) => v.id !== params.wordId);
          const batch = [target, ...others].slice(0, SESSION_BATCH_SIZE);
          setSessionQueue(batch);
          setSessionStats((prev) => ({ ...prev, totalCards: batch.length }));
          return;
        }
      }
      const batch = source.slice(0, SESSION_BATCH_SIZE);
      setSessionQueue(batch);
      setSessionStats((prev) => ({ ...prev, totalCards: batch.length }));
    }
  }, [loading, dueWords, vocabularies, sessionQueue.length, params.wordId]);

  // Hardware back button handler for Android
  useEffect(() => {
    const onBackPress = () => {
      setShowExitDialog(true);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const currentCard = sessionQueue[currentIndex];
  const isSessionComplete = sessionQueue.length > 0 && currentIndex >= sessionQueue.length;
  const progressPercent =
    sessionQueue.length > 0
      ? Math.min(100, (Math.min(currentIndex + 1, sessionQueue.length) / sessionQueue.length) * 100)
      : 0;

  const handleGradePress = useCallback(
    async (grade: SrsGrade) => {
      if (!currentCard) return;

      try {
        const result = await recordReview({
          vocabularyId: currentCard.id,
          lessonId: currentCard.lessonId,
          grade,
        });

        setSessionStats((prev) => ({
          ...prev,
          xpEarned: prev.xpEarned + result.xpEarned,
          correctCount: prev.correctCount + (result.isCorrect ? 1 : 0),
          graduatedCount: prev.graduatedCount + (result.nextStatus === 'mastered' ? 1 : 0),
        }));

        setIsFlipped(false);

        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);

        if (nextIdx >= sessionQueue.length) {
          setShowCompletionModal(true);
        }
      } catch (err) {
        console.error('Error recording review:', err);
      }
    },
    [currentCard, currentIndex, sessionQueue.length, recordReview]
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.deepIndigo,
        paddingTop: topInset,
        paddingBottom: bottomInset,
      }}
    >
      {/* Top Header Bar */}
      <View className="px-6 py-3 flex-row items-center justify-between">
        <Pressable
          testID="review-back-btn"
          onPress={() => setShowExitDialog(true)}
          className="w-10 h-10 rounded-full bg-white/10 items-center justify-center active:opacity-70"
        >
          <Ionicons name="close" size={22} color={colors.cream} />
        </Pressable>

        <View className="flex-1 mx-4">
          <View className="h-2.5 bg-white/15 rounded-full overflow-hidden">
            <View
              style={{ width: `${progressPercent}%`, backgroundColor: colors.lumioCoral }}
              className="h-full rounded-full"
            />
          </View>
        </View>

        <View className="px-3 py-1 rounded-full bg-daylight-amber/20 border border-daylight-amber/30">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.daylightAmber }}
            className="text-xs"
          >
            +{sessionStats.xpEarned} XP
          </Text>
        </View>
      </View>

      {/* Main Flashcard View */}
      <View className="flex-1 px-6 justify-center items-center">
        {isSessionComplete ? (
          <View className="items-center justify-center px-6">
            <View className="w-24 h-24 mb-4 items-center justify-center">
              <Image
                source={images.lumiCelebration}
                style={{ width: 96, height: 96 }}
                resizeMode="contain"
              />
            </View>
            <Text
              style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
              className="text-2xl text-center mb-1.5"
            >
              Session Complete! 🎉
            </Text>
            <Text
              style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
              className="text-sm text-center"
            >
              You’ve reviewed all cards in this batch!
            </Text>
          </View>
        ) : currentCard ? (
          <FlipFlashcard
            key={currentCard.id}
            item={currentCard}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped((prev) => !prev)}
          />
        ) : (
          <View className="items-center justify-center">
            <Text
              style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
              className="text-xl text-center"
            >
              No cards to review!
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Actions */}
      <View className="px-6 pb-6 pt-2">
        {isSessionComplete ? (
          <Pressable
            testID="session-done-btn"
            onPress={() => router.back()}
            className="w-full py-4 rounded-2xl bg-lumio-coral items-center justify-center shadow-lg active:opacity-90 active:translate-y-0.5"
          >
            <Text
              style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
              className="text-base"
            >
              Back to Vocab Vault
            </Text>
          </Pressable>
        ) : isFlipped ? (
          <View className="flex-row items-center justify-between space-x-2">
            {/* Again (Grade 1) */}
            <Pressable
              testID="grade-1-btn"
              onPress={() => void handleGradePress(1)}
              className="flex-1 py-3.5 rounded-2xl items-center bg-white/10 border border-white/20 active:opacity-80 active:translate-y-0.5"
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.lumioCoral }}
                className="text-xs"
              >
                Again
              </Text>
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
                className="text-[10px] mt-0.5"
              >
                1d • +1 XP
              </Text>
            </Pressable>

            {/* Hard (Grade 2) */}
            <Pressable
              testID="grade-2-btn"
              onPress={() => void handleGradePress(2)}
              className="flex-1 py-3.5 rounded-2xl items-center bg-white/10 border border-white/20 active:opacity-80 active:translate-y-0.5"
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.daylightAmber }}
                className="text-xs"
              >
                Hard
              </Text>
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
                className="text-[10px] mt-0.5"
              >
                +2 XP
              </Text>
            </Pressable>

            {/* Good (Grade 3) */}
            <Pressable
              testID="grade-3-btn"
              onPress={() => void handleGradePress(3)}
              className="flex-1 py-3.5 rounded-2xl items-center bg-white/15 border border-lavender-mist/40 active:opacity-80 active:translate-y-0.5"
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
                className="text-xs"
              >
                Good
              </Text>
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
                className="text-[10px] mt-0.5"
              >
                +3 XP
              </Text>
            </Pressable>

            {/* Easy (Grade 4) */}
            <Pressable
              testID="grade-4-btn"
              onPress={() => void handleGradePress(4)}
              className="flex-1 py-3.5 rounded-2xl items-center bg-mint active:opacity-90 active:translate-y-0.5 shadow-md"
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.deepIndigo }}
                className="text-xs"
              >
                Easy
              </Text>
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.deepIndigo }}
                className="text-[10px] mt-0.5"
              >
                +5 XP
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            testID="flip-hint-btn"
            onPress={() => setIsFlipped(true)}
            className="w-full py-4 rounded-2xl bg-white/15 items-center justify-center border border-white/20 active:opacity-80 active:translate-y-0.5"
          >
            <Text
              style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
              className="text-sm"
            >
              Show Answer
            </Text>
          </Pressable>
        )}
      </View>

      {/* Exit Confirmation Dialog */}
      <ReviewExitConfirmDialog
        visible={showExitDialog}
        onResume={() => setShowExitDialog(false)}
        onExit={() => {
          setShowExitDialog(false);
          router.back();
        }}
      />

      {/* Session Completion Celebration Modal */}
      <ReviewCompletionModal
        visible={showCompletionModal}
        xpEarned={sessionStats.xpEarned}
        totalCards={sessionStats.totalCards}
        correctCount={sessionStats.correctCount}
        graduatedCount={sessionStats.graduatedCount}
        onClose={() => {
          setShowCompletionModal(false);
          router.back();
        }}
      />
    </View>
  );
}
