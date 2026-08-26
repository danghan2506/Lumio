import React from 'react';
import { View, Text, Modal, Image, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '@/theme/colors';
import { images } from '@/constants/images';

export interface LessonSummaryModalProps {
  visible: boolean;
  xpReward: number;
  progressError?: string | null;
  userFeedback?: string;
  onChangeFeedback?: (text: string) => void;
  onRetryProgress?: () => void;
  onClaimRewards: () => void;
}

export function LessonSummaryModal({
  visible,
  xpReward,
  progressError,
  userFeedback = '',
  onChangeFeedback,
  onRetryProgress,
  onClaimRewards,
}: LessonSummaryModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#1A1432',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: 24,
            borderTopWidth: 1,
            borderTopColor: 'rgba(94,90,128,0.2)',
          }}
        >
          {/* Mascot Header */}
          <View style={{ alignItems: 'center', marginTop: -64, marginBottom: 12 }}>
            <Image
              source={images.lumiCelebration}
              style={{ width: 130, height: 130 }}
              resizeMode="contain"
            />
          </View>

          {/* Title & Subtitle */}
          <Text
            style={{
              fontFamily: 'Fredoka_700Bold',
              color: colors.cream,
              fontSize: 24,
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            Lesson Completed!
          </Text>
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_500Medium',
              color: colors.lavenderMist,
              fontSize: 13,
              textAlign: 'center',
              marginBottom: 24,
              opacity: 0.75,
            }}
          >
            Awesome job practicing your spoken language today.
          </Text>

          {/* XP Reward Card */}
          <View
            style={{
              backgroundColor: 'rgba(94,90,128,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(94,90,128,0.15)',
              padding: 16,
              borderRadius: 16,
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <View
              testID="xp-reward-badge"
              style={{
                backgroundColor: colors.daylightAmber,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Fredoka_700Bold',
                  color: colors.deepIndigo,
                  fontSize: 14,
                }}
              >
                +{xpReward} XP
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.cream,
                fontSize: 11,
                opacity: 0.9,
                marginTop: 4,
              }}
            >
              Daylight Amber reward ignition claimed!
            </Text>
          </View>

          {/* Progress Error State */}
          {progressError && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lumioCoral,
                  fontSize: 12,
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                Could not save your progress: {progressError}
              </Text>
              {onRetryProgress && (
                <TouchableOpacity
                  testID="retry-progress-btn"
                  onPress={onRetryProgress}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: colors.lumioCoral,
                    paddingHorizontal: 24,
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
              )}
            </View>
          )}

          {/* User Feedback Form */}
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.lavenderMist,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 8,
              opacity: 0.8,
            }}
          >
            Leave Lesson Feedback (Optional)
          </Text>
          <TextInput
            testID="feedback-input"
            placeholder="How did you find this lesson? (e.g. pronunciation feedback, speech speed...)"
            placeholderTextColor={colors.slate}
            value={userFeedback}
            onChangeText={onChangeFeedback}
            style={{
              fontFamily: 'PlusJakartaSans_500Medium',
              color: colors.cream,
              backgroundColor: 'rgba(255,255,255,0.03)',
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(94,90,128,0.2)',
              marginBottom: 24,
              fontSize: 13,
              textAlignVertical: 'top',
            }}
            multiline={true}
            numberOfLines={3}
          />

          {/* Claim Rewards Primary CTA Button */}
          <TouchableOpacity
            testID="claim-rewards-btn"
            onPress={() => {
              if (progressError) return;
              onClaimRewards();
            }}
            disabled={Boolean(progressError)}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.lumioCoral,
              minHeight: 52,
              borderRadius: 999,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 14,
              marginBottom: 8,
              opacity: progressError ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontFamily: 'Fredoka_700Bold',
                color: colors.cream,
                fontSize: 16,
              }}
            >
              Claim Rewards
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
