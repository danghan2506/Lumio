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
import type { UnitRow } from '@/types/database.types';
import type { UnitProgressSummary } from '@/lib/api';

export interface UnitSelectorModalProps {
  visible: boolean;
  units: UnitRow[];
  activeUnitId: string | null;
  unitsProgress: Record<string, UnitProgressSummary>;
  onSelectUnit: (unit: UnitRow) => void;
  onClose: () => void;
}

export function UnitSelectorModal({
  visible,
  units,
  activeUnitId,
  unitsProgress,
  onSelectUnit,
  onClose,
}: UnitSelectorModalProps) {
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
          testID="unit-selector-backdrop"
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close unit selector"
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
          testID="unit-selector-modal"
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
              Select Unit
            </Text>
            <TouchableOpacity
              testID="unit-selector-close-button"
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close unit selector"
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(36, 27, 74, 0.05)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={20} color={colors.deepIndigo} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Unit List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 20,
            }}
          >
            {units.map((unit) => {
              const progress = unitsProgress[unit.id] ?? {
                completedCount: 0,
                totalCount: 0,
                isCompleted: false,
                isLocked: false,
              };

              const isActive = activeUnitId === unit.id;
              const isLocked = Boolean(progress.isLocked);
              const isCompleted = Boolean(progress.isCompleted);
              const percentage =
                progress.totalCount > 0
                  ? Math.min(
                      100,
                      Math.round((progress.completedCount / progress.totalCount) * 100)
                    )
                  : 0;

              const handlePress = () => {
                if (isLocked) {
                  return;
                }
                onSelectUnit(unit);
              };

              // Border and background styling based on active / locked state
              const cardBorderColor = isActive
                ? colors.lumioCoral
                : isLocked
                ? 'rgba(36, 27, 74, 0.06)'
                : 'rgba(36, 27, 74, 0.08)';

              const cardBgColor = isActive
                ? 'rgba(234, 230, 255, 0.6)'
                : isLocked
                ? 'rgba(36, 27, 74, 0.03)'
                : '#FFFFFF';

              return (
                <TouchableOpacity
                  key={unit.id}
                  testID={`unit-option-${unit.id}`}
                  onPress={handlePress}
                  disabled={isLocked}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${unit.title}, ${isLocked ? 'locked' : isCompleted ? 'completed' : 'unlocked'}, ${progress.completedCount} of ${progress.totalCount} lessons completed${isActive ? ', currently selected' : ''}`}
                  accessibilityState={{
                    selected: isActive,
                    disabled: isLocked,
                  }}
                  style={{
                    minHeight: 80,
                    marginBottom: 12,
                    padding: 14,
                    borderRadius: 20,
                    borderWidth: isActive ? 2 : 1,
                    borderColor: cardBorderColor,
                    backgroundColor: cardBgColor,
                    opacity: isLocked ? 0.6 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  {/* Unit Emoji / Icon Container */}
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      backgroundColor: isCompleted
                        ? 'rgba(53, 208, 160, 0.15)'
                        : isActive
                        ? 'rgba(255, 107, 87, 0.15)'
                        : 'rgba(36, 27, 74, 0.05)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{unit.icon_emoji}</Text>
                  </View>

                  {/* Unit Information & Progress */}
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Fredoka_700Bold',
                          color: isLocked ? colors.slate : colors.deepIndigo,
                          fontSize: 16,
                          flexShrink: 1,
                        }}
                        numberOfLines={1}
                      >
                        {unit.title}
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

                    {Boolean(unit.description) && (
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans_500Medium',
                          color: colors.slate,
                          fontSize: 12,
                          marginBottom: 6,
                        }}
                        numberOfLines={1}
                      >
                        {unit.description}
                      </Text>
                    )}

                    {/* Progress Bar & Lessons Counter */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: unit.description ? 0 : 4,
                      }}
                    >
                      <View
                        style={{
                          flex: 1,
                          height: 6,
                          backgroundColor: 'rgba(36, 27, 74, 0.08)',
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 8,
                        }}
                      >
                        <View
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: isCompleted
                              ? colors.mint
                              : colors.lumioCoral,
                            height: '100%',
                            borderRadius: 999,
                          }}
                        />
                      </View>

                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans_500Medium',
                          color: colors.slate,
                          fontSize: 11,
                        }}
                      >
                        {progress.completedCount} / {progress.totalCount} lessons
                      </Text>
                    </View>
                  </View>

                  {/* Status Badges */}
                  <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
                    {isLocked ? (
                      <View testID={`unit-lock-${unit.id}`}>
                        <Ionicons
                          name="lock-closed"
                          size={20}
                          color={colors.slate}
                        />
                      </View>
                    ) : isCompleted ? (
                      <View testID={`unit-completed-${unit.id}`}>
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={colors.mint}
                        />
                      </View>
                    ) : isActive ? (
                      <Ionicons
                        name="radio-button-on"
                        size={20}
                        color={colors.lumioCoral}
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
}
