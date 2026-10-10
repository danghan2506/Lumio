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
      <View className="flex-1 justify-end">
        {/* Backdrop Tap Target */}
        <TouchableOpacity
          testID="language-switcher-backdrop"
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close language picker"
          className="absolute inset-0 bg-black/60"
        />

        {/* Bottom Sheet Container */}
        <View
          testID="language-switcher-modal"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          className="bg-warm-ivory rounded-t-[32px] border-t border-l border-r border-deep-indigo/8 max-h-[85%] w-full"
        >
          {/* Sheet Handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded bg-deep-indigo/15" />
          </View>

          {/* Header Bar */}
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-deep-indigo/8">
            <Text className="text-xl font-display text-deep-indigo">
              Choose Language
            </Text>
            <TouchableOpacity
              testID="language-switcher-close-button"
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close language picker"
              className="w-11 h-11 rounded-full bg-deep-indigo/5 items-center justify-center shrink-0"
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
                  className={`min-h-[72px] mb-3 p-3.5 rounded-[20px] flex-row items-center border ${
                    isActive
                      ? 'border-2 border-lumio-coral bg-lavender-mist/60'
                      : 'bg-warm-ivory border-deep-indigo/8'
                  }`}
                >
                  {/* Flag Badge */}
                  <View className="w-12 h-12 rounded-full bg-lavender-mist/50 border-[1.5px] border-deep-indigo/8 items-center justify-center mr-3">
                    <Text className="text-[26px]">{lang.flag}</Text>
                  </View>

                  {/* Language Info */}
                  <View className="flex-1 min-w-0 mr-2.5">
                    <View className="flex-row items-center mb-0.5">
                      <Text
                        className="text-lg font-display text-deep-indigo shrink"
                        numberOfLines={1}
                      >
                        {lang.name}
                      </Text>

                      {isActive && (
                        <View className="bg-lumio-coral/15 border border-lumio-coral/30 rounded-xl px-2 py-0.5 ml-1.5">
                          <Text className="text-[10px] font-sans-bold text-lumio-coral">
                            ACTIVE
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      className="text-[13px] font-sans text-slate"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {lang.nativeName}
                      {lang.learnerCount ? `  •  ${lang.learnerCount}` : ''}
                    </Text>
                  </View>

                  {/* Status Indicator */}
                  <View className="w-7 items-center justify-center shrink-0">
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
