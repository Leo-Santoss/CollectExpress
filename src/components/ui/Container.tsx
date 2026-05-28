import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ContainerProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

const Container: React.FC<ContainerProps> = ({ children, style }) => {
  const { spacing } = useTheme();

  return (
    <View style={[styles.base, { paddingHorizontal: spacing.lg }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
  },
});

export default Container;