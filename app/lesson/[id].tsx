import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { useLessonAudioDetails } from '@/hooks/useLessonAudioDetails';
import { useAuth } from '@/hooks/useAuth';
import { useStreamLessonCall } from '@/hooks/useStreamLessonCall';
import { useStreamLessonAgent } from '@/hooks/useStreamLessonAgent';
import { useLiveCaptions } from '@/hooks/useLiveCaptions';
import { recordLessonProgress } from '@/lib/api';
import type { LessonCompleteEvent } from '@/types/stream';
import {
  LessonHeader,
  MascotStage,
  LessonCaptionsSlot,
  AudioControls,
  LessonSummaryModal,
} from '@/components/lesson';

const SUMMARY_DELAY_MS = 3000;
const AUDIO_DRAIN_MS = 6000;

export default function AudioLessonScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 44);
  const bottomInset = Math.max(insets.bottom, 16);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { lesson, language, loading, error } = useLessonAudioDetails(id || '');
  const { user, session } = useAuth();
  const [progressError, setProgressError] = useState<string | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');

  const handleLessonCompleteRef = useRef<((payload: LessonCompleteEvent) => void) | null>(null);
  const lastPayloadRef = useRef<LessonCompleteEvent | null>(null);
  const summaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teardownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear pending completion timers on unmount so a delayed modal/teardown
  // never fires after the user has already navigated away.
  useEffect(() => {
    return () => {
      if (summaryTimerRef.current !== null) {
        clearTimeout(summaryTimerRef.current);
        summaryTimerRef.current = null;
      }
      if (teardownTimerRef.current !== null) {
        clearTimeout(teardownTimerRef.current);
        teardownTimerRef.current = null;
      }
    };
  }, []);
  const completionProxy = useCallback((payload: LessonCompleteEvent) => {
    handleLessonCompleteRef.current?.(payload);
  }, []);

  const { isMuted, status, errorMessage, retry, toggleMute, leave, callType, callId, call } =
    useStreamLessonCall({
      lessonId: id || '',
      languageId: language?.id ?? '',
      displayName: user?.email ?? 'Learner',
      accessToken: session?.access_token ?? '',
      enabled: Boolean(user && session && lesson && language),
      onLessonComplete: completionProxy,
    });

  const { captionText, isActive: captionsActive } = useLiveCaptions({
    call,
    enabled: showCaptions,
  });

  const teacher = useStreamLessonAgent({
    lessonId: id || '',
    callType: callType ?? 'audio_room',
    callId: callId ?? `lesson-${id}-${user?.id ?? ''}`,
    displayName: user?.email ?? 'Learner',
    accessToken: session?.access_token ?? '',
    enabled: Boolean(status === 'joined' && callType && callId && user && session),
  });

  const handleLessonComplete = useCallback(
    async (payload: LessonCompleteEvent) => {
      setProgressError(null);
      lastPayloadRef.current = payload;

      // 1. Immediately mute mic to stop user audio intake (keeps the
      // pulsing "listening" UI alive while the farewell plays out).
      if (call) {
        void call.microphone.disable().catch(() => {});
      }

      // Clear any previously scheduled timers so a manual retry doesn't
      // stack duplicate modals/teardowns.
      if (summaryTimerRef.current !== null) {
        clearTimeout(summaryTimerRef.current);
      }
      if (teardownTimerRef.current !== null) {
        clearTimeout(teardownTimerRef.current);
      }

      // 2. Delay the summary modal so it never pops up mid-farewell. The
      // completion event fires at farewell turn-end + 2s; the extra delay
      // covers audio playout lag on the device.
      summaryTimerRef.current = setTimeout(() => {
        summaryTimerRef.current = null;
        setShowSummary(true);
      }, SUMMARY_DELAY_MS);

      // 3. Schedule clean call & agent teardown in parallel (non-blocking),
      // well after the 1-2 sentence farewell has finished playing.
      teardownTimerRef.current = setTimeout(() => {
        teardownTimerRef.current = null;
        void teacher.stop();
        void leave();
      }, AUDIO_DRAIN_MS);

      // 3. Persist progress concurrently
      try {
        await recordLessonProgress({
          lessonId: id || '',
          status: 'completed',
          currentActivity: 1,
          xpEarned: payload.xp_earned || lesson?.xp_reward || 0,
          minutesPracticed: payload.minutes_practiced,
        });
      } catch (err) {
        setProgressError(err instanceof Error ? err.message : 'Could not save your progress.');
      }
    },
    [id, lesson, teacher, leave, call]
  );
  handleLessonCompleteRef.current = handleLessonComplete;

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.deepIndigo,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.lumioCoral} />
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.deepIndigo,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.lumioCoral}
          style={{ marginBottom: 16 }}
        />
        <Text
          style={{
            fontFamily: 'Fredoka_700Bold',
            color: colors.cream,
            fontSize: 20,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Error Loading Lesson
        </Text>
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_500Medium',
            color: colors.lavenderMist,
            fontSize: 13,
            textAlign: 'center',
            marginBottom: 24,
            opacity: 0.8,
          }}
        >
          {error || 'Lesson not found'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-6 py-3 rounded-full bg-slate-800 border border-slate-700"
        >
          <Text
            style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }}
            className="text-xs"
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.deepIndigo,
        paddingTop: topInset,
        paddingBottom: bottomInset,
      }}
    >
      {/* ─── Connecting / Joining Overlay ─── */}
      {(status === 'connecting' || status === 'joining') && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            backgroundColor: colors.deepIndigo,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}
        >
          <ActivityIndicator size="large" color={colors.lumioCoral} />
          <Text
            style={{
              fontFamily: 'Fredoka_700Bold',
              color: colors.cream,
              fontSize: 20,
              marginTop: 24,
              textAlign: 'center',
            }}
          >
            {status === 'joining' ? 'Joining call…' : 'Connecting…'}
          </Text>
          <View
            className="flex-row items-center mt-3 rounded-full px-4 py-2"
            style={{ backgroundColor: 'rgba(30,27,60,0.6)' }}
          >
            <View
              className="w-7 h-7 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: 'rgba(94,90,128,0.4)' }}
            >
              <Ionicons name="person" size={16} color={colors.cream} />
            </View>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.cream,
                fontSize: 13,
              }}
            >
              {user?.email ?? 'Learner'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 rounded-full border border-slate-700"
          >
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.lavenderMist,
                fontSize: 12,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Header & Connection Error ─── */}
      <View style={{ flexShrink: 0, zIndex: 10 }}>
        <LessonHeader
          languageFlag={language?.flag}
          languageName={language?.name}
          lessonOrder={lesson.order}
          lessonTitle={lesson.title}
          xpReward={lesson.xp_reward}
          onBack={() => router.back()}
        />

        {/* Call Connection Error Banner */}
        {status === 'error' && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              padding: 16,
              borderRadius: 20,
              backgroundColor: 'rgba(255,107,87,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(94,90,128,0.25)',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="alert-circle-outline"
              size={28}
              color={colors.lumioCoral}
              style={{ marginBottom: 8 }}
            />
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.cream,
                fontSize: 13,
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              Couldn&apos;t connect to the audio call
            </Text>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.lavenderMist,
                fontSize: 11,
                textAlign: 'center',
                marginBottom: 12,
                opacity: 0.75,
              }}
            >
              {errorMessage}
            </Text>
            <TouchableOpacity
              onPress={() => void retry()}
              style={{
                backgroundColor: colors.lumioCoral,
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.cream,
                  fontSize: 12,
                }}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ─── Center Stage: Mascot + Captions Slot ─── */}
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, minHeight: 0 }}
      >
        <MascotStage
          callStatus={status}
          teacherStatus={teacher.status}
          isMuted={isMuted}
          onRetryTeacher={() => void teacher.retry()}
        />
        <View style={{ marginTop: 16, width: '100%', maxWidth: 440 }}>
          <LessonCaptionsSlot
            languageName={language?.name}
            showCaptions={showCaptions}
            captionText={captionText}
            isLive={captionsActive}
          />
        </View>
      </View>

      {/* ─── Audio Controls ─── */}
      <View
        style={{
          flexShrink: 0,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
          minHeight: 96,
          justifyContent: 'center',
        }}
      >
        <AudioControls
          isMuted={isMuted}
          isCallJoined={status === 'joined'}
          showCaptions={showCaptions}
          onToggleMute={() => void toggleMute()}
          onToggleCaptions={() => setShowCaptions(!showCaptions)}
        />
      </View>

      {/* ─── Summary Modal ─── */}
      <LessonSummaryModal
        visible={showSummary}
        xpReward={lesson.xp_reward}
        progressError={progressError}
        userFeedback={userFeedback}
        onChangeFeedback={setUserFeedback}
        onRetryProgress={() => {
          if (lastPayloadRef.current) void handleLessonComplete(lastPayloadRef.current);
        }}
        onClaimRewards={() => {
          setShowSummary(false);
          router.replace('/(tabs)/learn');
        }}
      />
    </View>
  );
}
