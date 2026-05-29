import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Toast, useToast } from '../../hooks/useToast';

/**
 * Individual toast item with fade-in/out animation.
 */
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const { colors, spacing, typography, radius, shadows } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss(toast.id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.sm,
          borderLeftWidth: 4,
          borderLeftColor: colors.error,
          ...shadows.medium,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text
        style={{
          flex: 1,
          fontSize: typography.fontSizeSm,
          color: colors.textPrimary,
          fontFamily: typography.fontFamilyMedium,
        }}
      >
        {toast.message}
      </Text>
      <TouchableOpacity
        onPress={handleDismiss}
        accessibilityLabel="Fechar notificação"
        accessibilityRole="button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text
          style={{
            fontSize: typography.fontSizeSm,
            color: colors.textSecondary,
            marginLeft: spacing.md,
          }}
        >
          ✕
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Renders toast notifications at the top of the screen.
 * Place this component in the root layout so toasts are visible globally.
 * Auto-dismisses after 5 seconds (handled by useToast hook).
 */
export default function ToastContainer() {
  const insets = useSafeAreaInsets();
  const { toasts, removeToast } = useToast();
  const { spacing } = useTheme();

  if (toasts.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          top: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          pointerEvents: 'box-none',
        },
      ]}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
  },
});
