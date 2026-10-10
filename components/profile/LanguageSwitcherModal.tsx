import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { languages } from '@/data/languages';
import type { Language } from '@/types/learning';

export interface LanguageSwitcherModalProps {
  visible: boolean;
  activeLanguageId: string | null;
  onSelect: (language: Language) => void;
  onClose: () => void;
}

export const LanguageSwitcherModal: React.FC<LanguageSwitcherModalProps> = ({
  visible,
  activeLanguageId,
  onSelect,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Backdrop Tap Target */}
        <TouchableOpacity
          testID="language-switcher-backdrop"
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close language picker"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}
        />

        {/* Bottom Sheet Container */}
        <View
          testID="language-switcher-modal"
          style={{
            backgroundColor: colors.warmIvory,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: 'rgba(36, 27, 74, 0.08)',
            maxHeight: '85%',
            paddingBottom: Math.max(insets.bottom, 20),
            width: '100%',
          }}
        >
          {/* Sheet Handle */}
          <View className="items-center pt-3 pb-1">
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(36, 27, 74, 0.15)',
              }}
            />
          </View>

          {/* Header Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(36, 27, 74, 0.08)',
            }}
          >
            <Text
              style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
              className="text-xl"
            >
              Choose Language
            </Text>
            <TouchableOpacity
              testID="language-switcher-close-button"
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close language picker"
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(36, 27, 74, 0.05)',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Ionicons name="close" size={20} color={colors.deepIndigo} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Language List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 20,
            }}
          >
            {languages.map((lang) => {
              const isActive = activeLanguageId === lang.id;

              return (
                <TouchableOpacity
                  key={lang.id}
                  testID={`language-option-${lang.id}`}
                  onPress={() => onSelect(lang)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${lang.name}${isActive ? ', currently active' : ''}`}
                  accessibilityState={{ selected: isActive }}
                  style={{
                    minHeight: 72,
                    marginBottom: 12,
                    padding: 14,
                    borderRadius: 20,
                    borderWidth: isActive ? 2 : 1,
                    borderColor: isActive
                      ? colors.lumioCoral
                      : 'rgba(36, 27, 74, 0.08)',
                    backgroundColor: isActive
                      ? 'rgba(234, 230, 255, 0.6)'
                      : colors.warmIvory,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  {/* Flag Badge */}
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: 'rgba(234, 230, 255, 0.5)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(36, 27, 74, 0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 26 }}>{lang.flag}</Text>
                  </View>

                  {/* Language Info */}
                  <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Fredoka_700Bold',
                          color: colors.deepIndigo,
                          fontSize: 18,
                          flexShrink: 1,
                        }}
                        numberOfLines={1}
                      >
                        {lang.name}
                      </Text>

                      {isActive && (
                        <View
                          style={{
                            backgroundColor: 'rgba(255, 107, 87, 0.15)',
                            borderColor: 'rgba(255, 107, 87, 0.3)',
                            borderWidth: 1,
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            marginLeft: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: 'PlusJakartaSans_700Bold',
                              color: colors.lumioCoral,
                              fontSize: 10,
                            }}
                          >
                            ACTIVE
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans_500Medium',
                        color: colors.slate,
                        fontSize: 13,
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {lang.nativeName}
                      {lang.learnerCount ? `  •  ${lang.learnerCount}` : ''}
                    </Text>
                  </View>

                  {/* Status Indicator */}
                  <View
                    style={{
                      width: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isActive ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.mint}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.slate}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
