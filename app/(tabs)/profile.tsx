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
  LanguageSwitcherModal,
} from '@/components/profile';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast, useToast } from '@/components/ui/Toast';
import { useProfileData } from '@/hooks/useProfileData';
import { useAuth } from '@/hooks/useAuth';
import { resolveDisplayName } from '@/lib/displayName';
import { setActiveLanguage } from '@/lib/api';
import { useLanguageStore } from '@/store/useLanguageStore';
import { languages } from '@/data/languages';
import type { Language } from '@/types/learning';
import { colors } from '@/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { selectedLanguage, setSelectedLanguage } = useLanguageStore();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Language | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const toast = useToast();

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
    updateDisplayName,
  } = useProfileData({ languageId: selectedLanguage ?? undefined });

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
    setSwitcherVisible(true);
  };

  const handleSelectLanguage = (language: Language) => {
    setSwitcherVisible(false);
    if (language.id === (profileOverview?.activeLanguage?.id ?? selectedLanguage)) {
      return;
    }
    setConfirmTarget(language);
  };

  const handleConfirmSwitch = async () => {
    if (!confirmTarget || isSwitching) {
      return;
    }
    const target = confirmTarget;
    const previous = selectedLanguage;
    setSelectedLanguage(target.id);
    if (!user) {
      setConfirmTarget(null);
      await refresh();
      router.replace('/(tabs)');
      toast.show({ message: `Switched to ${target.name}.`, type: 'success' });
      return;
    }
    setIsSwitching(true);
    try {
      await setActiveLanguage(target.id);
    } catch {
      if (previous) {
        setSelectedLanguage(previous);
      } else {
        setSelectedLanguage('en');
      }
      setIsSwitching(false);
      setConfirmTarget(null);
      toast.show({ message: "Couldn't switch language. Please try again.", type: 'error' });
      return;
    }
    setConfirmTarget(null);
    await refresh();
    setIsSwitching(false);
    router.replace('/(tabs)');
    toast.show({
      message: `Switched to ${target.name}. Your progress is saved per language.`,
      type: 'success',
    });
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
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
              tintColor={colors.deepIndigo}
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
                  color: colors.deepIndigo,
                  textAlign: 'center',
                }}
              >
                Failed to load profile
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  fontSize: 14,
                  color: colors.slate,
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
                onDisplayNameChange={async (name) => {
                  await updateDisplayName(name);
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
                        startedAt:
                          profileOverview.activeLanguageStartedAt ??
                          profileOverview.createdAt,
                      }
                    : {
                        id: currentLanguage.id,
                        name: currentLanguage.name,
                        nativeName: currentLanguage.nativeName,
                        flag: currentLanguage.flag,
                        startedAt: profileOverview.createdAt,
                      }
                }
                onSwitchLanguage={handleSwitchLanguage}
              />

              {/* 3. Learning Stats Grid (2x2) */}
              <LearningStatsGrid
                totalXp={profileOverview.stats.totalXp}
                completedLessons={profileOverview.stats.completedLessons}
                masteredWords={profileOverview.stats.masteredWords}
                daysActive={profileOverview.stats.daysActive}
                currentStreak={profileOverview.stats.currentStreak}
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
                displayName={resolveDisplayName(
                  null,
                  user?.user_metadata?.full_name as string | undefined,
                  user?.user_metadata?.name as string | undefined,
                  user?.email
                )}
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
                daysActive={0}
                currentStreak={0}
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

        {/* Language Switcher */}
        <LanguageSwitcherModal
          visible={switcherVisible}
          activeLanguageId={profileOverview?.activeLanguage?.id ?? selectedLanguage}
          onSelect={handleSelectLanguage}
          onClose={() => setSwitcherVisible(false)}
        />
        <ConfirmDialog
          testID="lang-confirm"
          visible={confirmTarget !== null}
          title={`Switch to ${confirmTarget?.name ?? ''}?`}
          message={`Your ${currentLanguage.name} progress is saved and will be here when you come back.`}
          confirmLabel="Switch"
          onConfirm={() => void handleConfirmSwitch()}
          onCancel={() => {
            if (!isSwitching) {
              setConfirmTarget(null);
            }
          }}
          iconName="swap-horizontal"
          isConfirming={isSwitching}
        />
        <Toast ref={toast.ref} />
      </TabScreenWrapper>
    </SafeAreaView>
  );
}

