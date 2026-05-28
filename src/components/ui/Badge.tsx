import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type BadgeVariant = 'success' | 'warning' | 'default';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', style, accessibilityLabel }) => {
  const { colors, spacing, typography, radius } = useTheme();

  const backgroundColor =
    variant === 'success'
      ? colors.successLight
      : variant === 'warning'
      ? colors.warningLight
      : colors.surfaceVariant;

  const textColor =
    variant === 'success'
      ? colors.success
      : variant === 'warning'
      ? colors.warning
      : colors.textSecondary;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || label}
    >
      <Text
        style={{
          color: textColor,
          fontSize: typography.fontSizeXs,
          fontFamily: typography.fontFamilyMedium,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
});

export default Badge;