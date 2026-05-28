import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  fullWidth = true,
  style,
  accessibilityLabel,
}) => {
  const { colors, spacing, typography, radius } = useTheme();

  const backgroundColor =
    variant === 'primary'
      ? colors.primaryGreen
      : variant === 'secondary'
      ? colors.primaryYellow
      : 'transparent';

  const textColor =
    variant === 'primary'
      ? colors.textInverse
      : variant === 'secondary'
      ? colors.textPrimary
      : variant === 'outline'
      ? colors.primaryGreen
      : colors.textPrimary;

  const borderColor =
    variant === 'outline' ? colors.primaryGreen : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? colors.gray : backgroundColor,
          borderRadius: radius.md,
          borderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          minHeight: 44,
          minWidth: 44,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={{
            color: disabled ? colors.textDisabled : textColor,
            fontSize: typography.fontSizeSm,
            fontFamily: typography.fontFamilyMedium,
          }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Button;