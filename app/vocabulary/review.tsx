import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVocabularyData } from '@/hooks/useVocabularyData';
import { FlipFlashcard } from '@/components/vocabulary/FlipFlashcard';
import { ReviewExitConfirmDialog } from '@/components/vocabulary/ReviewExitConfirmDialog';
import { ReviewCompletionModal } from '@/components/vocabulary/ReviewCompletionModal';
import { colors } from '@/theme/colors';
import type { SrsGrade } from '@/lib/srs';
import type { VocabularyWithProgress } from '@/types/vocabulary';

const SESSION_BATCH_SIZE = 15;

export default function VocabularyReviewScreen() {
  const router = useRouter();
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
      const batch = source.slice(0, SESSION_BATCH_SIZE);
      setSessionQueue(batch);
      setSessionStats((prev) => ({ ...prev, totalCards: batch.length }));
    }
  }, [loading, dueWords, vocabularies, sessionQueue.length]);

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
  const progressPercent =
    sessionQueue.length > 0 ? ((currentIndex + 1) / sessionQueue.length) * 100 : 0;

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

        if (currentIndex + 1 < sessionQueue.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setShowCompletionModal(true);
        }
      } catch (err) {
        console.error('Error recording review:', err);
      }
    },
    [currentCard, currentIndex, sessionQueue.length, recordReview]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }} edges={['top', 'bottom']}>
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
        {currentCard ? (
          <FlipFlashcard
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

      {/* 4 SM-2 Rating Buttons */}
      <View className="px-6 pb-6 pt-2">
        {isFlipped ? (
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
    </SafeAreaView>
  );
}
