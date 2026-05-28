import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { StatusAluguel } from '../../types/order';

const STATUS_LABELS: Record<StatusAluguel, string> = {
  AGUARDANDO_ENTREGA: 'Aguardando Entrega',
  EM_USO: 'Em Uso',
  AGUARDANDO_RETIRADA: 'Aguardando Retirada',
  FINALIZADO: 'Finalizado',
};

export interface StatusChipProps {
  status: StatusAluguel;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ status, style, accessibilityLabel }) => {
  const { statusColors, spacing, typography, radius } = useTheme();

  const colorConfig = statusColors[status];
  const label = STATUS_LABELS[status];

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colorConfig.background,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `Status: ${label}`}
    >
      <Text
        style={{
          color: colorConfig.text,
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
  chip: {
    alignSelf: 'flex-start',
  },
});

export default StatusChip;
