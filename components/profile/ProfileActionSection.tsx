import React from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface ProfileActionSectionProps {
  onSignOut: () => Promise<void> | void;
  isSigningOut?: boolean;
}

export const ProfileActionSection: React.FC<ProfileActionSectionProps> = ({
  onSignOut,
  isSigningOut = false,
}) => {
  const handleSignOutPress = () => {
    if (isSigningOut) return;

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            void onSignOut();
          },
        },
      ]
    );
  };

  return (
    <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 32 }}>
      {/* Sign Out Button */}
      <Pressable
        testID="sign-out-button"
        onPress={handleSignOutPress}
        disabled={isSigningOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out of your Lumio account"
        style={({ pressed }) => ({
          width: '100%',
          minHeight: 48,
          borderRadius: 9999,
          backgroundColor: 'rgba(255, 107, 87, 0.12)',
          borderWidth: 1.5,
          borderColor: colors.lumioCoral,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 14,
          gap: 8,
          opacity: isSigningOut ? 0.7 : pressed ? 0.85 : 1,
          transform: [{ translateY: pressed && !isSigningOut ? 1 : 0 }],
        })}
      >
        {isSigningOut ? (
          <>
            <ActivityIndicator
              testID="sign-out-loading-indicator"
              size="small"
              color={colors.lumioCoral}
            />
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_700Bold',
                fontSize: 16,
                color: colors.lumioCoral,
              }}
            >
              Signing out...
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color={colors.lumioCoral} />
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_700Bold',
                fontSize: 16,
                color: colors.lumioCoral,
              }}
            >
              Sign Out
            </Text>
          </>
        )}
      </Pressable>

      {/* App Version / Academic Attribution Footer */}
      <View style={{ marginTop: 16, alignItems: 'center', gap: 4 }}>
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_500Medium',
            fontSize: 12,
            color: colors.slate,
            letterSpacing: 0.2,
          }}
        >
          Lumio · Academic Capstone Edition
        </Text>
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_400Regular',
            fontSize: 11,
            color: 'rgba(94, 90, 128, 0.7)',
          }}
        >
          Version 1.0.0
        </Text>
      </View>
    </View>
  );
};
