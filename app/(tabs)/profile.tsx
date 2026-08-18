import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenWrapper } from '@/components/navigation/TabScreenWrapper';
import {
  ProfileHeaderCard,
  ActiveLanguageCard,
  LearningStatsGrid,
  ProfileActionSection,
  ProfileSkeletonLoader,
} from '@/components/profile';
import { useProfileData } from '@/hooks/useProfileData';
import { useAuth } from '@/hooks/useAuth';
import { useLanguageStore } from '@/store/useLanguageStore';
import { languages } from '@/data/languages';
import { colors } from '@/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { selectedLanguage } = useLanguageStore();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const currentLanguage =
    languages.find((l) => l.id === selectedLanguage) ??
    languages.find((l) => l.id === 'es') ??
    languages[0];

  const {
    profileOverview,
    loading,
    refreshing,
    uploadingAvatar,
    error,
    isGuest,
    refresh,
    updateAvatar,
  } = useProfileData();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Failed to sign out:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSwitchLanguage = () => {
    router.push('/(tabs)/learn');
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <TabScreenWrapper>
        <ScrollView
          testID="profile-scroll-view"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 40,
            gap: 16,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[colors.lumioCoral]}
              tintColor={colors.cream}
            />
          }
        >
          {loading && !profileOverview && !refreshing ? (
            <ProfileSkeletonLoader />
          ) : error && !profileOverview && !isGuest ? (
            <View
              style={{
                backgroundColor: 'rgba(255, 107, 87, 0.1)',
                borderRadius: 24,
                padding: 24,
                borderWidth: 1,
                borderColor: 'rgba(255, 107, 87, 0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 24,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(255, 107, 87, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={32}
                  color={colors.lumioCoral}
                />
              </View>
              <Text
                style={{
                  fontFamily: 'Fredoka_700Bold',
                  fontSize: 20,
                  color: colors.cream,
                  textAlign: 'center',
                }}
              >
                Failed to load profile
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  fontSize: 14,
                  color: colors.lavenderMist,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {error}
              </Text>
              <TouchableOpacity
                onPress={refresh}
                accessibilityRole="button"
                accessibilityLabel="Try again"
                style={{
                  marginTop: 8,
                  minHeight: 48,
                  backgroundColor: colors.lumioCoral,
                  borderRadius: 9999,
                  paddingHorizontal: 28,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={18} color={colors.cream} />
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans_700Bold',
                    fontSize: 15,
                    color: colors.cream,
                  }}
                >
                  Try again
                </Text>
              </TouchableOpacity>
            </View>
          ) : profileOverview ? (
            <>
              {/* 1. Header Profile Card */}
              <ProfileHeaderCard
                userId={profileOverview.id}
                email={profileOverview.email}
                displayName={profileOverview.displayName ?? 'Lumio Learner'}
                avatarUrl={profileOverview.avatarUrl}
                joinedDate={profileOverview.createdAt}
                uploadingAvatar={uploadingAvatar}
                onAvatarChange={async (uri) => {
                  await updateAvatar(uri);
                }}
              />

              {/* 2. Active Language Card */}
              <ActiveLanguageCard
                activeLanguage={
                  profileOverview.activeLanguage
                    ? {
                        id: profileOverview.activeLanguage.id,
                        name: profileOverview.activeLanguage.name,
                        nativeName: profileOverview.activeLanguage.nativeName,
                        flag: profileOverview.activeLanguage.flag,
                        startedAt: profileOverview.createdAt,
                      }
                    : null
                }
                onSwitchLanguage={handleSwitchLanguage}
              />

              {/* 3. Learning Stats Grid (2x2) */}
              <LearningStatsGrid
                totalXp={profileOverview.stats.totalXp}
                completedLessons={profileOverview.stats.completedLessons}
                masteredWords={profileOverview.stats.masteredWords}
                daysActive={profileOverview.stats.daysActive}
              />

              {/* 4. Action Section (Sign out & Footer) */}
              <ProfileActionSection
                onSignOut={handleSignOut}
                isSigningOut={isSigningOut}
                isGuest={false}
              />
            </>
          ) : (
            <>
              {/* Guest Profile State */}
              <ProfileHeaderCard
                userId={user?.id ?? 'guest'}
                email={user?.email ?? null}
                displayName={user?.user_metadata?.full_name ?? 'Guest Learner'}
                avatarUrl={null}
                joinedDate={user?.created_at ?? new Date().toISOString()}
                uploadingAvatar={false}
              />

              <ActiveLanguageCard
                activeLanguage={{
                  id: currentLanguage.id,
                  name: currentLanguage.name,
                  nativeName: currentLanguage.nativeName,
                  flag: currentLanguage.flag,
                  startedAt: new Date().toISOString(),
                }}
                onSwitchLanguage={handleSwitchLanguage}
              />

              <LearningStatsGrid
                totalXp={0}
                completedLessons={0}
                masteredWords={0}
                daysActive={1}
              />

              <ProfileActionSection
                onSignOut={handleSignOut}
                isSigningOut={isSigningOut}
                isGuest={!user}
                onSignIn={handleSignIn}
              />
            </>
          )}
        </ScrollView>
      </TabScreenWrapper>
    </SafeAreaView>
  );
}

