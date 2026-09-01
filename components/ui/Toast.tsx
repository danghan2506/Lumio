import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { View, Text, Animated, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export type ToastType = 'success' | 'error';

export interface ToastOptions {
  message: string;
  type?: ToastType;
}

export interface ToastApi {
  show: (opts: ToastOptions) => void;
}

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

const AUTO_DISMISS_MS = 2500;
const ANIMATION_MS = 220;

const VARIANT_STYLES: Record<
  ToastType,
  { backgroundColor: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; textColor: string }
> = {
  success: {
    backgroundColor: colors.mint,
    icon: 'checkmark-circle',
    iconColor: colors.deepIndigo,
    textColor: colors.deepIndigo,
  },
  error: {
    backgroundColor: colors.lumioCoral,
    icon: 'alert-circle',
    iconColor: colors.cream,
    textColor: colors.cream,
  },
};

/**
 * Lightweight in-app toast. Mount once per screen tree and drive it through
 * the imperative ref handle returned by `useToast`:
 *
 *   const toast = useToast();
 *   <Toast ref={toast.ref} />
 *   toast.show({ message: 'Saved ✓', type: 'success' });
 */
export const Toast = forwardRef<ToastApi>(function Toast(_props, ref) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const translateY = useRef(new Animated.Value(-80)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  useEffect(() => clearHideTimer, [clearHideTimer]);

  const show = useCallback(
    ({ message, type = 'success' }: ToastOptions) => {
      clearHideTimer();
      idRef.current += 1;
      setToast({ id: idRef.current, message, type });
      AccessibilityInfo.announceForAccessibility(message);
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_MS,
        useNativeDriver: true,
      }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -80,
          duration: ANIMATION_MS,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, AUTO_DISMISS_MS);
    },
    [clearHideTimer, translateY]
  );

  useImperativeHandle(ref, () => ({ show }), [show]);

  if (!toast) {
    return null;
  }

  const variant = VARIANT_STYLES[toast.type];

  return (
    <View
      testID="toast-container"
      pointerEvents="none"
      accessibilityLiveRegion="assertive"
      style={{
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        zIndex: 1000,
        elevation: 8,
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY }],
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: variant.backgroundColor,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons name={variant.icon} size={20} color={variant.iconColor} />
        <Text
          testID="toast-message"
          numberOfLines={2}
          style={{
            flex: 1,
            fontFamily: 'PlusJakartaSans_700Bold',
            fontSize: 14,
            color: variant.textColor,
          }}
        >
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
});

/** Convenience hook: creates a ref handle and a stable `show` callback. */
export function useToast() {
  const ref = useRef<ToastApi | null>(null);
  const show = useCallback((opts: ToastOptions) => {
    ref.current?.show(opts);
  }, []);
  return { ref, show };
}
